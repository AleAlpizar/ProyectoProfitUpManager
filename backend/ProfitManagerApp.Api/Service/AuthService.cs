using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using System.Security.Cryptography;

public class AuthService
{
    private readonly string _cn;

    public AuthService(IConfiguration cfg)
    {
        _cn = cfg.GetConnectionString("Default")!;
    }

    public static string HashPassword(string password, string? salt, int iter = 100_000)
    {
        salt ??= Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            Convert.FromBase64String(salt),
            iter, HashAlgorithmName.SHA256, 32);
        return $"{salt}:{Convert.ToBase64String(hash)}";
    }

    public static bool VerifyPassword(string password, string stored)
    {
        var parts = stored.Split(':');
        if (parts.Length != 2) return false;
        var salt = parts[0];
        var expected = parts[1];
        var computed = Rfc2898DeriveBytes.Pbkdf2(
            password,
            Convert.FromBase64String(salt),
            100_000, HashAlgorithmName.SHA256, 32);
        return Convert.ToBase64String(computed) == expected;
    }

    public async Task<int> CreateUserAsync(RegisterUserDto dto, int? createdBy)
    {
        var salt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
        var hash = HashPassword(dto.Password, salt);

        try
        {
            using var sql = new SqlConnection(_cn);
            var usuarioId = await sql.ExecuteScalarAsync<int>(
                "dbo.usp_Usuario_Create",
                new { dto.Nombre, dto.Apellido, Correo = dto.Correo, PasswordHash = hash, Salt = (string?)salt, dto.Telefono, CreatedBy = createdBy },
                commandType: CommandType.StoredProcedure
            );

            await sql.ExecuteAsync(
                "dbo.usp_UsuarioRol_AssignOrUpdate",
                new { UsuarioID = usuarioId, NombreRol = dto.Rol, AssignedBy = createdBy },
                commandType: CommandType.StoredProcedure
            );

            return usuarioId;
        }
        catch (SqlException ex) when (ex.Number is 2601 or 2627)
        { throw new ApplicationException("EMAIL_DUPLICATE"); }
        catch (SqlException ex) when (ex.Message.Contains("EMAIL_DUPLICATE"))
        { throw new ApplicationException("EMAIL_DUPLICATE"); }
    }

    public async Task<(int userId, string nombre, string? apellido, string correo, string rol, string pwdHash)?> GetByCorreoAsync(string correo)
    {
        using var sql = new SqlConnection(_cn);
        var row = await sql.QueryFirstOrDefaultAsync(
            "dbo.usp_Usuario_GetByCorreo",
            new { Correo = correo },
            commandType: CommandType.StoredProcedure
        );
        if (row == null) return null;

        int userId = row.UsuarioID;
        string nombre = row.Nombre;
        string correoOut = row.Correo;
        string rol = (string?)row.NombreRol ?? "Empleado";
        string? apellido = row.Apellido as string;
        string pwdHash = row.PasswordHash;

        return (userId, nombre, apellido, correoOut, rol, pwdHash);
    }

    public async Task CreateSessionAsync(int userId, string token, DateTime expireAt, string? device, string? ip)
    {
        using var sql = new SqlConnection(_cn);
        await sql.ExecuteAsync("dbo.usp_Sesion_Create",
            new { UsuarioID = userId, Token = token, DeviceInfo = device, IP = ip, ExpireAt = expireAt },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<int> InvalidateSessionAsync(string token)
    {
        using var sql = new SqlConnection(_cn);
        return await sql.ExecuteScalarAsync<int>("dbo.usp_Sesion_Invalidate",
            new { Token = token }, commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateUserRoleAsync(int usuarioId, string rol, int? by)
    {
        using var sql = new SqlConnection(_cn);
        await sql.ExecuteAsync("dbo.usp_UsuarioRol_AssignOrUpdate",
            new { UsuarioID = usuarioId, NombreRol = rol, AssignedBy = by },
            commandType: CommandType.StoredProcedure);
    }

    public record UserListItem(int UsuarioID, string Nombre, string? Apellido, string Correo, string Rol, bool IsActive);

    public async Task<IEnumerable<UserListItem>> GetUsersAsync()
    {
        using var sql = new SqlConnection(_cn);
        var data = await sql.QueryAsync<UserListItem>(
            "dbo.usp_Usuario_List",
            commandType: CommandType.StoredProcedure
        );
        return data;
    }

    public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword, string? currentToken)
    {
        using var sql = new SqlConnection(_cn);
        await sql.OpenAsync();
        using var tx = sql.BeginTransaction();

        var row = await sql.QueryFirstOrDefaultAsync<(int UsuarioID, string PasswordHash)>(@"
            SELECT TOP 1 UsuarioID, PasswordHash
            FROM dbo.Usuario
            WHERE UsuarioID = @uid AND IsActive = 1
        ", new { uid = userId }, tx);

        if (row.UsuarioID == 0)
        { tx.Rollback(); return false; }

        if (!VerifyPassword(currentPassword, row.PasswordHash))
        { tx.Rollback(); return false; }

        var salt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
        var newHash = HashPassword(newPassword, salt);

        await sql.ExecuteAsync(@"
            UPDATE dbo.Usuario
            SET PasswordHash = @pwd, Salt = @salt, UpdatedAt = SYSUTCDATETIME()
            WHERE UsuarioID = @uid
        ", new { pwd = newHash, salt, uid = userId }, tx);

        await sql.ExecuteAsync(@"
            UPDATE dbo.Sesion
            SET IsActive = 0
            WHERE UsuarioID = @uid AND IsActive = 1
              AND (@tok IS NULL OR Token <> @tok)
        ", new { uid = userId, tok = currentToken }, tx);

        tx.Commit();
        return true;
    }

    public async Task ResetPasswordAsync(int userId, string newPassword)
    {
        using var sql = new SqlConnection(_cn);
        await sql.OpenAsync();
        using var tx = sql.BeginTransaction();

        var salt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
        var newHash = HashPassword(newPassword, salt);

        await sql.ExecuteAsync(@"
            UPDATE dbo.Usuario
            SET PasswordHash = @pwd, Salt = @salt, UpdatedAt = SYSUTCDATETIME()
            WHERE UsuarioID = @uid
        ", new { pwd = newHash, salt, uid = userId }, tx);

        await sql.ExecuteAsync(@"
            UPDATE dbo.Sesion SET IsActive = 0
            WHERE UsuarioID = @uid AND IsActive = 1
        ", new { uid = userId }, tx);

        tx.Commit();
    }
}

using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

public class AuthService
{
    private readonly string _cn;

    public AuthService(IConfiguration cfg)
    {
        _cn = cfg.GetConnectionString("Default")
              ?? throw new InvalidOperationException("Connection string 'Default' no configurada.");
    }

    public static string NormalizeEmail(string? email)
        => (email ?? string.Empty).Trim().ToLowerInvariant();

    public static bool IsValidEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        email = email.Trim();
        return Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$");
    }

    public static bool IsStrongPassword(string? password)
    {
        if (string.IsNullOrWhiteSpace(password)) return false;
        return password.Length >= 8
            && password.Any(char.IsUpper)
            && password.Any(char.IsLower)
            && password.Any(char.IsDigit);
    }

    public static string HashPassword(string password, string? salt, int iter = 100_000)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("La contraseña es obligatoria.", nameof(password));

        salt ??= Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));

        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            Convert.FromBase64String(salt),
            iter,
            HashAlgorithmName.SHA256,
            32);

        return $"{salt}:{Convert.ToBase64String(hash)}";
    }

    public static bool VerifyPassword(string password, string stored)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(stored))
            return false;

        var parts = stored.Split(':', StringSplitOptions.TrimEntries);
        if (parts.Length != 2) return false;

        try
        {
            var saltBytes = Convert.FromBase64String(parts[0]);
            var expectedBytes = Convert.FromBase64String(parts[1]);

            var computed = Rfc2898DeriveBytes.Pbkdf2(
                password,
                saltBytes,
                100_000,
                HashAlgorithmName.SHA256,
                32);

            return CryptographicOperations.FixedTimeEquals(computed, expectedBytes);
        }
        catch
        {
            return false;
        }
    }

    public async Task<int> CreateUserAsync(RegisterUserDto dto, int? createdBy)
    {
        if (dto is null) throw new ArgumentNullException(nameof(dto));

        var correo = NormalizeEmail(dto.Correo);
        var nombre = dto.Nombre?.Trim();
        var apellido = dto.Apellido?.Trim();
        var telefono = dto.Telefono?.Trim();
        var rol = dto.Rol?.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre es obligatorio.");

        if (!IsValidEmail(correo))
            throw new ArgumentException("El correo no es válido.");

        if (!IsStrongPassword(dto.Password))
            throw new ArgumentException("La contraseña no cumple los requisitos mínimos de seguridad.");

        if (string.IsNullOrWhiteSpace(rol))
            throw new ArgumentException("El rol es obligatorio.");

        var salt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
        var hash = HashPassword(dto.Password, salt);

        try
        {
            using var sql = new SqlConnection(_cn);

            var usuarioId = await sql.ExecuteScalarAsync<int>(
                "dbo.usp_Usuario_Create",
                new
                {
                    Nombre = nombre,
                    Apellido = apellido,
                    Correo = correo,
                    PasswordHash = hash,
                    Salt = (string?)salt,
                    Telefono = telefono,
                    CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure
            );

            await sql.ExecuteAsync(
                "dbo.usp_UsuarioRol_AssignOrUpdate",
                new { UsuarioID = usuarioId, NombreRol = rol, AssignedBy = createdBy },
                commandType: CommandType.StoredProcedure
            );

            await sql.ExecuteAsync(
                @"UPDATE dbo.Usuario SET EstadoUsuario = 'ACTIVE' WHERE UsuarioID = @uid",
                new { uid = usuarioId }
            );

            return usuarioId;
        }
        catch (SqlException ex) when (ex.Number is 2601 or 2627)
        {
            throw new ApplicationException("EMAIL_DUPLICATE");
        }
        catch (SqlException ex) when (ex.Message.Contains("EMAIL_DUPLICATE", StringComparison.OrdinalIgnoreCase))
        {
            throw new ApplicationException("EMAIL_DUPLICATE");
        }
    }

    public async Task<(int userId, string nombre, string? apellido, string correo, string rol, string estadoUsuario, string pwdHash)?>
        GetByCorreoAsync(string correo)
    {
        correo = NormalizeEmail(correo);
        if (string.IsNullOrWhiteSpace(correo)) return null;

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

        string estadoUsuario = (string?)row.EstadoUsuario ?? "";

        if (string.IsNullOrWhiteSpace(estadoUsuario))
        {
            bool isActive;
            try
            {
                isActive = row.IsActive is bool b
                    ? b
                    : (row.IsActive is int i && i == 1);
            }
            catch
            {
                isActive = true;
            }

            estadoUsuario = isActive ? "ACTIVE" : "PAUSED";
        }

        return (userId, nombre, apellido, correoOut, rol, estadoUsuario, pwdHash);
    }

    public async Task CreateSessionAsync(int userId, string token, DateTime expireAt, string? device, string? ip)
    {
        if (userId <= 0) throw new ArgumentException("Usuario inválido.", nameof(userId));
        if (string.IsNullOrWhiteSpace(token)) throw new ArgumentException("Token inválido.", nameof(token));

        using var sql = new SqlConnection(_cn);
        await sql.OpenAsync();
        using var tx = sql.BeginTransaction();

        await sql.ExecuteAsync(
            "dbo.usp_Sesion_Create",
            new
            {
                UsuarioID = userId,
                Token = token,
                DeviceInfo = string.IsNullOrWhiteSpace(device) ? null : device.Trim(),
                IP = string.IsNullOrWhiteSpace(ip) ? null : ip.Trim(),
                ExpireAt = expireAt
            },
            commandType: CommandType.StoredProcedure,
            transaction: tx
        );

        await sql.ExecuteAsync(
            @"UPDATE dbo.Usuario
              SET LastLogin = SYSUTCDATETIME()
              WHERE UsuarioID = @uid",
            new { uid = userId },
            transaction: tx
        );

        tx.Commit();
    }

    public async Task<int> InvalidateSessionAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return 0;

        using var sql = new SqlConnection(_cn);
        return await sql.ExecuteScalarAsync<int>(
            "dbo.usp_Sesion_Invalidate",
            new { Token = token.Trim() },
            commandType: CommandType.StoredProcedure
        );
    }

    public async Task UpdateUserRoleAsync(int usuarioId, string rol, int? by)
    {
        if (usuarioId <= 0) throw new ArgumentException("Usuario inválido.", nameof(usuarioId));
        if (string.IsNullOrWhiteSpace(rol)) throw new ArgumentException("Rol inválido.", nameof(rol));

        using var sql = new SqlConnection(_cn);
        await sql.ExecuteAsync(
            "dbo.usp_UsuarioRol_AssignOrUpdate",
            new { UsuarioID = usuarioId, NombreRol = rol.Trim(), AssignedBy = by },
            commandType: CommandType.StoredProcedure
        );
    }

    public record UserListItem(
        int UsuarioID,
        string Nombre,
        string? Apellido,
        string Correo,
        string? Telefono,
        string Rol,
        bool IsActive,
        string EstadoUsuario
    );

    public async Task<IEnumerable<UserListItem>> GetUsersAsync()
    {
        using var sql = new SqlConnection(_cn);

        var data = await sql.QueryAsync<UserListItem>(@"
            SELECT
                u.UsuarioID,
                u.Nombre,
                u.Apellido,
                u.Correo,
                u.Telefono,
                Rol = ISNULL((SELECT TOP (1) r.NombreRol
                              FROM dbo.UsuarioRol ur
                              JOIN dbo.Rol r ON r.RolID = ur.RolID
                              WHERE ur.UsuarioID = u.UsuarioID
                              ORDER BY ur.AssignedAt DESC), 'Empleado'),
                u.IsActive,
                u.EstadoUsuario
            FROM dbo.Usuario u
            ORDER BY u.UsuarioID DESC;
        ");

        return data;
    }

    public async Task<bool> ChangePasswordAsync(
        int userId,
        string currentPassword,
        string newPassword,
        string? currentToken)
    {
        if (userId <= 0) return false;
        if (string.IsNullOrWhiteSpace(currentPassword) || string.IsNullOrWhiteSpace(newPassword)) return false;
        if (!IsStrongPassword(newPassword)) return false;
        if (currentPassword == newPassword) return false;

        using var sql = new SqlConnection(_cn);
        await sql.OpenAsync();
        using var tx = sql.BeginTransaction();

        var row = await sql.QueryFirstOrDefaultAsync<(int UsuarioID, string PasswordHash)>(@"
            SELECT TOP 1 UsuarioID, PasswordHash
            FROM dbo.Usuario
            WHERE UsuarioID = @uid AND IsActive = 1
        ", new { uid = userId }, tx);

        if (row.UsuarioID == 0)
        {
            tx.Rollback();
            return false;
        }

        if (!VerifyPassword(currentPassword, row.PasswordHash))
        {
            tx.Rollback();
            return false;
        }

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
        ", new { uid = userId, tok = string.IsNullOrWhiteSpace(currentToken) ? null : currentToken.Trim() }, tx);

        tx.Commit();
        return true;
    }

    public async Task ResetPasswordAsync(int userId, string newPassword)
    {
        if (userId <= 0) throw new ArgumentException("Usuario inválido.", nameof(userId));
        if (!IsStrongPassword(newPassword))
            throw new ArgumentException("La contraseña no cumple los requisitos mínimos de seguridad.", nameof(newPassword));

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

    private static int ToIsActive(string estado)
        => estado == "ACTIVE" ? 1 : 0;

    public async Task SetUserStatusAsync(int usuarioId, string estado, int? by)
    {
        estado = (estado ?? string.Empty).Trim().ToUpperInvariant();

        if (estado != "ACTIVE" && estado != "PAUSED" && estado != "VACATION")
            throw new ArgumentException("Estado inválido");

        using var sql = new SqlConnection(_cn);
        await sql.ExecuteAsync(@"
            UPDATE dbo.Usuario
               SET EstadoUsuario = @estado,
                   IsActive = @isActive,
                   UpdatedAt = SYSUTCDATETIME(),
                   UpdatedBy = @by
             WHERE UsuarioID = @usuarioId
        ", new { usuarioId, estado, isActive = ToIsActive(estado), by });
    }

    public async Task UpdateUserBasicAsync(
        int usuarioId,
        string? nombre,
        string? apellido,
        string? correo,
        string? telefono,
        string? rol,
        int? by)
    {
        if (usuarioId <= 0) throw new ArgumentException("Usuario inválido.", nameof(usuarioId));

        nombre = string.IsNullOrWhiteSpace(nombre) ? null : nombre.Trim();
        apellido = string.IsNullOrWhiteSpace(apellido) ? null : apellido.Trim();
        telefono = string.IsNullOrWhiteSpace(telefono) ? null : telefono.Trim();
        rol = string.IsNullOrWhiteSpace(rol) ? null : rol.Trim();
        correo = string.IsNullOrWhiteSpace(correo) ? null : NormalizeEmail(correo);

        if (correo is not null && !IsValidEmail(correo))
            throw new ArgumentException("El correo no es válido.");

        using var sql = new SqlConnection(_cn);
        await sql.OpenAsync();
        using var tx = sql.BeginTransaction();

        if (!string.IsNullOrWhiteSpace(correo))
        {
            var exists = await sql.ExecuteScalarAsync<int>(@"
                SELECT COUNT(1)
                FROM dbo.Usuario
                WHERE Correo = @correo AND UsuarioID <> @usuarioId
            ", new { correo, usuarioId }, tx);

            if (exists > 0)
            {
                tx.Rollback();
                throw new ApplicationException("EMAIL_DUPLICATE");
            }
        }

        await sql.ExecuteAsync(@"
            UPDATE dbo.Usuario
               SET Nombre   = COALESCE(@nombre, Nombre),
                   Apellido = COALESCE(@apellido, Apellido),
                   Correo   = COALESCE(@correo, Correo),
                   Telefono = COALESCE(@telefono, Telefono),
                   UpdatedAt = SYSUTCDATETIME(),
                   UpdatedBy = @by
             WHERE UsuarioID = @usuarioId
        ", new { usuarioId, nombre, apellido, correo, telefono, by }, tx);

        if (!string.IsNullOrWhiteSpace(rol))
        {
            await sql.ExecuteAsync(
                "dbo.usp_UsuarioRol_AssignOrUpdate",
                new { UsuarioID = usuarioId, NombreRol = rol, AssignedBy = by },
                tx,
                commandType: CommandType.StoredProcedure
            );
        }

        tx.Commit();
    }

    public async Task<UserProfileDto?> GetProfileAsync(int usuarioId)
    {
        using var sql = new SqlConnection(_cn);

        var row = await sql.QueryFirstOrDefaultAsync(@"
            SELECT TOP 1
                u.UsuarioID,
                u.Nombre,
                u.Apellido,
                u.Correo,
                u.Telefono,
                u.FechaRegistro,
                u.LastLogin,
                u.EstadoUsuario,
                Rol = ISNULL((SELECT TOP (1) r.NombreRol
                              FROM dbo.UsuarioRol ur
                              JOIN dbo.Rol r ON r.RolID = ur.RolID
                              WHERE ur.UsuarioID = u.UsuarioID
                              ORDER BY ur.AssignedAt DESC), 'Empleado')
            FROM dbo.Usuario u
            WHERE u.UsuarioID = @uid
        ", new { uid = usuarioId });

        if (row == null) return null;

        string estado = (string?)row.EstadoUsuario ?? "ACTIVE";

        return new UserProfileDto(
            row.UsuarioID,
            row.Nombre,
            (string?)row.Apellido,
            row.Correo,
            (string?)row.Telefono,
            row.Rol,
            row.FechaRegistro,
            (DateTime?)row.LastLogin,
            estado
        );
    }

    public async Task UpdateOwnProfileAsync(
        int usuarioId,
        string? nombre,
        string? apellido,
        string? correo,
        string? telefono)
    {
        if (usuarioId <= 0) throw new ArgumentException("Usuario inválido.", nameof(usuarioId));

        nombre = string.IsNullOrWhiteSpace(nombre) ? null : nombre.Trim();
        apellido = string.IsNullOrWhiteSpace(apellido) ? null : apellido.Trim();
        telefono = string.IsNullOrWhiteSpace(telefono) ? null : telefono.Trim();
        correo = string.IsNullOrWhiteSpace(correo) ? null : NormalizeEmail(correo);

        if (correo is not null && !IsValidEmail(correo))
            throw new ArgumentException("El correo no es válido.");

        using var sql = new SqlConnection(_cn);
        await sql.OpenAsync();
        using var tx = sql.BeginTransaction();

        if (!string.IsNullOrWhiteSpace(correo))
        {
            var exists = await sql.ExecuteScalarAsync<int>(@"
                SELECT COUNT(1)
                FROM dbo.Usuario
                WHERE Correo = @correo AND UsuarioID <> @usuarioId
            ", new { correo, usuarioId }, tx);

            if (exists > 0)
            {
                tx.Rollback();
                throw new ApplicationException("EMAIL_DUPLICATE");
            }
        }

        await sql.ExecuteAsync(@"
            UPDATE dbo.Usuario
               SET Nombre   = COALESCE(@nombre, Nombre),
                   Apellido = COALESCE(@apellido, Apellido),
                   Correo   = COALESCE(@correo, Correo),
                   Telefono = COALESCE(@telefono, Telefono),
                   UpdatedAt = SYSUTCDATETIME()
             WHERE UsuarioID = @usuarioId
        ", new { usuarioId, nombre, apellido, correo, telefono }, tx);

        tx.Commit();
    }
}
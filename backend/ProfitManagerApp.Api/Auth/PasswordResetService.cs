using System.Data;
using System.Security.Cryptography;
using Dapper;
using Microsoft.Data.SqlClient;
using ProfitManagerApp.Data.Infrastructure;

namespace ProfitManagerApp.Api.Auth
{
    
    public class PasswordResetService
    {
        private readonly IConfiguration _cfg;
        private readonly SqlConnectionFactory _factory;
        private readonly IMailSender _mail;

        public PasswordResetService(IConfiguration cfg, SqlConnectionFactory factory, IMailSender mail)
        {
            _cfg = cfg;
            _factory = factory;
            _mail = mail;
        }

        public async Task<bool> SendTemporaryPasswordAsync(string correo)
        {
            if (string.IsNullOrWhiteSpace(correo)) return true;

            using var cn = _factory.Create();
            await (cn as SqlConnection)!.OpenAsync();

            var user = await cn.QueryFirstOrDefaultAsync<(int UsuarioID, string Correo)>(@"
                SELECT TOP 1 UsuarioID, Correo
                FROM dbo.Usuario
                WHERE Correo = @c AND IsActive = 1
            ", new { c = correo });

            if (user.UsuarioID == 0) return true;

            var tempPassword = GenerateTempPassword(10);

            var salt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
            var hash = AuthService.HashPassword(tempPassword, salt);

            using var tx = (cn as SqlConnection)!.BeginTransaction();

            await cn.ExecuteAsync(@"
                UPDATE dbo.Usuario
                   SET PasswordHash = @pwd,
                       Salt = @salt,
                       UpdatedAt = SYSUTCDATETIME()
                 WHERE UsuarioID = @uid
            ", new { pwd = hash, salt, uid = user.UsuarioID }, tx);

            await cn.ExecuteAsync(@"
                UPDATE dbo.Sesion
                   SET IsActive = 0
                 WHERE UsuarioID = @uid AND IsActive = 1
            ", new { uid = user.UsuarioID }, tx);

            await cn.ExecuteAsync(@"
                INSERT INTO dbo.BitacoraErrores(Nivel, Mensaje, Origen, Fecha, UsuarioID)
                VALUES('INFO', 'Password temporal emitido', 'PasswordResetService', SYSUTCDATETIME(), @uid)
            ", new { uid = user.UsuarioID }, tx);

            tx.Commit();

            var appName = _cfg["App:Name"] ?? "Profit Up Manager";
            var loginUrl = _cfg["Auth:LoginUrlBase"] ?? "http://localhost:3000/login";
            var support = _cfg["Mail:Support"]; 

            var (subject, html) = EmailTemplates.BuildTempPasswordEmail(appName, tempPassword, loginUrl, support);

            await _mail.SendPasswordResetAsync(user.Correo, subject, html);

            return true;
        }

        private static string GenerateTempPassword(int length = 10)
        {
            const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#";
            Span<byte> buffer = stackalloc byte[length];
            RandomNumberGenerator.Fill(buffer);

            var chars = new char[length];
            for (int i = 0; i < length; i++)
            {
                chars[i] = alphabet[buffer[i] % alphabet.Length];
            }
            return new string(chars);
        }
    }
}

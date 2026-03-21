using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ProfitManagerApp.Api.Services;
using ProfitManagerApp.Data.Infrastructure;

namespace ProfitManagerApp.Api.Auth
{
    public class PasswordResetService
    {
        private readonly IConfiguration _cfg;
        private readonly SqlConnectionFactory _factory;
        private readonly IEmailSender _mail;

        public PasswordResetService(IConfiguration cfg, SqlConnectionFactory factory, IEmailSender mail)
        {
            _cfg = cfg;
            _factory = factory;
            _mail = mail;
        }

        public async Task<bool> SendResetLinkAsync(string correo)
        {
            correo = AuthService.NormalizeEmail(correo);
            if (!AuthService.IsValidEmail(correo)) return true;

            using var cn = _factory.Create();
            await (cn as SqlConnection)!.OpenAsync();

            var user = await cn.QueryFirstOrDefaultAsync<(int UsuarioID, string Correo, string Nombre)>(@"
                SELECT TOP 1 UsuarioID, Correo, Nombre
                FROM dbo.Usuario
                WHERE Correo = @c AND IsActive = 1
            ", new { c = correo });

            if (user.UsuarioID == 0) return true;

            var token = BuildResetToken(user.UsuarioID, user.Correo);
            var baseUrl = (_cfg["Auth:ResetUrlBase"] ?? "http://localhost:3000/reset-password").Trim();
            var resetUrl = $"{baseUrl}?token={Uri.EscapeDataString(token)}";

            var appName = _cfg["App:Name"] ?? "Profit Up Manager";
            var support = _cfg["Mail:From"];

            var (subject, html) = AuthEmailTemplates.BuildPasswordResetEmail(
                appName,
                resetUrl,
                support
            );

            await cn.ExecuteAsync(@"
                INSERT INTO dbo.BitacoraErrores(Nivel, Mensaje, Origen, Fecha, UsuarioID)
                VALUES('INFO', 'Enlace de restablecimiento emitido', 'PasswordResetService', SYSUTCDATETIME(), @uid)
            ", new { uid = user.UsuarioID });

            await _mail.SendAsync(user.Correo, subject, html);

            return true;
        }

        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(token)) return false;
            if (!AuthService.IsStrongPassword(newPassword)) return false;

            var principal = ValidateResetToken(token);
            if (principal is null) return false;

            var uidClaim = principal.FindFirst("uid")?.Value
                        ?? principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            var emailClaim = principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value
                          ?? principal.FindFirst(ClaimTypes.Email)?.Value;

            var purposeClaim = principal.FindFirst("purpose")?.Value;

            if (!int.TryParse(uidClaim, out var userId) || userId <= 0) return false;
            if (string.IsNullOrWhiteSpace(emailClaim)) return false;
            if (!string.Equals(purposeClaim, "password_reset", StringComparison.Ordinal)) return false;

            emailClaim = AuthService.NormalizeEmail(emailClaim);

            using var cn = _factory.Create();
            await (cn as SqlConnection)!.OpenAsync();
            using var tx = (cn as SqlConnection)!.BeginTransaction();

            var user = await cn.QueryFirstOrDefaultAsync<(int UsuarioID, string Correo)>(@"
                SELECT TOP 1 UsuarioID, Correo
                FROM dbo.Usuario
                WHERE UsuarioID = @uid
                  AND Correo = @correo
                  AND IsActive = 1
            ", new { uid = userId, correo = emailClaim }, tx);

            if (user.UsuarioID == 0)
            {
                tx.Rollback();
                return false;
            }

            var salt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
            var hash = AuthService.HashPassword(newPassword, salt);

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
                VALUES('INFO', 'Contraseña restablecida desde enlace', 'PasswordResetService', SYSUTCDATETIME(), @uid)
            ", new { uid = user.UsuarioID }, tx);

            tx.Commit();
            return true;
        }

        private string BuildResetToken(int userId, string correo)
        {
            var jwtKey = _cfg["Jwt:Key"]
                ?? throw new InvalidOperationException("Jwt:Key no configurado.");

            var issuer = _cfg["Jwt:Issuer"];
            var audience = _cfg["Jwt:Audience"];
            var minutes = int.TryParse(_cfg["Auth:SlidingInactivityMinutes"], out var m) ? m : 30;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var now = DateTime.UtcNow;

            var claims = new[]
            {
                new Claim("uid", userId.ToString()),
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, AuthService.NormalizeEmail(correo)),
                new Claim("purpose", "password_reset"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
            };

            var token = new JwtSecurityToken(
                issuer: string.IsNullOrWhiteSpace(issuer) ? null : issuer,
                audience: string.IsNullOrWhiteSpace(audience) ? null : audience,
                claims: claims,
                notBefore: now,
                expires: now.AddMinutes(minutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private ClaimsPrincipal? ValidateResetToken(string token)
        {
            try
            {
                var jwtKey = _cfg["Jwt:Key"]
                    ?? throw new InvalidOperationException("Jwt:Key no configurado.");

                var issuer = _cfg["Jwt:Issuer"];
                var audience = _cfg["Jwt:Audience"];

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

                var parameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
                    ValidateIssuer = !string.IsNullOrWhiteSpace(issuer),
                    ValidIssuer = issuer,
                    ValidateAudience = !string.IsNullOrWhiteSpace(audience),
                    ValidAudience = audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30)
                };

                var handler = new JwtSecurityTokenHandler();
                return handler.ValidateToken(token, parameters, out _);
            }
            catch
            {
                return null;
            }
        }
    }
}
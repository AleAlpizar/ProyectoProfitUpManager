using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

public class JwtTokenService
{
    private readonly IConfiguration _cfg;
    public JwtTokenService(IConfiguration cfg) { _cfg = cfg; }

    public (string token, DateTime expireAt) CreateToken(int userId, string email, string role, TimeSpan? lifetime = null)
    {
        var issuer = _cfg["Jwt:Issuer"];
        var audience = _cfg["Jwt:Audience"];
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!));

        var now = DateTime.UtcNow;
        var expires = now.Add(lifetime ?? TimeSpan.FromHours(8));

        var claims = new[]
        {
            new Claim("uid", userId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),

            new Claim(ClaimTypes.Email, email),
            new Claim(JwtRegisteredClaimNames.Email, email),

            new Claim(ClaimTypes.Role, role ?? "Empleado")
        };

        var token = new JwtSecurityToken(
            issuer, audience, claims, notBefore: now,
            expires: expires,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}

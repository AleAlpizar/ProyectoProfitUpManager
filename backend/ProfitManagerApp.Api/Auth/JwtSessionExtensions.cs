using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Data.SqlClient;

namespace ProfitManagerApp.Api.Auth;

public static class JwtSessionExtensions
{
    public static IServiceCollection AddJwtWithSessionValidation(this IServiceCollection services, IConfiguration cfg)
    {
        var jwtKey = cfg["Jwt:Key"]!;
        var issuer = cfg["Jwt:Issuer"];
        var audience = cfg["Jwt:Audience"];
        var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtKey));

        services
            .AddAuthentication(o =>
            {
                o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(o =>
            {
                o.RequireHttpsMetadata = false;
                o.SaveToken = true;
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
                    ValidateIssuer = !string.IsNullOrEmpty(issuer),
                    ValidIssuer = issuer,
                    ValidateAudience = !string.IsNullOrEmpty(audience),
                    ValidAudience = audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30)
                };

                o.Events = new JwtBearerEvents
                {
                    OnTokenValidated = async ctx =>
                    {
                        var configuration = ctx.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
                        var cn = configuration.GetConnectionString("Default")!;
                        var slidingMin = int.TryParse(configuration["Auth:SlidingInactivityMinutes"], out var m) ? m : 30;

                        var bearer = ctx.Request.Headers["Authorization"].ToString();
                        var token = bearer?.Split(' ').LastOrDefault();

                        if (string.IsNullOrWhiteSpace(token))
                        {
                            ctx.Fail("Token ausente.");
                            return;
                        }

                        using var sql = new SqlConnection(cn);

                        var sesion = await sql.QueryFirstOrDefaultAsync<(bool IsActive, DateTime ExpireAt)>(@"
                            SELECT IsActive, ExpireAt
                            FROM dbo.Sesion
                            WHERE Token=@tok
                        ", new { tok = token });

                        if (sesion.Equals(default((bool, DateTime))))
                        {
                            ctx.Fail("Sesión no encontrada.");
                            return;
                        }
                        if (!sesion.IsActive)
                        {
                            ctx.Fail("Sesión inactiva.");
                            return;
                        }
                        if (DateTime.UtcNow > sesion.ExpireAt)
                        {
                            await sql.ExecuteAsync("UPDATE dbo.Sesion SET IsActive=0 WHERE Token=@tok", new { tok = token });
                            ctx.Fail("Sesión expirada por inactividad.");
                            return;
                        }

                        var newExpire = DateTime.UtcNow.AddMinutes(slidingMin);
                        await sql.ExecuteAsync(@"
                            UPDATE dbo.Sesion SET ExpireAt=@exp WHERE Token=@tok
                        ", new { exp = newExpire, tok = token });
                    }
                };
            });

        return services;
    }
}

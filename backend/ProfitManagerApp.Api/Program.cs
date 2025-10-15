using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using ProfitManagerApp.Api.Mapping;
using ProfitManagerApp.Data.Abstractions;
using ProfitManagerApp.Data.Infrastructure;
using ProfitManagerApp.Data.Repositories;
using ProfitManagerApp.Data;
using System.Text;
using ProfitManagerApp.Application.Clientes;

using Dapper;
using ProfitManagerApp.Api.Auth;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicy = "AllowFrontend";

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, p => p
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});
builder.Services.AddProfitManagerData(builder.Configuration);

builder.Services.AddAutoMapper(typeof(ApiMappingProfile).Assembly);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<SqlConnectionFactory>();
builder.Services.AddScoped<IInventarioRepository, InventarioRepository>();

builder.Services.AddScoped<ClienteHandler>();
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<JwtTokenService>();

builder.Services.AddSingleton<IMailSender, SmtpMailSender>();
builder.Services.AddScoped<PasswordResetService>();

var issuer = builder.Configuration["Jwt:Issuer"];
var audience = builder.Configuration["Jwt:Audience"];
var key = builder.Configuration["Jwt:Key"]
          ?? throw new InvalidOperationException("Jwt:Key no configurado");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            ClockSkew = TimeSpan.FromMinutes(2)
        };

        o.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine($"[JWT] OnAuthenticationFailed: {ctx.Exception?.Message}");
                return Task.CompletedTask;
            },
            OnChallenge = ctx =>
            {
                Console.WriteLine($"[JWT] OnChallenge: {ctx.Error} - {ctx.ErrorDescription}");
                return Task.CompletedTask;
            },
            OnTokenValidated = async ctx =>
            {
                try
                {
                    var bearer = ctx.Request.Headers["Authorization"].ToString();
                    var token = bearer?.Split(' ').LastOrDefault();

                    if (string.IsNullOrWhiteSpace(token))
                    {
                        Console.WriteLine("[JWT] Token ausente en Authorization");
                        ctx.Fail("Token ausente.");
                        return;
                    }

                    var cfg = ctx.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
                    var factory = ctx.HttpContext.RequestServices.GetRequiredService<SqlConnectionFactory>();

                    var slidingMinutes = 30;
                    var slidingStr = cfg["Auth:SlidingInactivityMinutes"];
                    if (!string.IsNullOrWhiteSpace(slidingStr) && int.TryParse(slidingStr, out var parsed))
                        slidingMinutes = parsed;

                    using var cn = factory.Create();
                    cn.Open(); 
                    var sesion = await cn.QueryFirstOrDefaultAsync<(bool IsActive, DateTime ExpireAt)>(@"
                        SELECT IsActive, ExpireAt
                        FROM dbo.Sesion
                        WHERE Token = @tok
                    ", new { tok = token });

                    if (sesion.Equals(default((bool, DateTime))))
                    {
                        Console.WriteLine("[JWT] Sesión no encontrada en DB para el token. Dejar pasar (sin sliding).");
                        return;
                    }

                    if (!sesion.IsActive)
                    {
                        Console.WriteLine("[JWT] Sesión inactiva en DB.");
                        ctx.Fail("Sesión inactiva.");
                        return;
                    }

                    var now = DateTime.UtcNow;
                    if (now > sesion.ExpireAt)
                    {
                        Console.WriteLine($"[JWT] Sesión expirada (ExpireAt={sesion.ExpireAt:O}, Now={now:O}). Marcando inactiva.");
                        await cn.ExecuteAsync("UPDATE dbo.Sesion SET IsActive = 0 WHERE Token = @tok", new { tok = token });
                        ctx.Fail("Sesión expirada por inactividad.");
                        return;
                    }

                    var newExpire = now.AddMinutes(slidingMinutes);
                    await cn.ExecuteAsync(@"UPDATE dbo.Sesion SET ExpireAt = @exp WHERE Token = @tok",
                        new { exp = newExpire, tok = token });

                    Console.WriteLine($"[JWT] Sliding OK. New ExpireAt={newExpire:O}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[JWT] Error en OnTokenValidated: {ex.Message}");
                  
                }
            }
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/db-ping", (SqlConnectionFactory f) =>
{
    try
    {
        using var cn = f.Create();
        cn.Open();
        using var cmd = cn.CreateCommand();
        cmd.CommandText = "SELECT DB_NAME()";
        var db = cmd.ExecuteScalar() as string;
        return Results.Ok(new { connected = true, db });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapControllers();
app.Run();

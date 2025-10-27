using System.Text;
using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ProfitManagerApp.Api.Auth;
using ProfitManagerApp.Api.Data.Abstractions;
using ProfitManagerApp.Api.Infrastructure;
using ProfitManagerApp.Api.Mapping;
using ProfitManagerApp.Application.Clientes;
using ProfitManagerApp.Data;
using ProfitManagerApp.Data.Abstractions;
using ProfitManagerApp.Data.Infrastructure;
using ProfitManagerApp.Data.Repositories;
using ApiDbContext = ProfitManagerApp.Api.Infrastructure.AppDbContext;

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

builder.Services.AddDbContext<ApiDbContext>(opt =>
{
    var cs = builder.Configuration.GetConnectionString("Default")
             ?? throw new InvalidOperationException("ConnectionStrings:Default no está configurado.");
    opt.UseSqlServer(cs);
});

builder.Services.AddProfitManagerData(builder.Configuration);
builder.Services.AddSingleton<SqlConnectionFactory>();
builder.Services.AddAutoMapper(typeof(ApiMappingProfile).Assembly);

builder.Services.AddScoped<IInventarioRepository, InventarioRepository>();
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<ClienteHandler>();

builder.Services.AddAutoMapper(typeof(ApiMappingProfile).Assembly);

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<JwtTokenService>();

builder.Services.AddSingleton<IMailSender, SmtpMailSender>();
builder.Services.AddScoped<PasswordResetService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ProfitManagerApp API", Version = "v1" });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Autenticación JWT con Bearer. Ej: \"Bearer {token}\"",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = JwtBearerDefaults.AuthenticationScheme,
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = JwtBearerDefaults.AuthenticationScheme
        }
    };

    c.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { securityScheme, Array.Empty<string>() } });
});

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
            OnAuthenticationFailed = ctx => { Console.WriteLine($"[JWT] OnAuthenticationFailed: {ctx.Exception?.Message}"); return Task.CompletedTask; },
            OnChallenge = ctx => { Console.WriteLine($"[JWT] OnChallenge: {ctx.Error} - {ctx.ErrorDescription}"); return Task.CompletedTask; },
            OnTokenValidated = async ctx =>
            {
                try
                {
                    var bearer = ctx.Request.Headers["Authorization"].ToString();
                    var token = bearer?.Split(' ').LastOrDefault();
                    if (string.IsNullOrWhiteSpace(token)) { ctx.Fail("Token ausente."); return; }

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

                    if (sesion.Equals(default((bool, DateTime)))) return;
                    if (!sesion.IsActive) { ctx.Fail("Sesión inactiva."); return; }

                    var now = DateTime.UtcNow;
                    if (now > sesion.ExpireAt)
                    {
                        await cn.ExecuteAsync("UPDATE dbo.Sesion SET IsActive = 0 WHERE Token = @tok", new { tok = token });
                        ctx.Fail("Sesión expirada por inactividad.");
                        return;
                    }

                    var newExpire = now.AddMinutes(slidingMinutes);
                    await cn.ExecuteAsync(@"UPDATE dbo.Sesion SET ExpireAt = @exp WHERE Token = @tok",
                        new { exp = newExpire, tok = token });
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
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
    await db.EnsureSeedUnidadesAsync();
}

app.MapControllers();
app.Run();


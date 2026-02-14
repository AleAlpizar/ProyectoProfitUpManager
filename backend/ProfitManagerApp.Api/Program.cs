using System.Text;
using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ProfitManagerApp.Api.Auth;
using ProfitManagerApp.Api.Background;
using ProfitManagerApp.Api.Data.Abstractions;
using ProfitManagerApp.Api.Infrastructure;
using ProfitManagerApp.Api.Mapping;
using ProfitManagerApp.Api.Repositories;
using ProfitManagerApp.Api.Service.Reporting;
using ProfitManagerApp.Api.Services;
using ProfitManagerApp.Application.Clientes;
using ProfitManagerApp.Data;
using ProfitManagerApp.Data.Abstractions;
using ProfitManagerApp.Data.Infrastructure;
using ProfitManagerApp.Data.Repositories;
using QuestPDF.Infrastructure;

using ApiDbContext = ProfitManagerApp.Api.Infrastructure.AppDbContext;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicy = "AllowFrontend";

// -------------------------
// CORS (desde config)
// appsettings.json: "Cors": { "AllowedOrigins": [ "...", "..." ] }
// -------------------------
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, p => p
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
    );
});

// -------------------------
// DB
// -------------------------
builder.Services.AddDbContext<ApiDbContext>(opt =>
{
    var cs = builder.Configuration.GetConnectionString("Default")
             ?? throw new InvalidOperationException("ConnectionStrings:Default no está configurado.");
    opt.UseSqlServer(cs);
});

// Tus servicios
builder.Services.AddProfitManagerData(builder.Configuration);
builder.Services.AddSingleton<SqlConnectionFactory>();

builder.Services.AddAutoMapper(typeof(ApiMappingProfile).Assembly);

builder.Services.AddScoped<IInventarioRepository, InventarioRepository>();
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IProveedorRepository, ProveedorRepository>();
builder.Services.AddScoped<IVencimientosRepository, VencimientosRepository>();

builder.Services.AddScoped<ClienteHandler>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<JwtTokenService>();

builder.Services.AddScoped<IVencimientosNotificationService, VencimientosNotificationService>();

builder.Services.AddSingleton<IMailSender, SmtpMailSender>();
builder.Services.AddScoped<PasswordResetService>();

builder.Services.Configure<VencimientosNotificationOptions>(
    builder.Configuration.GetSection("VencimientosNotifications"));

builder.Services.AddHostedService<VencimientosNotificationBackgroundService>();

builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IReportSessionStore, ReportSessionStore>();
builder.Services.AddSingleton<IReportExportService, ReportExportService>();
builder.Services.AddScoped<InventarioReportService>();
builder.Services.AddScoped<ClientesReportService>();
builder.Services.AddScoped<VentasReportService>();
builder.Services.AddScoped<ReportUsersService>();

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters
        .Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
QuestPDF.Settings.License = LicenseType.Community;

// -------------------------
// Swagger
// -------------------------
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

// -------------------------
// JWT
// -------------------------
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

                    if (sesion.Equals(default((bool, DateTime)))) return;

                    if (!sesion.IsActive)
                    {
                        ctx.Fail("Sesión inactiva.");
                        return;
                    }

                    var now = DateTime.UtcNow;
                    if (now > sesion.ExpireAt)
                    {
                        await cn.ExecuteAsync("UPDATE dbo.Sesion SET IsActive = 0 WHERE Token = @tok", new { tok = token });
                        ctx.Fail("Sesión expirada por inactividad.");
                        return;
                    }

                    var newExpire = now.AddMinutes(slidingMinutes);
                    await cn.ExecuteAsync(
                        @"UPDATE dbo.Sesion SET ExpireAt = @exp WHERE Token = @tok",
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

// -------------------------
// Swagger en Dev o QA
// En Azure: ASPNETCORE_ENVIRONMENT=QA
// -------------------------
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("QA"))
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ProfitManagerApp API v1");
    });
}

app.UseHttpsRedirection();

app.UseCors(CorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

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

try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
    await db.EnsureSeedUnidadesAsync();
}
catch (Exception ex)
{
    Console.WriteLine("[SEED] " + ex);
    throw;
}

app.Run();

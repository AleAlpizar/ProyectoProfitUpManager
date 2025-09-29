using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using ProfitManagerApp.Api.Mapping;
using ProfitManagerApp.Data.Abstractions;
using ProfitManagerApp.Data.Infrastructure;
using ProfitManagerApp.Data.Repositories;
using ProfitManagerApp.Data;
using System.Text;
using ProfitManagerApp.Application.Clientes;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicy = "AllowFrontend";

// CORS
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

//EF
builder.Services.AddProfitManagerData(builder.Configuration);

// AutoMapper
builder.Services.AddAutoMapper(typeof(ApiMappingProfile).Assembly);


// Controllers + Swagger (con JWT)
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DI API

builder.Services.AddSingleton<SqlConnectionFactory>();
builder.Services.AddScoped<IInventarioRepository, InventarioRepository>();

//Domain
builder.Services.AddScoped<ClienteHandler>(); // TODO: make an interface xd


// DATA
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();


//builder.Services.AddScoped<
//    ProfitManagerApp.Data.Abstractions.IInventarioRepository,
//    ProfitManagerApp.Data.Repositories.InventarioRepository
//>();

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
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<JwtTokenService>();





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

// CORS + Auth
app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

// health check
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

# Profit Manager App – Backend (.NET 9)

Bienvenido al backend de **Profit Manager App**. Este repositorio contiene una **API REST con Controllers** sobre **.NET 9**, con **OpenAPI/Swagger**, **JWT (Bearer)** y una capa de datos con **EF Core** preparada pero **sin conexión a base de datos** aún (para facilitar el arranque del equipo).

---

## 🚀 Resumen técnico

- **Framework**: .NET 9 (C# 13)
- **Estilo de API**: Controllers (no Minimal APIs)
- **Autenticación**: JWT Bearer
- **Documentación**: OpenAPI + Swagger UI (solo en Development)
- **Health checks**: `/healthz` (crudo) y `GET /api/health` (JSON) *TODO*
- **CORS**: Permisivo en Development
- **Datos**: EF Core con SQL Server (registrado solo si hay cadena de conexión)

---

## 📁 Estructura del repo
```
ProfitManagerApp/
├─ ProfitManagerApp.sln
├─ ProfitManagerApp.Api/ # Proyecto Web API (Controllers)
│ ├─ Controllers/
│ │ ├─ HealthController.cs # GET /api/health
│ │ ├─ PingController.cs # GET /api/ping (público)
│ │ ├─ SecureController.cs # GET /api/secure/ping (JWT)
│ │ └─ DevController.cs # POST /dev/token (solo Development)
│ ├─ appsettings.json # Config común (JWT, ConnectionStrings)
│ ├─ Program.cs # Pipeline, OpenAPI/Swagger UI, Auth
│ └─ Properties/launchSettings.json
├─ ProfitManagerApp.Data/ # Capa de datos (EF Core)
│ ├─ AppDbContext.cs # DbContext (placeholder)
│ ├─ DependencyInjection.cs # Registro condicional del DbContext
│ └─ ProfitManagerApp.Data.csproj
└─ ProfitManagerApp.Domain/ # Entidades/POCOs, contratos
└─ ProfitManagerApp.Domain.csproj

```
## ✅ Prerrequisitos

- .NET SDK 9 (verificar con dotnet --info)

- SQL Server local o en contenedor (no requerido en esta etapa)

- Editor: Visual Studio 2022 (17.12+)

## 🧩 Configuración (appsettings & secrets)

appsettings.json (ya incluido)
{
  "Jwt": {
    "Issuer": "ProfitManagerApp",
    "Audience": "ProfitManagerAppAudience",
    "Key": "REEMPLAZA_ESTA_LLAVE_POR_UNA_SECRETA_LARGA"
  },
  "ConnectionStrings": {
    "Default": ""
  },
  "AllowedHosts": "*"
}


## 🔐 Autenticación (JWT)

TODO


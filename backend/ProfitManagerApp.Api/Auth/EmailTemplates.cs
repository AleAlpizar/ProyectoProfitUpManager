using System.Web;

namespace ProfitManagerApp.Api.Auth
{
    public static class EmailTemplates
    {
  
        public static (string Subject, string Html) BuildTempPasswordEmail(
            string appName,
            string tempPassword,
            string loginUrl,
            string? supportEmail = null)
        {
            appName = HttpUtility.HtmlEncode(appName);
            tempPassword = HttpUtility.HtmlEncode(tempPassword);
            loginUrl = string.IsNullOrWhiteSpace(loginUrl) ? "#" : loginUrl;

            var subject = $"{appName} – Tu contraseña temporal";

            const string bg = "#0b0b0d";          
            const string card = "#111214";      
            const string text = "#e5e7eb";      
            const string muted = "#a1a1aa";
            const string primary = "#22c55e";    
            const string primaryText = "#0b3d12";
            const string divider = "#1f2124";

            var html = $@"
<!doctype html>
<html lang=""es"">
<head>
  <meta http-equiv=""Content-Type"" content=""text/html; charset=UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>{subject}</title>
  <style>

    @media (prefers-color-scheme: light) {{
      :root {{
        --bg: #f6f7f9;
        --card: #ffffff;
        --text: #0f172a;
        --muted: #475569;
        --primary: #22c55e;
        --primaryText: #0b3d12;
        --divider: #e5e7eb;
      }}
    }}
    @media (prefers-color-scheme: dark) {{
      :root {{
        --bg: {bg};
        --card: {card};
        --text: {text};
        --muted: {muted};
        --primary: {primary};
        --primaryText: {primaryText};
        --divider: {divider};
      }}
    }}

    .btn {{
      display:inline-block;
      text-decoration:none;
      font-weight:600;
      border-radius:10px;
      padding:12px 18px;
    }}
    .code {{
      display:inline-block;
      font-weight:700;
      font-size:18px;
      letter-spacing:1px;
      padding:12px 16px;
      border-radius:10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }}
  </style>
</head>
<body style=""margin:0;padding:0;background:{bg};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;"">
  <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" align=""center"" width=""100%"" style=""background:{bg};padding:24px 16px;"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""560"" style=""max-width:560px;background:{card};border-radius:16px;border:1px solid {divider};overflow:hidden;"">
          <!-- Header -->
          <tr>
            <td align=""center"" style=""padding:20px 24px 8px 24px"">
              <div style=""display:inline-block;background:#fff;color:#111214;border-radius:10px;padding:8px 10px;font-weight:700;font-family:Poppins,Segoe UI,Arial,sans-serif;border:1px solid {divider};"">
                PU
              </div>
              <h1 style=""margin:12px 0 0 0;font-size:28px;line-height:1.2;color:{text};font-family:Poppins,Segoe UI,Arial,sans-serif;font-weight:800;"">
                Restablece tu acceso
              </h1>
              <p style=""margin:8px 0 0 0;color:{muted};font-size:14px;font-family:Poppins,Segoe UI,Arial,sans-serif;"">
                Hemos generado una contraseña temporal para <strong style=""color:{text}"">{appName}</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style=""padding:0 24px"">
              <hr style=""border:0;border-top:1px solid {divider};margin:16px 0;""/>
            </td>
          </tr>

          <tr>
            <td style=""padding:0 24px 8px 24px;font-family:Poppins,Segoe UI,Arial,sans-serif;color:{text};font-size:14px;line-height:1.6;"">
              <p style=""margin:0 0 12px 0;"">Tu <strong>contraseña temporal</strong> es:</p>
              <div class=""code"" style=""background:#0e0f11;color:{text};border:1px solid {divider};"">{tempPassword}</div>

              <p style=""margin:16px 0 8px 0;color:{muted}"">
                Úsala para iniciar sesión y, por seguridad, cámbiala inmediatamente en
                <em>Mi perfil → Cambiar contraseña</em>.
              </p>

              <div style=""margin:16px 0 8px 0;"">
                <a href=""{loginUrl}"" class=""btn"" style=""background:{primary};color:{primaryText};border:1px solid #16a34a;"">
                  Ir a iniciar sesión
                </a>
              </div>

              <p style=""margin:12px 0 0 0;color:{muted};font-size:12px;"">
                Si no solicitaste este cambio, ignora este correo o contáctanos{(supportEmail is null ? "" : $" en <a href=\"mailto:{HttpUtility.HtmlEncode(supportEmail)}\" style=\"color:{primary}\">{HttpUtility.HtmlEncode(supportEmail)}</a>")}.
              </p>
            </td>
          </tr>

          <tr>
            <td align=""center"" style=""padding:16px 24px 20px 24px"">
              <p style=""margin:0;color:{muted};font-size:12px;font-family:Poppins,Segoe UI,Arial,sans-serif;"">
                © {DateTime.UtcNow.Year} {appName}. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>

        <div style=""height:24px""></div>

        <div style=""max-width:560px;color:{muted};font-size:12px;font-family:Segoe UI,Arial,sans-serif;line-height:1.6;"">
          Si tienes problemas con el botón, copia y pega esta URL en tu navegador:
          <br/>
          <span style=""word-break:break-all;color:{text}"">{loginUrl}</span>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>";

            return (subject, html);
        }
    }
}

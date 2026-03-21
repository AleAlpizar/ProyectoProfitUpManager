using System;
using System.Web;

namespace ProfitManagerApp.Api.Auth
{
    public static class AuthEmailTemplates
    {
        public static (string Subject, string Html) BuildPasswordResetEmail(
            string appName,
            string resetUrl,
            string? supportEmail = null)
        {
            appName = HttpUtility.HtmlEncode(appName);
            resetUrl = string.IsNullOrWhiteSpace(resetUrl) ? "#" : resetUrl;

            var subject = $"{appName} – Restablece tu contraseña";

            const string bg = "#09090b";
            const string card = "#0f1115";
            const string cardBorder = "#1f2430";
            const string text = "#f3f4f6";
            const string muted = "#a1a1aa";
            const string accent = "#62053B";
            const string accentHover = "#7A094B";
            const string accentSoft = "#3a0827";
            const string line = "#1a1d24";
            const string success = "#22c55e";

            var supportHtml = string.IsNullOrWhiteSpace(supportEmail)
                ? ""
                : $" en <a href=\"mailto:{HttpUtility.HtmlEncode(supportEmail)}\" style=\"color:{accent};text-decoration:underline;\">{HttpUtility.HtmlEncode(supportEmail)}</a>";

            var html = $@"
<!doctype html>
<html lang=""es"">
<head>
  <meta http-equiv=""Content-Type"" content=""text/html; charset=UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>{subject}</title>
</head>
<body style=""margin:0;padding:0;background:{bg};font-family:Segoe UI,Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;"">
  <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""100%"" style=""background:{bg};padding:32px 16px;"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""620"" style=""max-width:620px;"">
          <tr>
            <td align=""center"" style=""padding-bottom:18px;"">
              <div style=""font-size:13px;color:{muted};letter-spacing:.4px;"">
                {appName}
              </div>
            </td>
          </tr>

          <tr>
            <td>
              <table role=""presentation"" cellspacing=""0"" cellpadding=""0"" border=""0"" width=""100%"" style=""background:{card};border:1px solid {cardBorder};border-radius:22px;overflow:hidden;box-shadow:0 18px 40px rgba(0,0,0,.35);"">
                <tr>
                  <td style=""padding:34px 34px 18px 34px;text-align:center;"">
                    <h1 style=""margin:0;font-size:38px;line-height:1.08;font-weight:800;color:{text};letter-spacing:-0.6px;"">
                      Restablece tu contraseña
                    </h1>

                    <p style=""margin:16px 0 0 0;font-size:15px;line-height:1.7;color:{muted};"">
                      Recibimos una solicitud para cambiar la contraseña de
                      <strong style=""color:{text};font-weight:700;"">{appName}</strong>.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style=""padding:0 34px;"">
                    <div style=""height:1px;background:{line};""></div>
                  </td>
                </tr>

                <tr>
                  <td style=""padding:28px 34px 10px 34px;"">
                    <p style=""margin:0 0 16px 0;font-size:16px;line-height:1.65;color:{text};"">
                      Haz clic en el siguiente botón para definir una nueva contraseña:
                    </p>

                    <div style=""margin:0 0 22px 0;"">
                      <a href=""{resetUrl}""
                         style=""display:inline-block;background:{accent};color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;line-height:1;border-radius:12px;padding:16px 24px;border:1px solid {accentSoft};box-shadow:0 8px 24px rgba(98,5,59,.28);"">
                        Restablecer contraseña
                      </a>
                    </div>

                    <div style=""margin:0 0 18px 0;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,0.02);border:1px solid {line};"">
                      <p style=""margin:0;font-size:14px;line-height:1.7;color:{muted};"">
                        Por seguridad, este enlace expira pronto. Si no solicitaste este cambio,
                        puedes ignorar este correo{supportHtml}.
                      </p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style=""padding:12px 34px 30px 34px;text-align:center;"">
                    <p style=""margin:0;font-size:12px;line-height:1.6;color:{muted};"">
                      © {DateTime.UtcNow.Year} {appName}. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style=""padding-top:22px;"">
              <div style=""max-width:620px;margin:0 auto;padding:18px 20px;border-radius:16px;background:#0b0d12;border:1px solid {line};"">
                <p style=""margin:0 0 10px 0;font-size:13px;line-height:1.6;color:{muted};"">
                  Si tienes problemas con el botón, copia y pega esta URL en tu navegador:
                </p>
                <div style=""font-size:13px;line-height:1.7;word-break:break-all;color:#d1d5db;"">
                  <a href=""{resetUrl}"" style=""color:{accent};text-decoration:underline;"">{HttpUtility.HtmlEncode(resetUrl)}</a>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td style=""padding-top:18px;text-align:center;"">
              <p style=""margin:0;font-size:11px;color:#71717a;"">
                Correo automático de seguridad
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

            return (subject, html);
        }
    }
}
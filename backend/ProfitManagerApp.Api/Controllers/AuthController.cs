using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Auth;
using static AuthService;

[ApiController]
[Route("auth")]
[Authorize]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly JwtTokenService _jwt;

    private static readonly Regex NameRegex = new(@"^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ'\-\s]+$", RegexOptions.Compiled);
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Administrador",
        "Empleado"
    };

    public AuthController(AuthService auth, JwtTokenService jwt)
    {
        _auth = auth;
        _jwt = jwt;
    }

    private int? GetUserId()
    {
        var v =
            User.FindFirstValue("uid") ??
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return int.TryParse(v, out var id) ? id : (int?)null;
    }

    private static string? NormalizeNullableText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return Regex.Replace(value.Trim(), @"\s+", " ");
    }

    private static string NormalizeRequiredText(string value)
    {
        return Regex.Replace(value.Trim(), @"\s+", " ");
    }

    private static string? NormalizePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return null;

        var digits = new string(phone.Where(char.IsDigit).ToArray());
        return string.IsNullOrWhiteSpace(digits) ? null : digits;
    }

    private static void ValidateNameField(string? value, string fieldName, bool required)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            if (required)
                throw new ArgumentException($"El campo {fieldName} es obligatorio.");
            return;
        }

        var normalized = NormalizeRequiredText(value);

        if (normalized.Length < 2)
            throw new ArgumentException($"El campo {fieldName} debe tener al menos 2 caracteres.");

        if (normalized.Length > 100)
            throw new ArgumentException($"El campo {fieldName} no puede exceder 100 caracteres.");

        if (!NameRegex.IsMatch(normalized))
            throw new ArgumentException($"El campo {fieldName} contiene caracteres no permitidos.");
    }

    private static string ValidateAndNormalizeEmail(string? email, bool required)
    {
        var normalized = NormalizeEmail(email);

        if (string.IsNullOrWhiteSpace(normalized))
        {
            if (required)
                throw new ArgumentException("El correo es obligatorio.");
            return string.Empty;
        }

        if (!IsValidEmail(normalized))
            throw new ArgumentException("Correo inválido.");

        if (normalized.Length > 256)
            throw new ArgumentException("El correo no puede exceder 256 caracteres.");

        return normalized;
    }

    private static string? ValidateAndNormalizePhone(string? phone, bool required = false)
    {
        var normalized = NormalizePhone(phone);

        if (string.IsNullOrWhiteSpace(normalized))
        {
            if (required)
                throw new ArgumentException("El teléfono es obligatorio.");
            return null;
        }

        if (normalized.Length < 8 || normalized.Length > 20)
            throw new ArgumentException("El teléfono debe tener entre 8 y 20 dígitos.");

        return normalized;
    }

    private static string ValidateAndNormalizeRole(string? role)
    {
        var normalized = NormalizeNullableText(role);

        if (string.IsNullOrWhiteSpace(normalized))
            throw new ArgumentException("Rol inválido.");

        if (!AllowedRoles.Contains(normalized))
            throw new ArgumentException("El rol indicado no es válido.");

        return normalized;
    }

    [HttpPost("register")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Register([FromBody] RegisterUserDto dto)
    {
        if (dto is null)
            return BadRequest(new { message = "Datos inválidos." });

        try
        {
            var nombre = NormalizeRequiredText(dto.Nombre ?? string.Empty);
            var apellido = NormalizeNullableText(dto.Apellido);
            var correo = ValidateAndNormalizeEmail(dto.Correo, required: true);
            var telefono = ValidateAndNormalizePhone(dto.Telefono);
            var rol = ValidateAndNormalizeRole(dto.Rol);

            ValidateNameField(nombre, "nombre", required: true);
            ValidateNameField(apellido, "apellido", required: false);

            if (!IsStrongPassword(dto.Password))
            {
                return BadRequest(new
                {
                    message = "La contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas y números."
                });
            }

            var createdBy = GetUserId();
            var idNew = await _auth.CreateUserAsync(
                dto with
                {
                    Nombre = nombre,
                    Apellido = apellido,
                    Correo = correo,
                    Telefono = telefono,
                    Rol = rol
                },
                createdBy
            );

            return Ok(new
            {
                message = "Usuario registrado correctamente.",
                usuarioId = idNew
            });
        }
        catch (ApplicationException ex) when (ex.Message == "EMAIL_DUPLICATE")
        {
            return Conflict(new { message = "El correo ya está registrado." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (dto is null)
            return BadRequest(new { message = "Datos inválidos." });

        var correo = NormalizeEmail(dto.Correo);

        if (!IsValidEmail(correo))
            return BadRequest(new { message = "Correo inválido." });

        if (string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "La contraseña es obligatoria." });

        var u = await _auth.GetByCorreoAsync(correo);
        if (u is null)
            return Unauthorized(new { message = "Credenciales inválidas." });

        var estado = (u.Value.estadoUsuario ?? "ACTIVE").ToUpperInvariant();

        if (estado != "ACTIVE")
        {
            if (estado == "PAUSED")
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { message = "Tu usuario está inactivo. No puedes iniciar sesión, contacta al administrador." });
            }

            if (estado == "VACATION")
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { message = "Tu usuario está en vacaciones, por eso no puedes iniciar sesión." });
            }

            return StatusCode(StatusCodes.Status403Forbidden,
                new { message = "Tu usuario no está activo, por eso no puedes iniciar sesión." });
        }

        if (!AuthService.VerifyPassword(dto.Password, u.Value.pwdHash))
            return Unauthorized(new { message = "Credenciales inválidas." });

        var (token, expireAt) = _jwt.CreateToken(u.Value.userId, u.Value.correo, u.Value.rol);

        await _auth.CreateSessionAsync(
            u.Value.userId,
            token,
            expireAt,
            Request.Headers["User-Agent"].ToString(),
            HttpContext.Connection.RemoteIpAddress?.ToString()
        );

        return Ok(new TokenResponse(token, expireAt));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var bearer = Request.Headers["Authorization"].ToString();
        var token = bearer?.Split(' ', StringSplitOptions.RemoveEmptyEntries).LastOrDefault();

        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { message = "Token no presente." });

        await _auth.InvalidateSessionAsync(token);
        return Ok(new { message = "Sesión cerrada correctamente." });
    }

    [HttpGet("me")]
    public async Task<ActionResult<MeDto>> Me()
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
                  ?? User.FindFirstValue(JwtRegisteredClaimNames.Email);

        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized(new { message = "No se pudo identificar al usuario autenticado." });

        var u = await _auth.GetByCorreoAsync(email);
        if (u is null)
            return Unauthorized(new { message = "El usuario autenticado no fue encontrado." });

        return Ok(new MeDto(u.Value.userId, u.Value.nombre, u.Value.apellido, u.Value.correo, u.Value.rol));
    }

    [HttpPatch("users/{usuarioId:int}/role/{rol}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> UpdateRole([FromRoute] int usuarioId, [FromRoute] string rol)
    {
        if (usuarioId <= 0)
            return BadRequest(new { message = "Usuario inválido." });

        var currentUserId = GetUserId();
        if (currentUserId.HasValue && currentUserId.Value == usuarioId)
        {
            return BadRequest(new
            {
                message = "No puedes cambiar tu propio rol mientras estás autenticado."
            });
        }

        try
        {
            var normalizedRole = ValidateAndNormalizeRole(rol);
            var by = currentUserId;

            await _auth.UpdateUserRoleAsync(usuarioId, normalizedRole, by);

            return Ok(new
            {
                message = "Rol actualizado correctamente.",
                usuarioId,
                rol = normalizedRole
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    public record ChangePasswordDto(string CurrentPassword, string NewPassword);

    [HttpPost("password/change")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (dto is null)
            return BadRequest(new { message = "Datos inválidos." });

        if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest(new { message = "Contraseña actual y nueva son obligatorias." });

        if (dto.CurrentPassword == dto.NewPassword)
            return BadRequest(new { message = "La nueva contraseña debe ser diferente a la actual." });

        if (!IsStrongPassword(dto.NewPassword))
        {
            return BadRequest(new
            {
                message = "La nueva contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas y números."
            });
        }

        var userId = GetUserId();
        if (userId is null)
            return Unauthorized(new { message = "No se pudo identificar al usuario autenticado." });

        var bearer = Request.Headers["Authorization"].ToString();
        var currentToken = bearer?.Split(' ', StringSplitOptions.RemoveEmptyEntries).LastOrDefault();

        var ok = await _auth.ChangePasswordAsync(userId.Value, dto.CurrentPassword, dto.NewPassword, currentToken);
        if (!ok)
            return Unauthorized(new { message = "La contraseña actual no es válida." });

        return Ok(new { message = "Contraseña actualizada correctamente." });
    }

    public record ForgotPasswordDto(string Correo);
    public record ResetPasswordDto(string Token, string NewPassword);

    [HttpPost("password/forgot")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto, [FromServices] PasswordResetService svc)
    {
        if (dto is null)
            return BadRequest(new { message = "Datos inválidos." });

        var correo = NormalizeEmail(dto.Correo);

        if (!IsValidEmail(correo))
            return BadRequest(new { message = "Correo inválido." });

        await svc.SendResetLinkAsync(correo);

        return Ok(new
        {
            message = "Si el correo existe, se enviará un enlace para restablecer la contraseña."
        });
    }

    [HttpPost("password/reset")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto, [FromServices] PasswordResetService svc)
    {
        if (dto is null)
            return BadRequest(new { message = "Datos inválidos." });

        var token = dto.Token?.Trim();

        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { message = "El token es obligatorio." });

        if (!IsStrongPassword(dto.NewPassword))
        {
            return BadRequest(new
            {
                message = "La nueva contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas y números."
            });
        }

        var ok = await svc.ResetPasswordAsync(token, dto.NewPassword);
        if (!ok)
            return BadRequest(new { message = "El enlace de restablecimiento no es válido o ha expirado." });

        return Ok(new { message = "Contraseña actualizada correctamente. Ya puedes iniciar sesión." });
    }

    [HttpGet("users")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<IEnumerable<AuthService.UserListItem>>> Users()
    {
        var data = await _auth.GetUsersAsync();
        return Ok(data);
    }

    public record UpdateUserDto(
        string? Nombre,
        string? Apellido,
        string? Correo,
        string? Telefono,
        string? Rol
    );

    [HttpPatch("users/{usuarioId:int}/status/{estado}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> SetStatus([FromRoute] int usuarioId, [FromRoute] string estado)
    {
        if (usuarioId <= 0)
            return BadRequest(new { message = "Usuario inválido." });

        var currentUserId = GetUserId();
        if (currentUserId.HasValue && currentUserId.Value == usuarioId)
        {
            return BadRequest(new
            {
                message = "No puedes cambiar tu propio estado mientras estás autenticado."
            });
        }

        if (string.IsNullOrWhiteSpace(estado))
            return BadRequest(new { message = "Estado inválido." });

        try
        {
            var normalizedStatus = estado.Trim().ToUpperInvariant();
            var by = GetUserId();

            await _auth.SetUserStatusAsync(usuarioId, normalizedStatus, by);

            return Ok(new
            {
                message = "Estado actualizado correctamente.",
                usuarioId,
                estado = normalizedStatus
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("users/{usuarioId:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> UpdateBasic([FromRoute] int usuarioId, [FromBody] UpdateUserDto dto)
    {
        if (usuarioId <= 0)
            return BadRequest(new { message = "Usuario inválido." });

        if (dto is null)
            return BadRequest(new { message = "Datos inválidos." });

        var currentUserId = GetUserId();
        if (currentUserId.HasValue && currentUserId.Value == usuarioId && !string.IsNullOrWhiteSpace(dto.Rol))
        {
            return BadRequest(new
            {
                message = "No puedes cambiar tu propio rol mientras estás autenticado."
            });
        }

        try
        {
            var nombre = NormalizeNullableText(dto.Nombre);
            var apellido = NormalizeNullableText(dto.Apellido);
            var correo = string.IsNullOrWhiteSpace(dto.Correo) ? null : ValidateAndNormalizeEmail(dto.Correo, required: false);
            var telefono = ValidateAndNormalizePhone(dto.Telefono);
            var rol = string.IsNullOrWhiteSpace(dto.Rol) ? null : ValidateAndNormalizeRole(dto.Rol);

            if (nombre is null && apellido is null && correo is null && telefono is null && rol is null)
                return BadRequest(new { message = "Debes enviar al menos un campo para actualizar." });

            ValidateNameField(nombre, "nombre", required: false);
            ValidateNameField(apellido, "apellido", required: false);

            var by = GetUserId();

            await _auth.UpdateUserBasicAsync(
                usuarioId,
                nombre,
                apellido,
                correo,
                telefono,
                rol,
                by
            );

            return Ok(new
            {
                message = "Usuario actualizado correctamente.",
                usuarioId
            });
        }
        catch (ApplicationException ex) when (ex.Message == "EMAIL_DUPLICATE")
        {
            return Conflict(new { message = "El correo ya está registrado." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("profile")]
    public async Task<ActionResult<UserProfileDto>> Profile()
    {
        var userId = GetUserId();
        if (userId is null)
            return Unauthorized(new { message = "No se pudo identificar al usuario autenticado." });

        var profile = await _auth.GetProfileAsync(userId.Value);
        if (profile is null)
            return NotFound(new { message = "No se encontró el perfil del usuario." });

        return Ok(profile);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest dto)
    {
        if (dto is null)
            return BadRequest(new { message = "Datos inválidos." });

        var userId = GetUserId();
        if (userId is null)
            return Unauthorized(new { message = "No se pudo identificar al usuario autenticado." });

        try
        {
            var nombre = NormalizeRequiredText(dto.Nombre ?? string.Empty);
            var apellido = NormalizeRequiredText(dto.Apellido ?? string.Empty);
            var correo = ValidateAndNormalizeEmail(dto.Correo, required: true);
            var telefono = ValidateAndNormalizePhone(dto.Telefono, required: true);

            ValidateNameField(nombre, "nombre", required: true);
            ValidateNameField(apellido, "apellido", required: true);

            await _auth.UpdateOwnProfileAsync(
                userId.Value,
                nombre,
                apellido,
                correo,
                telefono
            );

            return Ok(new { message = "Perfil actualizado correctamente." });
        }
        catch (ApplicationException ex) when (ex.Message == "EMAIL_DUPLICATE")
        {
            return Conflict(new { message = "El correo ya está registrado." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
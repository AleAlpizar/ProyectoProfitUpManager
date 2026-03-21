using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
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

    [HttpPost("register")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Register([FromBody] RegisterUserDto dto)
    {
        if (dto is null)
            return BadRequest(new { message = "Datos inválidos." });

        try
        {
            var createdBy = GetUserId();
            var idNew = await _auth.CreateUserAsync(dto, createdBy);
            return Ok(new { usuarioId = idNew });
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
            return Unauthorized(new { message = "Credenciales inválidas" });

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
            return Unauthorized(new { message = "Credenciales inválidas" });

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
            return BadRequest(new { message = "Token no presente" });

        await _auth.InvalidateSessionAsync(token);
        return Ok(new { message = "Sesión cerrada" });
    }

    [HttpGet("me")]
    public async Task<ActionResult<MeDto>> Me()
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
                  ?? User.FindFirstValue(JwtRegisteredClaimNames.Email);

        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized();

        var u = await _auth.GetByCorreoAsync(email);
        if (u is null)
            return Unauthorized();

        return Ok(new MeDto(u.Value.userId, u.Value.nombre, u.Value.apellido, u.Value.correo, u.Value.rol));
    }

    [HttpPatch("users/{usuarioId:int}/role/{rol}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> UpdateRole([FromRoute] int usuarioId, [FromRoute] string rol)
    {
        if (usuarioId <= 0)
            return BadRequest(new { message = "Usuario inválido." });

        if (string.IsNullOrWhiteSpace(rol))
            return BadRequest(new { message = "Rol inválido." });

        var by = GetUserId();
        await _auth.UpdateUserRoleAsync(usuarioId, rol.Trim(), by);
        return Ok(new { usuarioId, rol = rol.Trim() });
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
        if (userId is null) return Unauthorized();

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

        await svc.SendResetLinkAsync(dto.Correo);

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

        if (string.IsNullOrWhiteSpace(dto.Token))
            return BadRequest(new { message = "El token es obligatorio." });

        if (!IsStrongPassword(dto.NewPassword))
        {
            return BadRequest(new
            {
                message = "La nueva contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas y números."
            });
        }

        var ok = await svc.ResetPasswordAsync(dto.Token, dto.NewPassword);
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

        try
        {
            var by = GetUserId();
            await _auth.SetUserStatusAsync(usuarioId, estado.ToUpperInvariant(), by);
            return Ok(new { usuarioId, estado = estado.ToUpperInvariant() });
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
        if (dto is null)
            return BadRequest(new { message = "Datos inválidos." });

        try
        {
            var by = GetUserId();
            await _auth.UpdateUserBasicAsync(
                usuarioId,
                dto.Nombre,
                dto.Apellido,
                dto.Correo,
                dto.Telefono,
                dto.Rol,
                by
            );

            return Ok(new { usuarioId });
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
        if (userId is null) return Unauthorized();

        var profile = await _auth.GetProfileAsync(userId.Value);
        if (profile is null) return NotFound();

        return Ok(profile);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest dto)
    {
        if (dto is null)
            return BadRequest(new { message = "Datos inválidos." });

        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            await _auth.UpdateOwnProfileAsync(
                userId.Value,
                dto.Nombre,
                dto.Apellido,
                dto.Correo,
                dto.Telefono
            );

            return NoContent();
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
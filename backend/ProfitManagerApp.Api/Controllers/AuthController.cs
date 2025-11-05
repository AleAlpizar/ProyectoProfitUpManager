using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Auth;
using static AuthService;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly JwtTokenService _jwt;

    public AuthController(AuthService auth, JwtTokenService jwt)
    {
        _auth = auth; _jwt = jwt;
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
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var u = await _auth.GetByCorreoAsync(dto.Correo);
        if (u is null) return Unauthorized(new { message = "Credenciales inválidas" });

        if (!AuthService.VerifyPassword(dto.Password, u.Value.pwdHash))
            return Unauthorized(new { message = "Credenciales inválidas" });

        var (token, expireAt) = _jwt.CreateToken(u.Value.userId, u.Value.correo, u.Value.rol);
        await _auth.CreateSessionAsync(
            u.Value.userId, token, expireAt,
            Request.Headers["User-Agent"].ToString(),
            HttpContext.Connection.RemoteIpAddress?.ToString()
        );

        return Ok(new TokenResponse(token, expireAt));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var bearer = Request.Headers["Authorization"].ToString();
        var token = bearer?.Split(' ').LastOrDefault();
        if (string.IsNullOrWhiteSpace(token)) return BadRequest(new { message = "Token no presente" });

        await _auth.InvalidateSessionAsync(token!);
        return Ok(new { message = "Sesión cerrada" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<MeDto>> Me()
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
                  ?? User.FindFirstValue(JwtRegisteredClaimNames.Email);

        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();

        var u = await _auth.GetByCorreoAsync(email);
        if (u is null) return Unauthorized();

        return Ok(new MeDto(u.Value.userId, u.Value.nombre, u.Value.apellido, u.Value.correo, u.Value.rol));
    }

    [HttpPatch("users/{usuarioId:int}/role/{rol}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> UpdateRole([FromRoute] int usuarioId, [FromRoute] string rol)
    {
        var by = GetUserId();
        await _auth.UpdateUserRoleAsync(usuarioId, rol, by);
        return Ok(new { usuarioId, rol });
    }

    public record ChangePasswordDto(string CurrentPassword, string NewPassword);

    [HttpPost("password/change")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest(new { message = "Contraseña actual y nueva son obligatorias." });

        if (dto.NewPassword.Length < 8 || !dto.NewPassword.Any(char.IsUpper) || !dto.NewPassword.Any(char.IsLower) || !dto.NewPassword.Any(char.IsDigit))
            return BadRequest(new { message = "La nueva contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas y números." });

        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var bearer = Request.Headers["Authorization"].ToString();
        var currentToken = bearer?.Split(' ').LastOrDefault();

        var ok = await _auth.ChangePasswordAsync(userId.Value, dto.CurrentPassword, dto.NewPassword, currentToken);
        if (!ok) return Unauthorized(new { message = "La contraseña actual no es válida." });

        return Ok(new { message = "Contraseña actualizada correctamente." });
    }

    public record ForgotPasswordDto(string Correo);

    [HttpPost("password/forgot")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto, [FromServices] PasswordResetService svc)
    {
        await svc.SendTemporaryPasswordAsync(dto.Correo);
        return Ok(new { message = "Si el correo existe, se enviará una contraseña temporal." });
    }

    [HttpGet("users")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<IEnumerable<UserListItem>>> Users()
    {
        var data = await _auth.GetUsersAsync();
        return Ok(data);
    }


    public record UpdateUserDto(string? Nombre, string? Apellido, string? Correo, string? Telefono, string? Rol);

    [HttpPatch("users/{usuarioId:int}/status/{estado}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> SetStatus([FromRoute] int usuarioId, [FromRoute] string estado)
    {
        var by = GetUserId();
        await _auth.SetUserStatusAsync(usuarioId, estado.ToUpperInvariant(), by);
        return Ok(new { usuarioId, estado = estado.ToUpperInvariant() });
    }

    [HttpPatch("users/{usuarioId:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> UpdateBasic([FromRoute] int usuarioId, [FromBody] UpdateUserDto dto)
    {
        try
        {
            var by = GetUserId();
            await _auth.UpdateUserBasicAsync(usuarioId, dto.Nombre, dto.Apellido, dto.Correo, dto.Telefono, dto.Rol, by);
            return Ok(new { usuarioId });
        }
        catch (ApplicationException ex) when (ex.Message == "EMAIL_DUPLICATE")
        {
            return Conflict(new { message = "El correo ya está registrado." });
        }
    }
}

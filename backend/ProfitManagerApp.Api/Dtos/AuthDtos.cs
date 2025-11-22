using System;

public record RegisterUserDto(
    string Nombre,
    string? Apellido,
    string Correo,
    string Password,
    string? Telefono,
    string Rol
);

public record LoginDto(string Correo, string Password);

public record MeDto(
    int UsuarioID,
    string Nombre,
    string? Apellido,
    string Correo,
    string Rol
);

public record TokenResponse(string token, DateTime expireAt);

public record UserProfileDto(
    int UsuarioID,
    string Nombre,
    string? Apellido,
    string Correo,
    string? Telefono,
    string Rol,
    DateTime FechaRegistro,
    DateTime? LastLogin,
    string EstadoUsuario
);

public record UpdateProfileRequest(
    string? Nombre,
    string? Apellido,
    string? Correo,
    string? Telefono
);

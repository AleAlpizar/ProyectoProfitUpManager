using System.Globalization;

public sealed class ReportUsersService
{
    public sealed class ReportFilter
    {
        public string? Q { get; init; }
        public string? Estado { get; init; }
        public string? Rol { get; init; }
    }

    public sealed record ReportUserRow(
        int UsuarioID,
        string Nombre,
        string? Apellido,
        string Correo,
        string? Telefono,
        string Rol,
        string EstadoUsuario,
        bool IsActive
    );

    private readonly AuthService _auth;

    public ReportUsersService(AuthService auth) => _auth = auth;

    public async Task<IReadOnlyList<ReportUserRow>> GetUsersForReportAsync(ReportFilter f)
    {
        var baseRows = await _auth.GetUsersAsync();

        string NormalizeEstado(AuthService.UserListItem u)
            => string.IsNullOrWhiteSpace(u.EstadoUsuario)
                ? (u.IsActive ? "ACTIVE" : "PAUSED")
                : u.EstadoUsuario.ToUpperInvariant();

        var data = baseRows
            .Select(u => new ReportUserRow(
                u.UsuarioID,
                u.Nombre,
                u.Apellido,
                u.Correo,
                u.Telefono,
                string.IsNullOrWhiteSpace(u.Rol) ? "Empleado" : u.Rol,
                NormalizeEstado(u),
                u.IsActive
            ));

        if (!string.IsNullOrWhiteSpace(f.Q))
        {
            var term = f.Q!.Trim().ToLowerInvariant();
            data = data.Where(x =>
                   x.Nombre.ToLowerInvariant().Contains(term)
                || (x.Apellido ?? "").ToLowerInvariant().Contains(term)
                || x.Correo.ToLowerInvariant().Contains(term)
                || ("U-" + x.UsuarioID.ToString("0000")).ToLowerInvariant().Contains(term)
                || x.Rol.ToLowerInvariant().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(f.Estado) && f.Estado != "Todos")
        {
            var est = f.Estado!.ToUpperInvariant();
            data = data.Where(x => x.EstadoUsuario == est);
        }

        if (!string.IsNullOrWhiteSpace(f.Rol) && f.Rol != "Todos")
        {
            data = data.Where(x => string.Equals(x.Rol, f.Rol, StringComparison.OrdinalIgnoreCase));
        }

        return data
            .OrderBy(x => x.Rol)
            .ThenBy(x => x.EstadoUsuario)
            .ThenBy(x => x.Nombre, StringComparer.Create(CultureInfo.InvariantCulture, true))
            .ToList();
    }
}

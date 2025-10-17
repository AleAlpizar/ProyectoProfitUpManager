namespace ProfitManagerApp.Api.Dto;

public sealed class UnidadCreateDto
{
    public string Codigo { get; set; } = default!;   
    public string Nombre { get; set; } = default!;  
    public bool Activo { get; set; } = true;
}

public sealed class UnidadUpdateDto
{
    public string Codigo { get; set; } = default!;
    public string Nombre { get; set; } = default!;
    public bool? Activo { get; set; }
}

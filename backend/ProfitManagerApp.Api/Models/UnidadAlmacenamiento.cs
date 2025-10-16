namespace ProfitManagerApp.Api.Models
{
    public class UnidadAlmacenamiento
    {
        public int UnidadID { get; set; }
        public string Codigo { get; set; } = default!; 
        public string Nombre { get; set; } = default!;
        public bool Activo { get; set; } = true;

    }
}

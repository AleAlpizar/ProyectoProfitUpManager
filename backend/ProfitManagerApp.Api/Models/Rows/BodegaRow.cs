namespace ProfitManagerApp.Api.Models.Rows
{
    public class BodegaRow
    {
        public int BodegaID { get; set; }
        public string? Codigo { get; set; }
        public string Nombre { get; set; } = default!;
        public string? Direccion { get; set; }
        public string? Contacto { get; set; }
        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

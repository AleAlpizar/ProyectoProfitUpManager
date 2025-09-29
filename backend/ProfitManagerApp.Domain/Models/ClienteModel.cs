using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProfitManagerApp.Domain.Models
{
  public class ClienteModel
  {
    public int ClienteID { get; set; }                // PK IDENTITY
    public string? CodigoCliente { get; set; }        // UNIQUE (permite null en tabla, ojo con índice único)
    public string Nombre { get; set; } = null!;
    public string TipoPersona { get; set; } = "Natural";
    public string? Identificacion { get; set; }
    public string? Correo { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public DateTime FechaRegistro { get; set; }       // default (sysutcdatetime()) en BD
    public bool IsActive { get; set; } = true;        // default (1) en BD
    public DateTime CreatedAt { get; set; }           // default (sysutcdatetime()) en BD
    public int? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int? UpdatedBy { get; set; }
  }
}

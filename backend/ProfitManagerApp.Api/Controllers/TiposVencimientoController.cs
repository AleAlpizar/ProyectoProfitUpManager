using Microsoft.AspNetCore.Mvc;
using ProfitManagerApp.Api.Data.Abstractions;

namespace ProfitManagerApp.Api.Controllers
{
    [ApiController]
    [Route("api/vencimientos/tipos")]
    public class TiposVencimientoController : ControllerBase
    {
        private readonly IVencimientosRepository _repo;
        public TiposVencimientoController(IVencimientosRepository repo) => _repo = repo;

        [HttpGet]
        public async Task<IActionResult> ListActivos()
        {
            var rows = await _repo.ListTiposActivosAsync();
            return Ok(rows);
        }
    }
}

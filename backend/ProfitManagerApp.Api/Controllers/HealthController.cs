using System.Data;
using Microsoft.AspNetCore.Mvc;
using Dapper;

namespace ProfitManagerApp.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly IDbConnection _db;

        public HealthController(IDbConnection db)
        {
            _db = db;
        }

        [HttpGet("db")]
        public async Task<IActionResult> CheckDb()
        {
            try
            {
                var result = await _db.ExecuteScalarAsync<int>("SELECT 1");
                return Ok(new { ok = true, db = (result == 1), message = "DB OK" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { ok = false, db = false, message = ex.Message });
            }
        }
    }
}

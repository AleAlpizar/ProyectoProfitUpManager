using System.Data;
using Microsoft.Data.SqlClient;

namespace ProfitManagerApp.Data.Infrastructure
{
    public class SqlConnectionFactory
    {
        private readonly string _cs;
        public SqlConnectionFactory(IConfiguration config)
        {
            _cs = config.GetConnectionString("Default")!;
        }
        public IDbConnection Create() => new SqlConnection(_cs);
    }
}

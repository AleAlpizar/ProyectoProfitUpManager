using System.Threading;
using System.Threading.Tasks;

namespace ProfitManagerApp.Api.Services
{
    public interface IVencimientosNotificationService
    {
       
        Task<int> ProcesarAlertasYEnviarCorreosAsync(int umbralDefault = 7, CancellationToken ct = default);
    }
}

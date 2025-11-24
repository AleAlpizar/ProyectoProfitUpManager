using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ProfitManagerApp.Api.Services; 

namespace ProfitManagerApp.Api.Background
{
    public sealed class VencimientosNotificationBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<VencimientosNotificationBackgroundService> _logger;
        private readonly TimeSpan _horaEjecucionUtc;
        private readonly int _umbralDefault;

        public VencimientosNotificationBackgroundService(
            IServiceScopeFactory scopeFactory,
            IOptions<VencimientosNotificationOptions> options,
            ILogger<VencimientosNotificationBackgroundService> logger)
        {
            _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            var opt = options?.Value ?? new VencimientosNotificationOptions();
            _horaEjecucionUtc = opt.HoraEjecucionUtc;
            _umbralDefault = opt.UmbralDefaultDias;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("VencimientosNotificationBackgroundService iniciado.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var nowUtc = DateTime.UtcNow;

                    var nextRun = new DateTime(
                        nowUtc.Year, nowUtc.Month, nowUtc.Day,
                        _horaEjecucionUtc.Hours,
                        _horaEjecucionUtc.Minutes,
                        _horaEjecucionUtc.Seconds,
                        DateTimeKind.Utc);

                    if (nextRun <= nowUtc)
                    {
                        nextRun = nextRun.AddDays(1);
                    }

                    var delay = nextRun - nowUtc;
                    _logger.LogDebug(
                        "VencimientosNotificationBackgroundService: esperando {Delay} hasta la próxima ejecución ({NextRun:u}).",
                        delay, nextRun);

                    await Task.Delay(delay, stoppingToken);

                    using var scope = _scopeFactory.CreateScope();
                    var svc = scope.ServiceProvider.GetRequiredService<IVencimientosNotificationService>();

                    var count = await svc.ProcesarAlertasYEnviarCorreosAsync(_umbralDefault, stoppingToken);

                    _logger.LogInformation(
                        "VencimientosNotificationBackgroundService: notificación diaria ejecutada. Alertas incluidas: {Count}.",
                        count);
                }
                catch (TaskCanceledException)
                {
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "VencimientosNotificationBackgroundService: error en el ciclo de notificaciones.");

                    try
                    {
                        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                    }
                    catch (TaskCanceledException)
                    {
                    }
                }
            }

            _logger.LogInformation("VencimientosNotificationBackgroundService detenido.");
        }
    }
}

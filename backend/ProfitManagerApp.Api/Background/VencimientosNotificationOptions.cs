using System;

namespace ProfitManagerApp.Api.Background
{
    public sealed class VencimientosNotificationOptions
    {
        public bool Enabled { get; set; } = true;

        public int UmbralDefaultDias { get; set; } = 7;

        public string? ToEmail { get; set; }

        public string? Subject { get; set; }

        public TimeSpan HoraEjecucionUtc { get; set; } = new TimeSpan(12, 0, 0);
    }
}

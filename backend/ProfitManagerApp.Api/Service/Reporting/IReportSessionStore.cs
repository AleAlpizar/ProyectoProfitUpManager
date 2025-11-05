using Microsoft.Extensions.Caching.Memory;
using ProfitManagerApp.Api.Dtos;

public sealed class ReportSessionStore : IReportSessionStore
{
    private readonly IMemoryCache _cache;
    public ReportSessionStore(IMemoryCache cache) => _cache = cache;

    private static string MakeKey(int userId, string key) => $"report:{userId}:{key}";

    public void Register(int userId, ReportRegisterDto report)
        => _cache.Set(MakeKey(userId, report.Key), report, TimeSpan.FromMinutes(30));

    public ReportRegisterDto? Get(int userId, string key)
        => _cache.TryGetValue(MakeKey(userId, key), out ReportRegisterDto? r) ? r : null;

    public void Clear(int userId, string key) => _cache.Remove(MakeKey(userId, key));
}

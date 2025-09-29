using AutoMapper;

namespace ProfitManagerApp.Api.Mapping.Converters;

public sealed class TrimOrNullConverter : IValueConverter<string?, string?>
{
  public string? Convert(string? sourceMember, ResolutionContext context)
      => string.IsNullOrWhiteSpace(sourceMember) ? null : sourceMember.Trim();
}

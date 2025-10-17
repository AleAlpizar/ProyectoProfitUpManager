using AutoMapper;
using ProfitManagerApp.Api.Dtos;
using ProfitManagerApp.Api.Mapping.Converters;
using ProfitManagerApp.Domain.Models;

namespace ProfitManagerApp.Api.Mapping
{
   
    public class ApiMappingProfile : Profile
    {
        public ApiMappingProfile()
        {
            var trimOrNull = new TrimOrNullConverter();

            CreateMap<ClienteCreateDto, ClienteModel>()
                .ForMember(d => d.Nombre, m => m.MapFrom(s => (s.Nombre ?? string.Empty).Trim()))
                .ForMember(d => d.CodigoCliente, m => m.ConvertUsing(trimOrNull, s => s.CodigoCliente))
                .ForMember(d => d.TipoPersona, m => m.MapFrom(s =>
                    string.IsNullOrWhiteSpace(s.TipoPersona) ? "Natural" : s.TipoPersona!.Trim()))
                .ForMember(d => d.Identificacion, m => m.ConvertUsing(trimOrNull, s => s.Identificacion))
                .ForMember(d => d.Correo, m => m.ConvertUsing(trimOrNull, s => s.Correo))
                .ForMember(d => d.Telefono, m => m.ConvertUsing(trimOrNull, s => s.Telefono))
                .ForMember(d => d.Direccion, m => m.ConvertUsing(trimOrNull, s => s.Direccion))
                .ForMember(d => d.IsActive, m => m.MapFrom(s => s.IsActive ?? true))

                .ForMember(d => d.ClienteID, m => m.Ignore())
                .ForMember(d => d.FechaRegistro, m => m.Ignore())
                .ForMember(d => d.CreatedAt, m => m.Ignore())
                .ForMember(d => d.CreatedBy, m => m.Ignore())
                .ForMember(d => d.UpdatedAt, m => m.Ignore())
                .ForMember(d => d.UpdatedBy, m => m.Ignore());

            CreateMap<ClienteModel, ClienteReadDto>();
        }
    }
}

namespace ProfitManagerApp.Api.Mapping.Converters
{
    using AutoMapper;

    public sealed class TrimOrNullConverter : IValueConverter<string?, string?>
    {
        public string? Convert(string? sourceMember, ResolutionContext context)
        {
            if (string.IsNullOrWhiteSpace(sourceMember)) return null;
            return sourceMember.Trim();
        }
    }
}

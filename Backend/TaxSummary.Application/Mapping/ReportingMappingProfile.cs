using AutoMapper;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.ValueObjects.Reporting;

namespace TaxSummary.Application.Mapping;

public class ReportingMappingProfile : Profile
{
    public ReportingMappingProfile()
    {
        CreateMap<ReportDefinition, ReportDefinitionDto>()
            .ForMember(dest => dest.Columns, opt => opt.Ignore());

        CreateMap<SavedReportPreset, SavedReportPresetDto>()
            .ForMember(dest => dest.ReportCode, opt => opt.MapFrom(src => src.ReportDefinition != null ? src.ReportDefinition.Code : string.Empty));

        CreateMap<ExecutiveKpiSnapshot, ExecutiveKpiMetricsDto>();

        CreateMap<DepartmentBudgetVariance, TopDepartmentBudgetDto>();

        CreateMap<TaxSourceDistribution, TaxSourceDistributionDto>();
    }
}

using AutoMapper;
using TaxSummary.Application.DTOs;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Application.Mapping;

/// <summary>
/// AutoMapper profile for entity-DTO mappings
/// </summary>
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Employee mappings
        CreateMap<Employee, EmployeeDto>();
        CreateMap<EmployeeDto, Employee>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.AdministrativeStatus, opt => opt.Ignore())
            .ForMember(dest => dest.PerformanceCapabilities, opt => opt.Ignore());

        // Administrative Status mappings
        CreateMap<AdministrativeStatus, AdministrativeStatusDto>();
        CreateMap<AdministrativeStatusDto, AdministrativeStatus>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Employee, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        // Performance Capability mappings
        CreateMap<PerformanceCapability, PerformanceCapabilityDto>();
        CreateMap<PerformanceCapabilityDto, PerformanceCapability>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Employee, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        CreateMap<CreatePerformanceCapabilityDto, PerformanceCapability>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.EmployeeId, opt => opt.Ignore())
            .ForMember(dest => dest.Employee, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        // Employee Report mappings
        CreateMap<Employee, EmployeeReportDto>()
            .ForMember(dest => dest.Employee, opt => opt.MapFrom(src => src))
            .ForMember(dest => dest.AdminStatus, opt => opt.MapFrom(src => src.AdministrativeStatus))
            .ForMember(dest => dest.Capabilities, opt => opt.MapFrom(src => src.PerformanceCapabilities));
    }
}

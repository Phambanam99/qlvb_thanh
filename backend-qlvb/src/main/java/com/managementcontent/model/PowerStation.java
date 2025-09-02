package com.managementcontent.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "power_stations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PowerStation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "fuel_type", nullable = false)
    private String fuel;
    
    @Column(name = "station_code")
    private String stationCode;
    
    @Column(name = "manufacture_year")
    private Integer manufactureYear;
    
    @Column(name = "start_use_year")
    private Integer startUseYear;
    
    @Column(name = "quality_level")
    private String qualityLevel;
    
    private String purpose;
    
    private String status;
    
    @Column(name = "unit_name")
    private String unitName;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
}

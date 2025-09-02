package com.managementcontent.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "vehicles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "registration_number", nullable = false)
    private String registration;
    
    @Column(name = "make_model", nullable = false)
    private String makeModel;
    
    @Column(name = "chassis_number")
    private String chassisNo;
    
    @Column(name = "engine_number")
    private String engineNo;
    
    @Column(name = "manufacture_year")
    private Integer manufactureYear;
    
    @Column(name = "start_use_year")
    private Integer startUseYear;
    
    private String origin;
    
    @Column(name = "stationed_at")
    private String stationedAt;
    
    @Column(name = "quality_grade")
    private String qualityGrade;
    
    private String status;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type")
    private VehicleType vehicleType;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    public enum VehicleType {
        REGULAR, ENGINEERING
    }
}

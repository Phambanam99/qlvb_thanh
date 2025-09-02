package com.managementcontent.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "ammunitions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ammunition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String unit;
    
    @Column(name = "grade_level")
    private String grade;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(name = "weight_ton")
    private BigDecimal weightTon;
    
    @Embedded
    private AmmunitionDistribution distribution;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AmmunitionDistribution {
        @Column(name = "tm_quantity")
        private Integer tm;
        
        @Column(name = "d1_quantity")
        private Integer d1;
        
        @Column(name = "d2_quantity")
        private Integer d2;
        
        @Column(name = "d3_quantity")
        private Integer d3;
        
        @Column(name = "kho_lu_quantity")
        private Integer khoLu;
        
        @Column(name = "kho_k820_quantity")
        private Integer khoK820;
    }
}

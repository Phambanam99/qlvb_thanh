package com.managementcontent.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "weapons")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Weapon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "origin_country")
    private String origin;
    
    @Column(nullable = false)
    private String unit;
    
    @Column(name = "grade_level")
    private String grade;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Embedded
    private WeaponDistribution distribution;
    
    private String note;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeaponDistribution {
        @Column(name = "total_quantity")
        private Integer total;
        
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
    }
}

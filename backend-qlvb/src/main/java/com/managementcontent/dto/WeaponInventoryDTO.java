package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeaponInventoryDTO {
    private Object id;
    private String name;
    private String origin; // Nước sản xuất
    private String unit;   // ĐVT
    private String grade;  // Phân cấp
    private int quantity;
    private WeaponDistribution distribution;
    private String note;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeaponDistribution {
        private int total;
        private int tm;
        private int d1;
        private int d2;
        private int d3;
        private int khoLu;
    }
}

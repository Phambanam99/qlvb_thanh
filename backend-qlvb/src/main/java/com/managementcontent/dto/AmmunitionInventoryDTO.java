package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AmmunitionInventoryDTO {
    private Object id;
    private String name;
    private String unit; // Đơn vị tính
    private String grade; // Phân cấp
    private int quantity;
    private Double weightTon; // Khối lượng (tấn)
    private AmmunitionDistribution distribution;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AmmunitionDistribution {
        private int tm;
        private int d1;
        private int d2;
        private int d3;
        private int khoLu;
        private Integer khoK820;
    }
}



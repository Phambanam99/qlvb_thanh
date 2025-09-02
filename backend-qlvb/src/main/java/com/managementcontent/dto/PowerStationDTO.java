package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PowerStationDTO {
    private Object id;
    private String name; // Tên trạm nguồn
    private String fuel; // Nhiên liệu SD
    private String stationCode; // Số hiệu trạm
    private Integer manufactureYear; // Năm sản xuất
    private Integer startUseYear; // Năm BĐ SD
    private String qualityLevel; // Cấp CL
    private String purpose; // M/đích SD
    private String status; // T/thái SD
    private String unitName; // Đơn vị
}



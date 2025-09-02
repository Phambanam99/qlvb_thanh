package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleInventoryDTO {
    private Object id;
    private String registration; // Số đăng ký
    private String makeModel;    // Nhãn xe cơ sở
    private String chassisNo;    // Số khung
    private String engineNo;     // Số máy
    private Integer manufactureYear; // Năm s.xuất
    private Integer startUseYear;    // Năm b.s. dụng
    private String origin;       // Nguồn gốc
    private String stationedAt;  // B.chế ở
    private String qualityGrade; // Phân cấp CL
    private String status;       // Trạng thái SD
}



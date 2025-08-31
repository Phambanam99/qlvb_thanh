package com.managementcontent.dto;

import lombok.*;

import java.util.Date;
@Getter
@AllArgsConstructor
@Setter
@Data
@NoArgsConstructor
public class EquipmentDTO {
    public Long id;
    public String name;
    public String category;
    public String serialNumber;
    public String status;
    public String conditionLabel;
    public Integer quantity;
    public Date purchaseDate;
    public Date lastMaintenanceDate;
    public String notes;
    public Long departmentId;
    public String departmentName;
    public Date createdAt;
    public Date updatedAt;
}

package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.model.enums.SecurityLevel;
import com.managementcontent.model.enums.DistributionType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/enums")
@Tag(name = "Enums", description = "APIs for getting enum values for frontend")
public class EnumController {

    @Operation(summary = "Get all security levels", description = "Returns all available security levels for documents")
    @GetMapping("/security-levels")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getSecurityLevels() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("values", Arrays.stream(SecurityLevel.values())
                    .map(level -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("code", level.getCode());
                        item.put("displayName", level.getDisplayName());
                        return item;
                    })
                    .collect(Collectors.toList()));
            return ResponseEntity.ok(ResponseDTO.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách mức độ bảo mật: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get all distribution types", description = "Returns all available distribution types for outgoing documents")
    @GetMapping("/distribution-types")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getDistributionTypes() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("values", Arrays.stream(DistributionType.values())
                    .map(type -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("code", type.getCode());
                        item.put("displayName", type.getDisplayName());
                        return item;
                    })
                    .collect(Collectors.toList()));
            return ResponseEntity.ok(ResponseDTO.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách loại phân phối: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get all enum values", description = "Returns all enum values in a single response for frontend initialization")
    @GetMapping("/all")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getAllEnums() {
        try {
            Map<String, Object> response = new HashMap<>();

            // Security levels
            response.put("securityLevels", Arrays.stream(SecurityLevel.values())
                    .map(level -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("code", level.getCode());
                        item.put("displayName", level.getDisplayName());
                        return item;
                    })
                    .collect(Collectors.toList()));

            // Distribution types
            response.put("distributionTypes", Arrays.stream(DistributionType.values())
                    .map(type -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("code", type.getCode());
                        item.put("displayName", type.getDisplayName());
                        return item;
                    })
                    .collect(Collectors.toList()));

            return ResponseEntity.ok(ResponseDTO.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy tất cả enum: " + e.getMessage()));
        }
    }
}
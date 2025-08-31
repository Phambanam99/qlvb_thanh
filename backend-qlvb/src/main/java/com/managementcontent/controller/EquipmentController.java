package com.managementcontent.controller;

import com.managementcontent.dto.EquipmentDTO;
import com.managementcontent.dto.EquipmentStatsDTO;
import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.service.EquipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/equipment")
@Tag(name = "Equipment", description = "APIs for managing weapons and equipment by department")
public class EquipmentController {

    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @GetMapping
    @Operation(summary = "List equipment")
    public ResponseEntity<ResponseDTO<Page<EquipmentDTO>>> list(Pageable pageable,
            @RequestParam(required = false) Long departmentId) {
        try {
            Page<EquipmentDTO> data = equipmentService.list(pageable, departmentId);
            return ResponseEntity.ok(ResponseDTO.success(data));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách trang bị: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get equipment by id")
    public ResponseEntity<ResponseDTO<EquipmentDTO>> getById(@PathVariable Long id) {
        Optional<EquipmentDTO> dto = equipmentService.getById(id);
        return dto.map(value -> ResponseEntity.ok(ResponseDTO.success(value)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy trang bị")));
    }

    @PostMapping
    @Operation(summary = "Create equipment")
    public ResponseEntity<ResponseDTO<EquipmentDTO>> create(@RequestBody EquipmentDTO dto) {
        try {
            System.out.println(dto.name);
            EquipmentDTO created = equipmentService.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseDTO.success("Tạo trang bị thành công", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Lỗi khi tạo trang bị: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update equipment")
    public ResponseEntity<ResponseDTO<EquipmentDTO>> update(@PathVariable Long id, @RequestBody EquipmentDTO dto) {
        try {
            Optional<EquipmentDTO> updated = equipmentService.update(id, dto);
            return updated.map(value -> ResponseEntity.ok(ResponseDTO.success("Cập nhật trang bị thành công", value)))
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy trang bị")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Lỗi khi cập nhật trang bị: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete equipment")
    public ResponseEntity<ResponseDTO<String>> delete(@PathVariable Long id) {
        try {
            boolean deleted = equipmentService.delete(id);
            if (deleted)
                return ResponseEntity.ok(ResponseDTO.success("Xóa trang bị thành công"));
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseDTO.error("Không tìm thấy trang bị"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Lỗi khi xóa trang bị: " + e.getMessage()));
        }
    }

    @GetMapping("/statistics")
    @Operation(summary = "Equipment statistics")
    public ResponseEntity<ResponseDTO<EquipmentStatsDTO>> statistics(
            @RequestParam(required = false) Long departmentId) {
        try {
            EquipmentStatsDTO stats = equipmentService.stats(departmentId);
            return ResponseEntity.ok(ResponseDTO.success(stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê trang bị: " + e.getMessage()));
        }
    }
}

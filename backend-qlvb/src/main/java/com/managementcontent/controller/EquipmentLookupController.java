package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.model.EquipmentCategory;
import com.managementcontent.model.EquipmentCondition;
import com.managementcontent.model.EquipmentStatus;
import com.managementcontent.service.EquipmentLookupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/equipment/lookups")
@Tag(name = "Equipment Lookups", description = "Lookup lists for equipment form dropdowns")
public class EquipmentLookupController {
    private final EquipmentLookupService service;

    public EquipmentLookupController(EquipmentLookupService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Get all equipment lookups")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getAll() {
        Map<String, Object> data = new HashMap<>();
        data.put("categories", service.getActiveCategories());
        data.put("statuses", service.getActiveStatuses());
        data.put("conditions", service.getActiveConditions());
        return ResponseEntity.ok(ResponseDTO.success(data));
    }

    @GetMapping("/categories")
    public ResponseEntity<ResponseDTO<List<EquipmentCategory>>> categories() {
        return ResponseEntity.ok(ResponseDTO.success(service.getActiveCategories()));
    }

    @GetMapping("/statuses")
    public ResponseEntity<ResponseDTO<List<EquipmentStatus>>> statuses() {
        return ResponseEntity.ok(ResponseDTO.success(service.getActiveStatuses()));
    }

    @GetMapping("/conditions")
    public ResponseEntity<ResponseDTO<List<EquipmentCondition>>> conditions() {
        return ResponseEntity.ok(ResponseDTO.success(service.getActiveConditions()));
    }

    @GetMapping("/categories/all")
    public ResponseEntity<ResponseDTO<List<EquipmentCategory>>> categoriesAll() {
        return ResponseEntity.ok(ResponseDTO.success(service.getAllCategories()));
    }

    @GetMapping("/statuses/all")
    public ResponseEntity<ResponseDTO<List<EquipmentStatus>>> statusesAll() {
        return ResponseEntity.ok(ResponseDTO.success(service.getAllStatuses()));
    }

    @GetMapping("/conditions/all")
    public ResponseEntity<ResponseDTO<List<EquipmentCondition>>> conditionsAll() {
        return ResponseEntity.ok(ResponseDTO.success(service.getAllConditions()));
    }

    @PostMapping("/categories")
    public ResponseEntity<ResponseDTO<EquipmentCategory>> createCategory(@RequestBody EquipmentCategory payload) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDTO.success(service.createCategory(payload)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error(e.getMessage()));
        }
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ResponseDTO<EquipmentCategory>> updateCategory(@PathVariable Long id,
            @RequestBody EquipmentCategory payload) {
        try {
            Optional<EquipmentCategory> updated = service.updateCategory(id, payload);
            return updated.map(v -> ResponseEntity.ok(ResponseDTO.success(v))).orElseGet(() -> ResponseEntity
                    .status(HttpStatus.NOT_FOUND).body(ResponseDTO.error("Không tìm thấy danh mục")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error(e.getMessage()));
        }
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ResponseDTO<String>> deleteCategory(@PathVariable Long id) {
        service.deleteCategory(id);
        return ResponseEntity.ok(ResponseDTO.success("Đã xóa"));
    }

    @PostMapping("/statuses")
    public ResponseEntity<ResponseDTO<EquipmentStatus>> createStatus(@RequestBody EquipmentStatus payload) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDTO.success(service.createStatus(payload)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error(e.getMessage()));
        }
    }

    @PutMapping("/statuses/{id}")
    public ResponseEntity<ResponseDTO<EquipmentStatus>> updateStatus(@PathVariable Long id,
            @RequestBody EquipmentStatus payload) {
        try {
            Optional<EquipmentStatus> updated = service.updateStatus(id, payload);
            return updated.map(v -> ResponseEntity.ok(ResponseDTO.success(v))).orElseGet(() -> ResponseEntity
                    .status(HttpStatus.NOT_FOUND).body(ResponseDTO.error("Không tìm thấy trạng thái")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error(e.getMessage()));
        }
    }

    @DeleteMapping("/statuses/{id}")
    public ResponseEntity<ResponseDTO<String>> deleteStatus(@PathVariable Long id) {
        service.deleteStatus(id);
        return ResponseEntity.ok(ResponseDTO.success("Đã xóa"));
    }

    @PostMapping("/conditions")
    public ResponseEntity<ResponseDTO<EquipmentCondition>> createCondition(@RequestBody EquipmentCondition payload) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseDTO.success(service.createCondition(payload)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error(e.getMessage()));
        }
    }

    @PutMapping("/conditions/{id}")
    public ResponseEntity<ResponseDTO<EquipmentCondition>> updateCondition(@PathVariable Long id,
            @RequestBody EquipmentCondition payload) {
        try {
            Optional<EquipmentCondition> updated = service.updateCondition(id, payload);
            return updated.map(v -> ResponseEntity.ok(ResponseDTO.success(v))).orElseGet(() -> ResponseEntity
                    .status(HttpStatus.NOT_FOUND).body(ResponseDTO.error("Không tìm thấy tình trạng")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error(e.getMessage()));
        }
    }

    @DeleteMapping("/conditions/{id}")
    public ResponseEntity<ResponseDTO<String>> deleteCondition(@PathVariable Long id) {
        service.deleteCondition(id);
        return ResponseEntity.ok(ResponseDTO.success("Đã xóa"));
    }

    @PostMapping("/initialize")
    @Operation(summary = "Initialize default lookup values")
    public ResponseEntity<ResponseDTO<String>> initialize() {
        service.initializeDefaults();
        return ResponseEntity.ok(ResponseDTO.success("Đã khởi tạo danh mục mặc định"));
    }
}

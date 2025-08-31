package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.service.InternalDocumentDemoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller để quản lý dữ liệu demo cho công văn nội bộ
 */
@RestController
@RequestMapping("/api/demo/internal-documents")
@RequiredArgsConstructor
@Tag(name = "Demo Data", description = "APIs để tạo và quản lý dữ liệu demo")
public class InternalDocumentDemoController {

    private final InternalDocumentDemoService demoService;

    /**
     * Tạo 1000 công văn nội bộ demo
     */
    @Operation(summary = "Tạo 1000 công văn nội bộ demo", 
               description = "Tạo 1000 công văn nội bộ với dữ liệu ngẫu nhiên nhưng thực tế")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tạo dữ liệu demo thành công"),
        @ApiResponse(responseCode = "500", description = "Lỗi khi tạo dữ liệu demo")
    })
    @PostMapping("/create")
    public ResponseEntity<ResponseDTO<String>> createDemoDocuments() {
        try {
            demoService.createDemoInternalDocuments();
            return ResponseEntity.ok(ResponseDTO.success("Đã tạo thành công 1000 công văn nội bộ demo"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(ResponseDTO.error("Lỗi khi tạo dữ liệu demo: " + e.getMessage()));
        }
    }

    /**
     * Xóa tất cả công văn demo
     */
    @Operation(summary = "Xóa tất cả công văn demo", 
               description = "Xóa tất cả công văn demo đã tạo (để test lại)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Xóa dữ liệu demo thành công"),
        @ApiResponse(responseCode = "500", description = "Lỗi khi xóa dữ liệu demo")
    })
    @DeleteMapping("/clear")
    public ResponseEntity<ResponseDTO<String>> clearDemoDocuments() {
        try {
            demoService.deleteAllDemoDocuments();
            return ResponseEntity.ok(ResponseDTO.success("Đã xóa tất cả công văn demo"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(ResponseDTO.error("Lỗi khi xóa dữ liệu demo: " + e.getMessage()));
        }
    }

    /**
     * Kiểm tra số lượng công văn hiện có
     */
    @Operation(summary = "Kiểm tra số lượng công văn", 
               description = "Trả về tổng số công văn nội bộ hiện có trong hệ thống")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lấy thông tin thành công")
    })
    @GetMapping("/count")
    public ResponseEntity<ResponseDTO<Long>> countDocuments() {
        try {
            long count = demoService.countTotalDocuments();
            return ResponseEntity.ok(ResponseDTO.success(count));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(ResponseDTO.error("Lỗi khi đếm công văn: " + e.getMessage()));
        }
    }
}

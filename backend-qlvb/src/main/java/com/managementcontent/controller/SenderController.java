package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.dto.SenderDTO;
import com.managementcontent.service.SenderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/senders")
@RequiredArgsConstructor
@Tag(name = "Senders", description = "APIs for managing document sender organizations")
public class SenderController {
    private final SenderService senderService;

    @Operation(summary = "Get all senders", description = "Returns a list of all document sender organizations")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved senders list")
    })
    @GetMapping
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'EDITOR')")
    public ResponseEntity<ResponseDTO<List<SenderDTO>>> getAllSenders() {
        try {
            List<SenderDTO> senders = senderService.getAllSenders();
            return ResponseEntity.ok(ResponseDTO.success(senders));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách đơn vị gửi: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get sender by ID", description = "Returns a sender by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved sender"),
            @ApiResponse(responseCode = "404", description = "Sender not found")
    })
    @GetMapping("/{id}")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'EDITOR')")
    public ResponseEntity<ResponseDTO<SenderDTO>> getSenderById(
            @Parameter(description = "ID of the sender to retrieve") @PathVariable Long id) {
        try {
            return senderService.getSenderById(id)
                    .map(sender -> ResponseEntity.ok(ResponseDTO.success(sender)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy đơn vị gửi")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thông tin đơn vị gửi: " + e.getMessage()));
        }
    }

    @Operation(summary = "Create new sender", description = "Creates a new sender organization")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Sender successfully created"),
            @ApiResponse(responseCode = "403", description = "Not authorized to create senders")
    })
    @PostMapping
    // @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<ResponseDTO<SenderDTO>> createSender(
            @Parameter(description = "Sender details", required = true) @RequestBody SenderDTO senderDTO) {
        try {
            SenderDTO createdSender = senderService.createSender(senderDTO);
            if (createdSender == null) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ResponseDTO.error("Đơn vị gửi đã tồn tại"));
            }
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseDTO.success("Tạo đơn vị gửi thành công", createdSender));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi tạo đơn vị gửi: " + e.getMessage()));
        }
    }

    @Operation(summary = "Update sender", description = "Updates an existing sender organization")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Sender successfully updated"),
            @ApiResponse(responseCode = "404", description = "Sender not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to update senders")
    })
    @PutMapping("/{id}")
    // @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<ResponseDTO<SenderDTO>> updateSender(
            @Parameter(description = "ID of the sender to update") @PathVariable Long id,
            @Parameter(description = "Updated sender information", required = true) @RequestBody SenderDTO senderDTO) {
        try {
            return senderService.updateSender(id, senderDTO)
                    .map(sender -> ResponseEntity.ok(ResponseDTO.success("Cập nhật đơn vị gửi thành công", sender)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy đơn vị gửi")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi cập nhật đơn vị gửi: " + e.getMessage()));
        }
    }

    @Operation(summary = "Delete sender", description = "Deletes a sender by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Sender successfully deleted"),
            @ApiResponse(responseCode = "404", description = "Sender not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to delete senders")
    })
    @DeleteMapping("/{id}")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<String>> deleteSender(
            @Parameter(description = "ID of the sender to delete") @PathVariable Long id) {
        try {
            boolean deleted = senderService.deleteSender(id);
            if (deleted) {
                return ResponseEntity.ok(ResponseDTO.success("Xóa đơn vị gửi thành công"));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseDTO.error("Không tìm thấy đơn vị gửi"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi xóa đơn vị gửi: " + e.getMessage()));
        }
    }
}
package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.dto.SignatureDTO;
import com.managementcontent.model.Signature;
import com.managementcontent.service.SignatureService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/signatures")
@Tag(name = "Signatures", description = "APIs for managing digital signatures")
@RequiredArgsConstructor
public class SignatureController {

    private final SignatureService signatureService;

    @GetMapping
    @Operation(summary = "Get user's signatures", description = "Fetches a list of signatures for the currently authenticated user.")
    public ResponseEntity<ResponseDTO<List<SignatureDTO>>> getUserSignatures() {
        List<Signature> signatures = signatureService.getSignaturesForCurrentUser();
        List<SignatureDTO> signatureDTOs = signatures.stream()
                .map(s -> new SignatureDTO(s.getId(), s.getFileName()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ResponseDTO.success("Lấy danh sách chữ ký thành công", signatureDTOs));
    }

    @PostMapping
    @Operation(summary = "Create a new signature", description = "Uploads a signature image and sets a password for it.")
    public ResponseEntity<ResponseDTO<SignatureDTO>> createSignature(
            @RequestParam("file") MultipartFile file,
            @RequestParam("password") String password) {
        try {
            Signature signature = signatureService.createSignature(file, password);
            SignatureDTO signatureDTO = new SignatureDTO(signature.getId(), signature.getFileName());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseDTO.success("Tạo chữ ký thành công", signatureDTO));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Tạo chữ ký thất bại: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a signature", description = "Deletes a signature by its ID, requires password verification.")
    public ResponseEntity<ResponseDTO<Void>> deleteSignature(
            @PathVariable("id") Long id,
            @RequestParam("password") String password) {
        try {
            signatureService.deleteSignature(id, password);
            return ResponseEntity.ok(ResponseDTO.success("Xóa chữ ký thành công", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Xóa chữ ký thất bại: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/image")
    @Operation(summary = "Get signature image data", description = "Retrieves the raw image data for a signature, requires password verification.")
    public ResponseEntity<byte[]> getSignatureImage(
            @PathVariable("id") Long id,
            @RequestBody String password) {
        try {
            byte[] imageData = signatureService.getSignatureImage(id, password);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG) // Assuming PNG, adjust if other types are supported
                    .body(imageData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}
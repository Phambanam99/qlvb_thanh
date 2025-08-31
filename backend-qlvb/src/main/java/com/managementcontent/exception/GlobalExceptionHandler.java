package com.managementcontent.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MultipartException;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<Map<String, Object>> handleMultipartException(MultipartException e) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "Multipart Exception");
        errorResponse.put("timestamp", System.currentTimeMillis());
        
        // Check if it's an EOFException (client disconnect)
        if (e.getCause() instanceof java.io.EOFException) {
            errorResponse.put("message", "File upload interrupted - client disconnected");
            errorResponse.put("status", HttpStatus.REQUEST_TIMEOUT.value());
            return ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT).body(errorResponse);
        }
        
        // Other multipart exceptions
        errorResponse.put("message", "Failed to process multipart request: " + e.getMessage());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }
} 
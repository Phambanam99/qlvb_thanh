package com.managementcontent.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/public")
    public ResponseEntity<String> testPublic() {
        return ResponseEntity.ok("Test public endpoint works!");
    }
    
    @GetMapping("/dashboard")
    public ResponseEntity<String> testDashboard() {
        return ResponseEntity.ok("Test dashboard endpoint works!");
    }
    
    @GetMapping("/json")
    public ResponseEntity<Map<String, Object>> testJson() {
        Map<String, Object> data = new HashMap<>();
        data.put("message", "Test JSON endpoint works!");
        data.put("timestamp", System.currentTimeMillis());
        data.put("success", true);
        return ResponseEntity.ok(data);
    }
}

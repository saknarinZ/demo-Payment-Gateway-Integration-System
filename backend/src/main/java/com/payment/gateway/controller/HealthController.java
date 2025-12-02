package com.payment.gateway.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Health Controller - ตรวจสอบสถานะของ API
 * 
 * Controller สำหรับ Health Check และข้อมูลพื้นฐานของ API
 */
@RestController
@RequestMapping("/api/v1")
public class HealthController {

    /**
     * Health Check Endpoint
     * ใช้สำหรับตรวจสอบว่า API ทำงานปกติหรือไม่
     * 
     * @return สถานะของ API
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        // สร้าง Response แบบ Map (จะถูกแปลงเป็น JSON อัตโนมัติ)
        Map<String, Object> response = Map.of(
            "status", "UP",
            "service", "Payment Gateway API",
            "version", "1.0.0",
            "timestamp", LocalDateTime.now().toString(),
            "virtualThreads", Thread.currentThread().isVirtual() ? "enabled" : "disabled"
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * API Info Endpoint
     * แสดงข้อมูลเกี่ยวกับ API
     * 
     * @return ข้อมูล API
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, String>> info() {
        Map<String, String> info = Map.of(
            "name", "Payment Gateway Integration System",
            "description", "ระบบเชื่อมต่อ Payment Gateway",
            "version", "1.0.0",
            "javaVersion", System.getProperty("java.version"),
            "springBootVersion", "3.4.0"
        );
        
        return ResponseEntity.ok(info);
    }
}

package com.payment.gateway.controller;

import com.payment.gateway.dto.CreateMerchantRequest;
import com.payment.gateway.dto.MerchantResponse;
import com.payment.gateway.service.MerchantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * MerchantController - REST Controller สำหรับจัดการ Merchant
 * 
 * Endpoints:
 * - POST /api/v1/merchants - สร้าง Merchant ใหม่
 * - GET /api/v1/merchants - ดึงรายการ Merchant ทั้งหมด
 * - GET /api/v1/merchants/{id} - ดึง Merchant ตาม ID
 * - PATCH /api/v1/merchants/{id}/status - อัพเดทสถานะ
 * - POST /api/v1/merchants/{id}/regenerate-secret - สร้าง API Secret ใหม่
 */
@RestController
@RequestMapping("/api/v1/merchants")
@CrossOrigin(origins = "*")
public class MerchantController {

    private final MerchantService merchantService;

    public MerchantController(MerchantService merchantService) {
        this.merchantService = merchantService;
    }

    /**
     * สร้าง Merchant ใหม่
     * 
     * @param request CreateMerchantRequest
     * @return MerchantResponse พร้อม API Key และ Secret
     */
    @PostMapping
    public ResponseEntity<MerchantResponse> createMerchant(@Valid @RequestBody CreateMerchantRequest request) {
        MerchantResponse response = merchantService.createMerchant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * ดึงรายการ Merchant ทั้งหมด
     * 
     * @return รายการ MerchantResponse
     */
    @GetMapping
    public ResponseEntity<List<MerchantResponse>> getAllMerchants() {
        List<MerchantResponse> response = merchantService.getAllMerchants();
        return ResponseEntity.ok(response);
    }

    /**
     * ดึง Merchant ตาม ID
     * 
     * @param id Merchant ID
     * @return MerchantResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<MerchantResponse> getMerchantById(@PathVariable Long id) {
        MerchantResponse response = merchantService.getMerchantById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * อัพเดทสถานะ Active/Inactive
     * 
     * @param id Merchant ID
     * @param isActive สถานะใหม่
     * @return MerchantResponse
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<MerchantResponse> updateMerchantStatus(
            @PathVariable Long id,
            @RequestParam boolean isActive) {
        
        MerchantResponse response = merchantService.updateMerchantStatus(id, isActive);
        return ResponseEntity.ok(response);
    }

    /**
     * สร้าง API Secret ใหม่
     * 
     * @param id Merchant ID
     * @return MerchantResponse พร้อม Secret ใหม่
     */
    @PostMapping("/{id}/regenerate-secret")
    public ResponseEntity<MerchantResponse> regenerateApiSecret(@PathVariable Long id) {
        MerchantResponse response = merchantService.regenerateApiSecret(id);
        return ResponseEntity.ok(response);
    }
}

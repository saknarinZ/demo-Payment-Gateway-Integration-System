package com.payment.gateway.controller;

import com.payment.gateway.dto.OmiseChargeRequest;
import com.payment.gateway.dto.OmiseChargeResponse;
import com.payment.gateway.service.OmiseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

/**
 * OmisePaymentController - REST Controller สำหรับ Omise Payment API
 * 
 * Endpoints:
 * - GET  /api/v1/omise/config      - ดึง Public Key สำหรับ Frontend
 * - POST /api/v1/omise/charges     - สร้าง Charge
 * - GET  /api/v1/omise/charges/{id} - ดึงข้อมูล Charge
 * 
 * @see <a href="https://www.omise.co/docs">Omise Documentation</a>
 */
@RestController
@RequestMapping("/api/v1/omise")
@Tag(name = "Omise Payments", description = "Omise (Opn Payments) Integration API")
@CrossOrigin(origins = "*")  // TODO: ปรับให้เฉพาะ Domain ที่อนุญาตใน Production
public class OmisePaymentController {

    private static final Logger logger = LoggerFactory.getLogger(OmisePaymentController.class);

    private final OmiseService omiseService;

    public OmisePaymentController(OmiseService omiseService) {
        this.omiseService = omiseService;
    }

    // =========================================================================
    // GET /api/v1/omise/config - ดึง Configuration สำหรับ Frontend
    // =========================================================================
    
    @GetMapping("/config")
    @Operation(
        summary = "Get Omise Configuration",
        description = "ดึง Public Key สำหรับใช้กับ Omise.js ใน Frontend"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Configuration retrieved successfully"
        )
    })
    public ResponseEntity<Map<String, String>> getConfig() {
        logger.debug("Getting Omise configuration for frontend");
        
        String publicKey = omiseService.getPublicKey();
        
        // ตรวจสอบว่าเป็น Test หรือ Live Key
        boolean isTestMode = publicKey != null && publicKey.contains("_test_");
        
        return ResponseEntity.ok(Map.of(
            "publicKey", publicKey,
            "testMode", String.valueOf(isTestMode)
        ));
    }

    // =========================================================================
    // POST /api/v1/omise/charges - สร้าง Charge
    // =========================================================================
    
    @PostMapping("/charges")
    @Operation(
        summary = "Create Charge",
        description = """
            สร้าง Charge ใหม่จาก Token ที่ได้จาก Omise.js
            
            ขั้นตอนการใช้งาน:
            1. Frontend ใช้ Omise.js เพื่อ Tokenize ข้อมูลบัตร
            2. ส่ง Token มาที่ API นี้พร้อม Amount
            3. Backend จะสร้าง Charge และ Return ผลลัพธ์
            
            หมายเหตุ:
            - Amount ต้องเป็นหน่วยสตางค์ (1 บาท = 100 สตางค์)
            - Minimum Amount คือ 20 บาท (2000 สตางค์)
            """
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Charge created successfully",
            content = @Content(schema = @Schema(implementation = OmiseChargeResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))
        ),
        @ApiResponse(
            responseCode = "402",
            description = "Payment failed",
            content = @Content(schema = @Schema(implementation = OmiseChargeResponse.class))
        )
    })
    public ResponseEntity<OmiseChargeResponse> createCharge(
            @Valid @RequestBody OmiseChargeRequest request) {
        
        logger.info("Creating Omise charge: amount={} {}", 
                request.amountInBaht(), request.currency());

        OmiseChargeResponse response = omiseService.createCharge(request);
        
        // ตรวจสอบผลลัพธ์
        if (response.isFailed()) {
            logger.warn("Charge failed: code={}, message={}", 
                    response.failureCode(), response.failureMessage());
            return ResponseEntity.status(402).body(response);  // 402 Payment Required
        }
        
        if (response.requiresAuthorization()) {
            logger.info("Charge requires 3D Secure authorization: {}", response.authorizeUri());
            // Return 200 พร้อม authorizeUri ให้ Frontend redirect
        }
        
        if (response.isSuccessful()) {
            logger.info("Charge successful: id={}", response.id());
        }
        
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // GET /api/v1/omise/charges/{id} - ดึงข้อมูล Charge
    // =========================================================================
    
    @GetMapping("/charges/{chargeId}")
    @Operation(
        summary = "Get Charge",
        description = "ดึงข้อมูล Charge ตาม ID"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Charge retrieved successfully"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Charge not found"
        )
    })
    public ResponseEntity<OmiseChargeResponse> getCharge(
            @PathVariable String chargeId) {
        
        logger.info("Retrieving Omise charge: {}", chargeId);
        
        OmiseChargeResponse response = omiseService.getCharge(chargeId);
        
        if (response.failureCode() != null && response.failureCode().equals("not_found")) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // POST /api/v1/omise/charges/{id}/complete - Callback หลัง 3D Secure
    // =========================================================================
    
    @GetMapping("/charges/{chargeId}/complete")
    @Operation(
        summary = "Complete 3D Secure Charge",
        description = "Callback endpoint หลังจาก Customer ผ่าน 3D Secure แล้ว"
    )
    public ResponseEntity<OmiseChargeResponse> completeCharge(
            @PathVariable String chargeId) {
        
        logger.info("Completing 3D Secure charge: {}", chargeId);
        
        // ดึงข้อมูล Charge ล่าสุดจาก Omise
        OmiseChargeResponse response = omiseService.getCharge(chargeId);
        
        // TODO: อัพเดทสถานะใน Database ถ้าจำเป็น
        
        return ResponseEntity.ok(response);
    }
}

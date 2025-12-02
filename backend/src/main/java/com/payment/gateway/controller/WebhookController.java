package com.payment.gateway.controller;

import com.payment.gateway.dto.WebhookPayload;
import com.payment.gateway.security.HmacSignatureService;
import com.payment.gateway.service.PaymentService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * WebhookController - REST Controller สำหรับรับ Webhook จาก Payment Gateway
 * 
 * Endpoints:
 * - POST /api/v1/webhooks/payment - รับ Webhook จาก Payment Gateway
 * 
 * Security:
 * - ตรวจสอบ HMAC-SHA256 Signature ใน Header
 */
@RestController
@RequestMapping("/api/v1/webhooks")
public class WebhookController {

    private static final Logger logger = LoggerFactory.getLogger(WebhookController.class);
    
    private final PaymentService paymentService;
    private final HmacSignatureService hmacSignatureService;

    public WebhookController(PaymentService paymentService, HmacSignatureService hmacSignatureService) {
        this.paymentService = paymentService;
        this.hmacSignatureService = hmacSignatureService;
    }

    /**
     * รับ Webhook จาก Payment Gateway
     * 
     * Header ที่ต้องมี:
     * - X-Webhook-Signature: sha256=<signature>
     * 
     * @param payload WebhookPayload
     * @param signature Signature จาก Header
     * @param rawBody Raw Request Body สำหรับตรวจสอบ Signature
     * @return Response
     */
    @PostMapping("/payment")
    public ResponseEntity<Map<String, Object>> handlePaymentWebhook(
            @Valid @RequestBody WebhookPayload payload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            @RequestBody String rawBody) {
        
        logger.info("Received webhook: eventType={}, referenceId={}", 
            payload.eventType(), payload.referenceId());
        
        // ตรวจสอบ Signature (ถ้ามี)
        // ในระบบจริงควรบังคับให้มี Signature เสมอ
        if (signature != null && !signature.isEmpty()) {
            String signatureValue = hmacSignatureService.parseSignatureFromHeader(signature);
            hmacSignatureService.validateSignature(rawBody, signatureValue);
            logger.debug("Webhook signature verified");
        } else {
            logger.warn("Webhook received without signature - this should be enforced in production");
        }
        
        // ประมวลผล Webhook
        paymentService.processWebhook(payload);
        
        // ส่ง Response กลับ
        Map<String, Object> response = Map.of(
            "status", "received",
            "message", "Webhook processed successfully",
            "referenceId", payload.referenceId()
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint สำหรับทดสอบ Webhook Signature
     * 
     * @param body Request Body
     * @return Signature
     */
    @PostMapping("/test-signature")
    public ResponseEntity<Map<String, String>> testSignature(@RequestBody String body) {
        String signature = hmacSignatureService.generateSignature(body);
        String header = hmacSignatureService.createSignatureHeader(body);
        
        return ResponseEntity.ok(Map.of(
            "signature", signature,
            "header", header,
            "body", body
        ));
    }
}

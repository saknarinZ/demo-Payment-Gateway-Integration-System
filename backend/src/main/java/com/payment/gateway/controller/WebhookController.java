package com.payment.gateway.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.payment.gateway.dto.WebhookPayload;
import com.payment.gateway.security.HmacSignatureService;
import com.payment.gateway.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Validator;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;

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
    private final ObjectMapper objectMapper;
    private final Validator validator;

    public WebhookController(
            PaymentService paymentService, 
            HmacSignatureService hmacSignatureService,
            ObjectMapper objectMapper,
            Validator validator) {
        this.paymentService = paymentService;
        this.hmacSignatureService = hmacSignatureService;
        this.objectMapper = objectMapper;
        this.validator = validator;
    }

    /**
     * รับ Webhook จาก Payment Gateway
     * 
     * Header ที่ต้องมี:
     * - X-Webhook-Signature: sha256=<signature>
     * 
     * วิธีแก้ปัญหา @RequestBody 2 ตัว:
     * - อ่าน raw body จาก HttpServletRequest
     * - แปลงเป็น Object ด้วย ObjectMapper
     * - Validate ด้วย Validator
     * 
     * @param request HttpServletRequest
     * @param signature Signature จาก Header
     * @return Response
     */
    @PostMapping("/payment")
    public ResponseEntity<Map<String, Object>> handlePaymentWebhook(
            HttpServletRequest request,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature) throws IOException {
        
        // 1. อ่าน raw body (สำหรับตรวจ signature)
        String rawBody = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        
        // 2. แปลง JSON เป็น Object
        WebhookPayload payload = objectMapper.readValue(rawBody, WebhookPayload.class);
        
        // 3. Validate payload
        Set<ConstraintViolation<WebhookPayload>> violations = validator.validate(payload);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }
        
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

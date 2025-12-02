package com.payment.gateway.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * WebhookPayload - DTO สำหรับรับ Webhook จาก Payment Gateway
 * 
 * ใช้ Java Record สำหรับ Immutable DTO
 */
public record WebhookPayload(
    
    /**
     * Event Type (payment.completed, payment.failed, etc.)
     */
    @NotBlank(message = "Event type is required")
    String eventType,
    
    /**
     * Payment Reference ID
     */
    @NotBlank(message = "Reference ID is required")
    String referenceId,
    
    /**
     * สถานะใหม่
     */
    String status,
    
    /**
     * รหัสอ้างอิงจาก Gateway
     */
    String gatewayReference,
    
    /**
     * Response Code
     */
    String responseCode,
    
    /**
     * Response Message
     */
    String responseMessage,
    
    /**
     * เหตุผลกรณีล้มเหลว
     */
    String failureReason,
    
    /**
     * Timestamp ของ Event
     */
    String timestamp,
    
    /**
     * ข้อมูลเพิ่มเติม
     */
    String additionalData
) {}

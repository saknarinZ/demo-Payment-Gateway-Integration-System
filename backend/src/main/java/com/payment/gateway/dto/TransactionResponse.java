package com.payment.gateway.dto;

import com.payment.gateway.entity.TransactionStatus;
import com.payment.gateway.entity.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * TransactionResponse - DTO สำหรับส่งข้อมูล Transaction กลับ
 * 
 * ใช้ Java Record สำหรับ Immutable DTO
 */
public record TransactionResponse(
    
    /**
     * Transaction ID
     */
    Long id,
    
    /**
     * Transaction Reference ID
     */
    String transactionId,
    
    /**
     * Payment Reference ID
     */
    String paymentReferenceId,
    
    /**
     * ประเภทธุรกรรม
     */
    TransactionType transactionType,
    
    /**
     * จำนวนเงิน
     */
    BigDecimal amount,
    
    /**
     * สกุลเงิน
     */
    String currency,
    
    /**
     * สถานะธุรกรรม
     */
    TransactionStatus status,
    
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
     * วันที่สร้าง
     */
    LocalDateTime createdAt
) {}

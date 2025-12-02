package com.payment.gateway.dto;

import com.payment.gateway.entity.PaymentMethod;
import com.payment.gateway.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * PaymentSummary - DTO สำหรับแสดงข้อมูลสรุป Payment (ใช้ในรายการ)
 * 
 * ใช้ Java Record สำหรับ Immutable DTO
 * แสดงข้อมูลน้อยกว่า PaymentResponse
 */
public record PaymentSummary(
    
    /**
     * Payment ID
     */
    Long id,
    
    /**
     * Reference ID
     */
    String referenceId,
    
    /**
     * Order ID
     */
    String orderId,
    
    /**
     * จำนวนเงิน
     */
    BigDecimal amount,
    
    /**
     * สกุลเงิน
     */
    String currency,
    
    /**
     * สถานะ
     */
    PaymentStatus status,
    
    /**
     * วิธีการชำระเงิน
     */
    PaymentMethod paymentMethod,
    
    /**
     * ชื่อลูกค้า
     */
    String customerName,
    
    /**
     * วันที่สร้าง
     */
    LocalDateTime createdAt
) {}

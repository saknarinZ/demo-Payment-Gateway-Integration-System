package com.payment.gateway.dto;

import com.payment.gateway.entity.PaymentMethod;
import com.payment.gateway.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * PaymentResponse - DTO สำหรับส่งข้อมูล Payment กลับ
 * 
 * ใช้ Java Record สำหรับ Immutable DTO
 */
public record PaymentResponse(
    
    /**
     * Payment ID
     */
    Long id,
    
    /**
     * Reference ID สำหรับติดตามสถานะ
     */
    String referenceId,
    
    /**
     * Order ID จากร้านค้า
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
     * สถานะการชำระเงิน
     */
    PaymentStatus status,
    
    /**
     * วิธีการชำระเงิน
     */
    PaymentMethod paymentMethod,
    
    /**
     * รายละเอียด
     */
    String description,
    
    /**
     * ข้อมูลลูกค้า
     */
    CustomerInfo customer,
    
    /**
     * ข้อความแจ้งเหตุผล (กรณี Failed)
     */
    String failureReason,
    
    /**
     * วันที่ชำระเงินสำเร็จ
     */
    LocalDateTime paidAt,
    
    /**
     * วันที่หมดอายุ
     */
    LocalDateTime expiresAt,
    
    /**
     * วันที่สร้าง
     */
    LocalDateTime createdAt,
    
    /**
     * วันที่อัพเดทล่าสุด
     */
    LocalDateTime updatedAt,
    
    /**
     * URL สำหรับชำระเงิน
     */
    String paymentUrl
) {
    /**
     * Customer Info - ข้อมูลลูกค้า
     */
    public record CustomerInfo(
        String name,
        String email,
        String phone
    ) {}
}

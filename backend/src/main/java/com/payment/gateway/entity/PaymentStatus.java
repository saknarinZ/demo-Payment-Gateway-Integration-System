package com.payment.gateway.entity;

/**
 * Payment Status Enum - สถานะการชำระเงิน
 * 
 * กำหนดสถานะต่างๆ ของการชำระเงิน
 */
public enum PaymentStatus {
    
    /**
     * รอการชำระเงิน
     */
    PENDING,
    
    /**
     * กำลังดำเนินการ
     */
    PROCESSING,
    
    /**
     * ชำระเงินสำเร็จ
     */
    COMPLETED,
    
    /**
     * ชำระเงินไม่สำเร็จ
     */
    FAILED,
    
    /**
     * ยกเลิกการชำระเงิน
     */
    CANCELLED,
    
    /**
     * คืนเงินแล้ว
     */
    REFUNDED,
    
    /**
     * คืนเงินบางส่วน
     */
    PARTIALLY_REFUNDED,
    
    /**
     * หมดอายุ
     */
    EXPIRED
}

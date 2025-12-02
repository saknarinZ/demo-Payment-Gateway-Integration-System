package com.payment.gateway.entity;

/**
 * Transaction Status Enum - สถานะธุรกรรม
 * 
 * กำหนดสถานะของธุรกรรมแต่ละรายการ
 */
public enum TransactionStatus {
    
    /**
     * รอดำเนินการ
     */
    PENDING,
    
    /**
     * สำเร็จ
     */
    SUCCESS,
    
    /**
     * ไม่สำเร็จ
     */
    FAILED,
    
    /**
     * ยกเลิก
     */
    CANCELLED
}

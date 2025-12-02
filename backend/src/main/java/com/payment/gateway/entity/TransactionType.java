package com.payment.gateway.entity;

/**
 * Transaction Type Enum - ประเภทธุรกรรม
 * 
 * กำหนดประเภทของธุรกรรมที่เกิดขึ้น
 */
public enum TransactionType {
    
    /**
     * สร้างรายการชำระเงิน
     */
    AUTHORIZE,
    
    /**
     * ยืนยันการหักเงิน
     */
    CAPTURE,
    
    /**
     * ชำระเงินทันที (Authorize + Capture)
     */
    CHARGE,
    
    /**
     * คืนเงิน
     */
    REFUND,
    
    /**
     * ยกเลิกรายการ (ก่อน Capture)
     */
    VOID,
    
    /**
     * รับแจ้งจาก Webhook
     */
    WEBHOOK
}

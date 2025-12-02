package com.payment.gateway.exception;

/**
 * InvalidRequestException - Exception สำหรับ Request ที่ไม่ถูกต้อง
 * 
 * ใช้เมื่อข้อมูลที่ส่งมาไม่ถูกต้องตาม Business Logic
 */
public class InvalidRequestException extends PaymentException {
    
    public InvalidRequestException(String message) {
        super("INVALID_REQUEST", message);
    }
    
    public InvalidRequestException(String errorCode, String message) {
        super(errorCode, message);
    }
}

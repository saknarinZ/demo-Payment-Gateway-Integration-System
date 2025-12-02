package com.payment.gateway.exception;

/**
 * DuplicateResourceException - Exception สำหรับข้อมูลซ้ำ
 * 
 * ใช้เมื่อพยายามสร้างข้อมูลที่มีอยู่แล้ว
 */
public class DuplicateResourceException extends PaymentException {
    
    public DuplicateResourceException(String resourceName, String fieldName, Object fieldValue) {
        super("DUPLICATE", String.format("%s already exists with %s: '%s'", resourceName, fieldName, fieldValue));
    }
    
    public DuplicateResourceException(String message) {
        super("DUPLICATE", message);
    }
}

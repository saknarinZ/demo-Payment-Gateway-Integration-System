package com.payment.gateway.exception;

/**
 * ResourceNotFoundException - Exception สำหรับกรณีไม่พบข้อมูล
 * 
 * ใช้เมื่อค้นหาข้อมูลไม่พบ
 */
public class ResourceNotFoundException extends PaymentException {
    
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super("NOT_FOUND", String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }
    
    public ResourceNotFoundException(String message) {
        super("NOT_FOUND", message);
    }
}

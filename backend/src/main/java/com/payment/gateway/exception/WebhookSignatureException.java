package com.payment.gateway.exception;

/**
 * WebhookSignatureException - Exception สำหรับ Webhook Signature ไม่ถูกต้อง
 * 
 * ใช้เมื่อ HMAC-SHA256 Signature ไม่ตรงกัน
 */
public class WebhookSignatureException extends PaymentException {
    
    public WebhookSignatureException(String message) {
        super("INVALID_SIGNATURE", message);
    }
}

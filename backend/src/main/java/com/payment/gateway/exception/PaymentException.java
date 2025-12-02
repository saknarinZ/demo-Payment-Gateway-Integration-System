package com.payment.gateway.exception;

/**
 * PaymentException - Exception สำหรับข้อผิดพลาดเกี่ยวกับ Payment
 * 
 * Base Exception Class สำหรับ Payment Gateway
 */
public class PaymentException extends RuntimeException {
    
    private final String errorCode;
    
    public PaymentException(String message) {
        super(message);
        this.errorCode = "PAYMENT_ERROR";
    }
    
    public PaymentException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public PaymentException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "PAYMENT_ERROR";
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}

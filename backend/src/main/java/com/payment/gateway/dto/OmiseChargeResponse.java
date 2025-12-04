package com.payment.gateway.dto;

import java.time.LocalDateTime;

/**
 * OmiseChargeResponse - DTO สำหรับ Response หลังสร้าง Charge
 * 
 * ใช้ Java Record สำหรับ Immutable DTO
 * 
 * @param id Charge ID (chr_xxx)
 * @param status สถานะ (successful, pending, failed)
 * @param amount จำนวนเงิน (สตางค์)
 * @param currency สกุลเงิน
 * @param paid สถานะการชำระเงิน
 * @param authorizeUri URL สำหรับ 3D Secure (ถ้าต้องการ)
 * @param returnUri URL สำหรับ Redirect กลับ
 * @param failureCode Error Code (ถ้า Failed)
 * @param failureMessage Error Message (ถ้า Failed)
 * @param createdAt วันที่สร้าง
 */
public record OmiseChargeResponse(
    String id,
    String status,
    Long amount,
    String currency,
    Boolean paid,
    String authorizeUri,
    String returnUri,
    String failureCode,
    String failureMessage,
    String transactionId,
    String cardLastDigits,
    String cardBrand,
    LocalDateTime createdAt
) {
    /**
     * ตรวจสอบว่า Charge สำเร็จหรือไม่
     */
    public boolean isSuccessful() {
        return "successful".equalsIgnoreCase(status) && Boolean.TRUE.equals(paid);
    }
    
    /**
     * ตรวจสอบว่าต้อง Redirect ไป 3D Secure หรือไม่
     */
    public boolean requiresAuthorization() {
        return "pending".equalsIgnoreCase(status) && authorizeUri != null && !authorizeUri.isBlank();
    }
    
    /**
     * ตรวจสอบว่า Charge ล้มเหลวหรือไม่
     */
    public boolean isFailed() {
        return "failed".equalsIgnoreCase(status);
    }
    
    /**
     * แปลงจำนวนเงินเป็นบาท
     */
    public double amountInBaht() {
        return amount != null ? amount / 100.0 : 0;
    }
    
    /**
     * Builder สำหรับสร้าง Response
     */
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String id;
        private String status;
        private Long amount;
        private String currency;
        private Boolean paid;
        private String authorizeUri;
        private String returnUri;
        private String failureCode;
        private String failureMessage;
        private String transactionId;
        private String cardLastDigits;
        private String cardBrand;
        private LocalDateTime createdAt;
        
        public Builder id(String id) { this.id = id; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder amount(Long amount) { this.amount = amount; return this; }
        public Builder currency(String currency) { this.currency = currency; return this; }
        public Builder paid(Boolean paid) { this.paid = paid; return this; }
        public Builder authorizeUri(String authorizeUri) { this.authorizeUri = authorizeUri; return this; }
        public Builder returnUri(String returnUri) { this.returnUri = returnUri; return this; }
        public Builder failureCode(String failureCode) { this.failureCode = failureCode; return this; }
        public Builder failureMessage(String failureMessage) { this.failureMessage = failureMessage; return this; }
        public Builder transactionId(String transactionId) { this.transactionId = transactionId; return this; }
        public Builder cardLastDigits(String cardLastDigits) { this.cardLastDigits = cardLastDigits; return this; }
        public Builder cardBrand(String cardBrand) { this.cardBrand = cardBrand; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        
        public OmiseChargeResponse build() {
            return new OmiseChargeResponse(
                id, status, amount, currency, paid, authorizeUri, returnUri,
                failureCode, failureMessage, transactionId, cardLastDigits, cardBrand, createdAt
            );
        }
    }
}

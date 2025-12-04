package com.payment.gateway.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * OmiseChargeRequest - DTO สำหรับสร้าง Charge ผ่าน Omise
 * 
 * ใช้ Java Record สำหรับ Immutable DTO
 * 
 * @param token Token ที่ได้จาก Omise.js (Frontend Tokenization)
 * @param amount จำนวนเงิน (หน่วย: สตางค์ สำหรับ THB)
 * @param currency สกุลเงิน (THB, USD, etc.)
 * @param description คำอธิบาย Transaction
 * @param returnUri URL สำหรับ Redirect หลังจาก 3D Secure (Optional)
 */
public record OmiseChargeRequest(
    
    @NotBlank(message = "Token is required")
    String token,
    
    @NotNull(message = "Amount is required")
    @Min(value = 2000, message = "Minimum amount is 20 THB (2000 satang)")
    Long amount,  // หน่วย: สตางค์ (1 บาท = 100 สตางค์)
    
    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be 3 characters (e.g., THB)")
    String currency,
    
    String description,
    
    String returnUri,  // สำหรับ 3D Secure redirect
    
    // Optional: ข้อมูลเพิ่มเติม
    String orderId,
    String customerEmail,
    String customerName
    
) {
    /**
     * Constructor พร้อม Default Values
     */
    public OmiseChargeRequest {
        // Default currency เป็น THB ถ้าไม่ระบุ
        if (currency == null || currency.isBlank()) {
            currency = "THB";
        }
        currency = currency.toUpperCase();
    }
    
    /**
     * Compact Constructor สำหรับ Basic Charge
     */
    public static OmiseChargeRequest basic(String token, Long amount, String description) {
        return new OmiseChargeRequest(
            token, 
            amount, 
            "THB", 
            description, 
            null, 
            null, 
            null, 
            null
        );
    }
    
    /**
     * แปลงจำนวนเงินเป็นบาท (สำหรับแสดงผล)
     */
    public double amountInBaht() {
        return amount / 100.0;
    }
}

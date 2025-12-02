package com.payment.gateway.dto;

import jakarta.validation.constraints.*;

/**
 * CreateMerchantRequest - DTO สำหรับสร้าง Merchant ใหม่
 * 
 * ใช้ Java Record สำหรับ Immutable DTO
 */
public record CreateMerchantRequest(
    
    /**
     * ชื่อร้านค้า
     */
    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    String name,
    
    /**
     * อีเมลสำหรับติดต่อ
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Email format is invalid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    String email,
    
    /**
     * เบอร์โทรศัพท์
     */
    @Size(max = 20, message = "Phone must not exceed 20 characters")
    String phone,
    
    /**
     * Webhook URL สำหรับส่งแจ้งเตือน
     */
    @Size(max = 500, message = "Webhook URL must not exceed 500 characters")
    String webhookUrl
) {}

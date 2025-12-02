package com.payment.gateway.dto;

import java.time.LocalDateTime;

/**
 * MerchantResponse - DTO สำหรับส่งข้อมูล Merchant กลับ
 * 
 * ใช้ Java Record สำหรับ Immutable DTO
 */
public record MerchantResponse(
    
    /**
     * Merchant ID
     */
    Long id,
    
    /**
     * ชื่อร้านค้า
     */
    String name,
    
    /**
     * อีเมล
     */
    String email,
    
    /**
     * เบอร์โทร
     */
    String phone,
    
    /**
     * API Key
     */
    String apiKey,
    
    /**
     * API Secret (แสดงเฉพาะตอนสร้างใหม่)
     */
    String apiSecret,
    
    /**
     * Webhook URL
     */
    String webhookUrl,
    
    /**
     * สถานะการใช้งาน
     */
    Boolean isActive,
    
    /**
     * วันที่สร้าง
     */
    LocalDateTime createdAt,
    
    /**
     * วันที่อัพเดทล่าสุด
     */
    LocalDateTime updatedAt
) {}

package com.payment.gateway.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Merchant Entity - ร้านค้า/ผู้ขาย
 * 
 * เก็บข้อมูลร้านค้าที่ใช้ระบบ Payment Gateway
 * รวมถึง API Key และ Secret สำหรับการยืนยันตัวตน
 */
@Entity
@Table(name = "merchants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Merchant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ชื่อร้านค้า
     */
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    /**
     * อีเมลสำหรับติดต่อ
     */
    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    /**
     * เบอร์โทรศัพท์
     */
    @Column(name = "phone", length = 20)
    private String phone;

    /**
     * API Key สำหรับการเรียกใช้ API
     * ใช้ระบุตัวตนของร้านค้า
     */
    @Column(name = "api_key", nullable = false, unique = true, length = 64)
    private String apiKey;

    /**
     * API Secret สำหรับการสร้าง Signature
     * ใช้ร่วมกับ HMAC-SHA256
     */
    @Column(name = "api_secret", nullable = false, length = 128)
    private String apiSecret;

    /**
     * Webhook URL สำหรับส่งแจ้งเตือนสถานะ
     */
    @Column(name = "webhook_url", length = 500)
    private String webhookUrl;

    /**
     * Webhook Secret สำหรับ HMAC Signature
     */
    @Column(name = "webhook_secret", nullable = false, length = 64)
    private String webhookSecret;

    /**
     * สถานะการใช้งาน
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * วันที่สร้าง
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * วันที่อัพเดทล่าสุด
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * รายการ Payment ของร้านค้านี้
     * Relationship: One-to-Many
     */
    @OneToMany(mappedBy = "merchant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();
}

package com.payment.gateway.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Payment Entity - รายการชำระเงิน
 * 
 * เก็บข้อมูลการชำระเงินแต่ละรายการ
 * รวมถึงสถานะและข้อมูลการอ้างอิง
 */
@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payment_reference", columnList = "reference_id"),
    @Index(name = "idx_payment_status", columnList = "status"),
    @Index(name = "idx_payment_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Reference ID - รหัสอ้างอิงภายในระบบ
     * ใช้สำหรับติดตามสถานะ
     */
    @Column(name = "reference_id", nullable = false, unique = true, length = 36)
    private String referenceId;

    /**
     * Order ID จากร้านค้า
     */
    @Column(name = "order_id", nullable = false, length = 100)
    private String orderId;

    /**
     * จำนวนเงินที่ชำระ
     */
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /**
     * สกุลเงิน (THB, USD, etc.)
     */
    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "THB";

    /**
     * สถานะการชำระเงิน
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    /**
     * วิธีการชำระเงิน
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 30)
    private PaymentMethod paymentMethod;

    /**
     * รายละเอียดสินค้า/บริการ
     */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * ชื่อลูกค้า
     */
    @Column(name = "customer_name", length = 255)
    private String customerName;

    /**
     * อีเมลลูกค้า
     */
    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    /**
     * เบอร์โทรลูกค้า
     */
    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    /**
     * ข้อความแจ้งเหตุผล (กรณี Failed/Cancelled)
     */
    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    /**
     * Metadata เพิ่มเติม (JSON)
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    /**
     * วันที่ชำระเงินสำเร็จ
     */
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    /**
     * วันหมดอายุของ Payment
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

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
     * ร้านค้าเจ้าของ Payment
     * Relationship: Many-to-One
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchant_id", nullable = false)
    private Merchant merchant;

    /**
     * รายการ Transaction ของ Payment นี้
     * Relationship: One-to-Many
     */
    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Transaction> transactions = new ArrayList<>();
}

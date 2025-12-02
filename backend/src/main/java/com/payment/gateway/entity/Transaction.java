package com.payment.gateway.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Transaction Entity - รายการธุรกรรม
 * 
 * เก็บประวัติการทำธุรกรรมทั้งหมดของ Payment
 * เช่น authorize, capture, refund, void
 */
@Entity
@Table(name = "transactions", indexes = {
    @Index(name = "idx_transaction_type", columnList = "transaction_type"),
    @Index(name = "idx_transaction_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Transaction ID - รหัสธุรกรรมภายในระบบ
     */
    @Column(name = "transaction_id", nullable = false, unique = true, length = 36)
    private String transactionId;

    /**
     * ประเภทธุรกรรม
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private TransactionType transactionType;

    /**
     * จำนวนเงินของธุรกรรม
     */
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /**
     * สกุลเงิน
     */
    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "THB";

    /**
     * สถานะธุรกรรม
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.PENDING;

    /**
     * รหัสอ้างอิงจาก Payment Gateway ภายนอก
     */
    @Column(name = "gateway_reference", length = 100)
    private String gatewayReference;

    /**
     * Response Code จาก Gateway
     */
    @Column(name = "response_code", length = 10)
    private String responseCode;

    /**
     * Response Message จาก Gateway
     */
    @Column(name = "response_message", length = 500)
    private String responseMessage;

    /**
     * IP Address ของผู้ทำรายการ
     */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /**
     * User Agent ของ Browser
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * Raw Request (JSON)
     */
    @Column(name = "raw_request", columnDefinition = "TEXT")
    private String rawRequest;

    /**
     * Raw Response (JSON)
     */
    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse;

    /**
     * วันที่สร้าง
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Payment ที่เกี่ยวข้อง
     * Relationship: Many-to-One
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;
}

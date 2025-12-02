package com.payment.gateway.repository;

import com.payment.gateway.entity.Payment;
import com.payment.gateway.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * PaymentRepository - Repository สำหรับจัดการข้อมูล Payment
 * 
 * ใช้ Spring Data JPA พร้อม Custom Queries
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /**
     * ค้นหา Payment จาก Reference ID
     * 
     * @param referenceId Reference ID
     * @return Payment ที่พบ
     */
    Optional<Payment> findByReferenceId(String referenceId);
    
    /**
     * ค้นหา Payment จาก Order ID และ Merchant
     * 
     * @param orderId Order ID
     * @param merchantId Merchant ID
     * @return Payment ที่พบ
     */
    Optional<Payment> findByOrderIdAndMerchantId(String orderId, Long merchantId);
    
    /**
     * ค้นหา Payment ทั้งหมดของ Merchant (พร้อม Pagination)
     * 
     * @param merchantId Merchant ID
     * @param pageable Pagination
     * @return Page ของ Payment
     */
    Page<Payment> findByMerchantIdOrderByCreatedAtDesc(Long merchantId, Pageable pageable);
    
    /**
     * ค้นหา Payment ตามสถานะ
     * 
     * @param status สถานะ
     * @param pageable Pagination
     * @return Page ของ Payment
     */
    Page<Payment> findByStatusOrderByCreatedAtDesc(PaymentStatus status, Pageable pageable);
    
    /**
     * ค้นหา Payment ที่หมดอายุแล้วแต่ยังเป็น PENDING
     * 
     * @param status สถานะ
     * @param expiresAt เวลาที่หมดอายุ
     * @return รายการ Payment
     */
    List<Payment> findByStatusAndExpiresAtBefore(PaymentStatus status, LocalDateTime expiresAt);
    
    /**
     * นับจำนวน Payment ตามสถานะ
     * 
     * @param status สถานะ
     * @return จำนวน
     */
    long countByStatus(PaymentStatus status);
    
    /**
     * นับจำนวน Payment ที่สร้างวันนี้
     * 
     * @param startOfDay เวลาเริ่มต้นของวัน
     * @return จำนวน
     */
    @Query("SELECT COUNT(p) FROM Payment p WHERE p.createdAt >= :startOfDay")
    long countTodayPayments(@Param("startOfDay") LocalDateTime startOfDay);
    
    /**
     * รวมยอดเงินที่ชำระสำเร็จ
     * 
     * @return ยอดรวม
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'COMPLETED'")
    BigDecimal sumCompletedAmount();
    
    /**
     * รวมยอดเงินที่ชำระสำเร็จวันนี้
     * 
     * @param startOfDay เวลาเริ่มต้นของวัน
     * @return ยอดรวม
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'COMPLETED' AND p.paidAt >= :startOfDay")
    BigDecimal sumTodayCompletedAmount(@Param("startOfDay") LocalDateTime startOfDay);
    
    /**
     * ค้นหา Payment ด้วยหลายเงื่อนไข
     * 
     * @param merchantId Merchant ID (optional)
     * @param status สถานะ (optional)
     * @param startDate วันที่เริ่มต้น (optional)
     * @param endDate วันที่สิ้นสุด (optional)
     * @param pageable Pagination
     * @return Page ของ Payment
     */
    @Query("SELECT p FROM Payment p WHERE " +
           "(:merchantId IS NULL OR p.merchant.id = :merchantId) AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:startDate IS NULL OR p.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR p.createdAt <= :endDate) " +
           "ORDER BY p.createdAt DESC")
    Page<Payment> findByFilters(
        @Param("merchantId") Long merchantId,
        @Param("status") PaymentStatus status,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );
}

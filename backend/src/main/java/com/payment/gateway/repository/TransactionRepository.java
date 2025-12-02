package com.payment.gateway.repository;

import com.payment.gateway.entity.Transaction;
import com.payment.gateway.entity.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * TransactionRepository - Repository สำหรับจัดการข้อมูล Transaction
 * 
 * ใช้ Spring Data JPA
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * ค้นหา Transaction จาก Transaction ID
     * 
     * @param transactionId Transaction ID
     * @return Transaction ที่พบ
     */
    Optional<Transaction> findByTransactionId(String transactionId);
    
    /**
     * ค้นหา Transaction ทั้งหมดของ Payment
     * 
     * @param paymentId Payment ID
     * @return รายการ Transaction
     */
    List<Transaction> findByPaymentIdOrderByCreatedAtDesc(Long paymentId);
    
    /**
     * ค้นหา Transaction ตามประเภท
     * 
     * @param transactionType ประเภท
     * @param pageable Pagination
     * @return Page ของ Transaction
     */
    Page<Transaction> findByTransactionTypeOrderByCreatedAtDesc(TransactionType transactionType, Pageable pageable);
    
    /**
     * ค้นหา Transaction ของ Payment ตามประเภท
     * 
     * @param paymentId Payment ID
     * @param transactionType ประเภท
     * @return รายการ Transaction
     */
    List<Transaction> findByPaymentIdAndTransactionType(Long paymentId, TransactionType transactionType);
}

package com.payment.gateway.service;

import com.payment.gateway.dto.TransactionResponse;
import com.payment.gateway.entity.Transaction;
import com.payment.gateway.exception.ResourceNotFoundException;
import com.payment.gateway.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * TransactionService - บริการจัดการ Transaction
 * 
 * รับผิดชอบ:
 * - ค้นหา Transaction
 * - ดึงประวัติ Transaction ของ Payment
 */
@Service
@Transactional(readOnly = true)
public class TransactionService {

    private static final Logger logger = LoggerFactory.getLogger(TransactionService.class);
    
    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    /**
     * ค้นหา Transaction จาก Transaction ID
     * 
     * @param transactionId Transaction ID
     * @return TransactionResponse
     */
    public TransactionResponse getTransactionById(String transactionId) {
        Transaction transaction = transactionRepository.findByTransactionId(transactionId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", "transactionId", transactionId));
        return toResponse(transaction);
    }

    /**
     * ดึงรายการ Transaction ทั้งหมดของ Payment
     * 
     * @param paymentId Payment ID
     * @return รายการ TransactionResponse
     */
    public List<TransactionResponse> getTransactionsByPaymentId(Long paymentId) {
        logger.debug("Fetching transactions for payment: {}", paymentId);
        
        List<Transaction> transactions = transactionRepository.findByPaymentIdOrderByCreatedAtDesc(paymentId);
        
        return transactions.stream()
            .map(this::toResponse)
            .toList();
    }

    /**
     * แปลง Entity เป็น Response DTO
     */
    private TransactionResponse toResponse(Transaction transaction) {
        return new TransactionResponse(
            transaction.getId(),
            transaction.getTransactionId(),
            transaction.getPayment().getReferenceId(),
            transaction.getTransactionType(),
            transaction.getAmount(),
            transaction.getCurrency(),
            transaction.getStatus(),
            transaction.getGatewayReference(),
            transaction.getResponseCode(),
            transaction.getResponseMessage(),
            transaction.getCreatedAt()
        );
    }
}

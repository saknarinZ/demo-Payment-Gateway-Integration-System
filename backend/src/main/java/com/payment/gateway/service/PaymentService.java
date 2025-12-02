package com.payment.gateway.service;

import com.payment.gateway.dto.*;
import com.payment.gateway.entity.*;
import com.payment.gateway.exception.InvalidRequestException;
import com.payment.gateway.exception.ResourceNotFoundException;
import com.payment.gateway.repository.PaymentRepository;
import com.payment.gateway.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * PaymentService - บริการจัดการ Payment
 * 
 * รับผิดชอบ:
 * - สร้าง Payment ใหม่
 * - อัพเดทสถานะ Payment
 * - ค้นหา Payment
 * - ดำเนินการ Refund
 * 
 * พร้อม Redis Caching สำหรับ:
 * - Payment by Reference ID
 * - Payment List
 * - Dashboard Statistics
 */
@Service
@Transactional
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);
    private static final int PAYMENT_EXPIRY_MINUTES = 30;
    
    private final PaymentRepository paymentRepository;
    private final TransactionRepository transactionRepository;
    private final MerchantService merchantService;

    public PaymentService(
            PaymentRepository paymentRepository,
            TransactionRepository transactionRepository,
            MerchantService merchantService) {
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.merchantService = merchantService;
    }

    /**
     * สร้าง Payment ใหม่
     * 
     * @param request ข้อมูล Payment
     * @param apiKey API Key ของ Merchant
     * @return PaymentResponse
     */
    @Caching(evict = {
        @CacheEvict(value = "payment-list", allEntries = true),
        @CacheEvict(value = "dashboard-stats", allEntries = true)
    })
    public PaymentResponse createPayment(CreatePaymentRequest request, String apiKey) {
        logger.info("Creating payment for order: {}", request.orderId());
        
        // ค้นหา Merchant จาก API Key
        Merchant merchant = merchantService.getMerchantByApiKey(apiKey);
        
        // ตรวจสอบว่า Merchant Active หรือไม่
        if (!merchant.getIsActive()) {
            throw new InvalidRequestException("Merchant is not active");
        }
        
        // ตรวจสอบว่า Order ID ซ้ำหรือไม่
        if (paymentRepository.findByOrderIdAndMerchantId(request.orderId(), merchant.getId()).isPresent()) {
            throw new InvalidRequestException("DUPLICATE_ORDER", "Order ID already exists: " + request.orderId());
        }
        
        // สร้าง Reference ID
        String referenceId = generateReferenceId();
        
        // สร้าง Payment Entity
        Payment payment = Payment.builder()
            .referenceId(referenceId)
            .orderId(request.orderId())
            .amount(request.amount())
            .currency(request.currency())
            .status(PaymentStatus.PENDING)
            .paymentMethod(request.paymentMethod())
            .description(request.description())
            .customerName(request.customerName())
            .customerEmail(request.customerEmail())
            .customerPhone(request.customerPhone())
            .metadata(request.metadata())
            .expiresAt(LocalDateTime.now().plusMinutes(PAYMENT_EXPIRY_MINUTES))
            .merchant(merchant)
            .build();
        
        // บันทึก Payment
        payment = paymentRepository.save(payment);
        
        // สร้าง Transaction สำหรับการสร้าง Payment
        createTransaction(payment, TransactionType.AUTHORIZE, request.amount(), TransactionStatus.SUCCESS);
        
        logger.info("Payment created successfully: {}", referenceId);
        return toResponse(payment);
    }

    /**
     * ค้นหา Payment จาก Reference ID
     * 
     * @param referenceId Reference ID
     * @return PaymentResponse
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "payment-by-ref", key = "#referenceId")
    public PaymentResponse getPaymentByReferenceId(String referenceId) {
        logger.debug("Cache MISS - Fetching payment from database: {}", referenceId);
        Payment payment = findPaymentByReferenceId(referenceId);
        return toResponse(payment);
    }

    /**
     * ค้นหา Payment จาก ID
     * 
     * @param id Payment ID
     * @return PaymentResponse
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "payments", key = "#id")
    public PaymentResponse getPaymentById(Long id) {
        logger.debug("Cache MISS - Fetching payment by ID from database: {}", id);
        Payment payment = paymentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", id));
        return toResponse(payment);
    }

    /**
     * ดึงรายการ Payment ทั้งหมด (พร้อม Pagination)
     * 
     * @param pageable Pagination
     * @return Page ของ PaymentSummary
     */
    @Transactional(readOnly = true)
    public PageResponse<PaymentSummary> getAllPayments(Pageable pageable) {
        Page<Payment> page = paymentRepository.findAll(pageable);
        return toPageResponse(page);
    }

    /**
     * ดึงรายการ Payment ตามสถานะ
     * 
     * @param status สถานะ
     * @param pageable Pagination
     * @return Page ของ PaymentSummary
     */
    @Transactional(readOnly = true)
    public PageResponse<PaymentSummary> getPaymentsByStatus(PaymentStatus status, Pageable pageable) {
        Page<Payment> page = paymentRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        return toPageResponse(page);
    }

    /**
     * อัพเดทสถานะ Payment เป็น COMPLETED
     * (จำลองการชำระเงินสำเร็จ)
     * 
     * @param referenceId Reference ID
     * @return PaymentResponse
     */
    @Caching(evict = {
        @CacheEvict(value = "payment-by-ref", key = "#referenceId"),
        @CacheEvict(value = "payment-list", allEntries = true),
        @CacheEvict(value = "dashboard-stats", allEntries = true)
    })
    public PaymentResponse completePayment(String referenceId) {
        logger.info("Completing payment: {}", referenceId);
        
        Payment payment = findPaymentByReferenceId(referenceId);
        
        // ตรวจสอบสถานะปัจจุบัน
        if (payment.getStatus() != PaymentStatus.PENDING && payment.getStatus() != PaymentStatus.PROCESSING) {
            throw new InvalidRequestException("Payment cannot be completed. Current status: " + payment.getStatus());
        }
        
        // ตรวจสอบว่าหมดอายุหรือยัง
        if (payment.getExpiresAt() != null && payment.getExpiresAt().isBefore(LocalDateTime.now())) {
            payment.setStatus(PaymentStatus.EXPIRED);
            paymentRepository.save(payment);
            throw new InvalidRequestException("Payment has expired");
        }
        
        // อัพเดทสถานะ
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaidAt(LocalDateTime.now());
        payment = paymentRepository.save(payment);
        
        // สร้าง Transaction
        createTransaction(payment, TransactionType.CAPTURE, payment.getAmount(), TransactionStatus.SUCCESS);
        
        logger.info("Payment completed: {}", referenceId);
        return toResponse(payment);
    }

    /**
     * ยกเลิก Payment
     * 
     * @param referenceId Reference ID
     * @param reason เหตุผล
     * @return PaymentResponse
     */
    @Caching(evict = {
        @CacheEvict(value = "payment-by-ref", key = "#referenceId"),
        @CacheEvict(value = "payment-list", allEntries = true),
        @CacheEvict(value = "dashboard-stats", allEntries = true)
    })
    public PaymentResponse cancelPayment(String referenceId, String reason) {
        logger.info("Cancelling payment: {}", referenceId);
        
        Payment payment = findPaymentByReferenceId(referenceId);
        
        // ตรวจสอบว่าสามารถยกเลิกได้หรือไม่
        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            throw new InvalidRequestException("Cannot cancel completed payment. Use refund instead.");
        }
        
        if (payment.getStatus() == PaymentStatus.CANCELLED) {
            throw new InvalidRequestException("Payment is already cancelled");
        }
        
        // อัพเดทสถานะ
        payment.setStatus(PaymentStatus.CANCELLED);
        payment.setFailureReason(reason);
        payment = paymentRepository.save(payment);
        
        // สร้าง Transaction
        createTransaction(payment, TransactionType.VOID, payment.getAmount(), TransactionStatus.SUCCESS);
        
        logger.info("Payment cancelled: {}", referenceId);
        return toResponse(payment);
    }

    /**
     * คืนเงิน (Refund)
     * 
     * @param request RefundRequest
     * @return PaymentResponse
     */
    @Caching(evict = {
        @CacheEvict(value = "payment-by-ref", key = "#request.referenceId()"),
        @CacheEvict(value = "payment-list", allEntries = true),
        @CacheEvict(value = "dashboard-stats", allEntries = true)
    })
    public PaymentResponse refundPayment(RefundRequest request) {
        logger.info("Processing refund for payment: {}", request.referenceId());
        
        Payment payment = findPaymentByReferenceId(request.referenceId());
        
        // ตรวจสอบว่าชำระเงินสำเร็จแล้วหรือไม่
        if (payment.getStatus() != PaymentStatus.COMPLETED && 
            payment.getStatus() != PaymentStatus.PARTIALLY_REFUNDED) {
            throw new InvalidRequestException("Can only refund completed payments");
        }
        
        // คำนวณยอดคืนเงิน
        BigDecimal refundAmount = request.amount() != null ? request.amount() : payment.getAmount();
        
        // ตรวจสอบว่ายอดคืนไม่เกินยอดที่ชำระ
        BigDecimal alreadyRefunded = calculateRefundedAmount(payment.getId());
        BigDecimal availableForRefund = payment.getAmount().subtract(alreadyRefunded);
        
        if (refundAmount.compareTo(availableForRefund) > 0) {
            throw new InvalidRequestException("Refund amount exceeds available amount. Available: " + availableForRefund);
        }
        
        // อัพเดทสถานะ
        if (refundAmount.compareTo(availableForRefund) == 0) {
            payment.setStatus(PaymentStatus.REFUNDED);
        } else {
            payment.setStatus(PaymentStatus.PARTIALLY_REFUNDED);
        }
        payment = paymentRepository.save(payment);
        
        // สร้าง Refund Transaction
        Transaction refundTx = createTransaction(payment, TransactionType.REFUND, refundAmount, TransactionStatus.SUCCESS);
        refundTx.setResponseMessage(request.reason());
        transactionRepository.save(refundTx);
        
        logger.info("Refund processed for payment: {}, amount: {}", request.referenceId(), refundAmount);
        return toResponse(payment);
    }

    /**
     * อัพเดทสถานะจาก Webhook
     * 
     * @param payload WebhookPayload
     */
    public void processWebhook(WebhookPayload payload) {
        logger.info("Processing webhook for payment: {}", payload.referenceId());
        
        Payment payment = findPaymentByReferenceId(payload.referenceId());
        
        // อัพเดทสถานะตาม Event Type
        PaymentStatus newStatus = switch (payload.eventType()) {
            case "payment.completed" -> PaymentStatus.COMPLETED;
            case "payment.failed" -> PaymentStatus.FAILED;
            case "payment.cancelled" -> PaymentStatus.CANCELLED;
            case "payment.expired" -> PaymentStatus.EXPIRED;
            default -> payment.getStatus();
        };
        
        if (newStatus == PaymentStatus.COMPLETED) {
            payment.setPaidAt(LocalDateTime.now());
        }
        
        if (newStatus == PaymentStatus.FAILED || newStatus == PaymentStatus.CANCELLED) {
            payment.setFailureReason(payload.failureReason());
        }
        
        payment.setStatus(newStatus);
        paymentRepository.save(payment);
        
        // สร้าง Webhook Transaction
        Transaction tx = createTransaction(payment, TransactionType.WEBHOOK, payment.getAmount(), TransactionStatus.SUCCESS);
        tx.setGatewayReference(payload.gatewayReference());
        tx.setResponseCode(payload.responseCode());
        tx.setResponseMessage(payload.responseMessage());
        transactionRepository.save(tx);
        
        logger.info("Webhook processed for payment: {}, new status: {}", payload.referenceId(), newStatus);
    }

    /**
     * ดึงสถิติสำหรับ Dashboard
     * 
     * @return DashboardStats
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "dashboard-stats", key = "'stats'")
    public DashboardStats getDashboardStats() {
        logger.debug("Cache MISS - Fetching dashboard stats from database");
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        
        return new DashboardStats(
            paymentRepository.count(),
            paymentRepository.countByStatus(PaymentStatus.PENDING),
            paymentRepository.countByStatus(PaymentStatus.COMPLETED),
            paymentRepository.countByStatus(PaymentStatus.FAILED),
            paymentRepository.sumCompletedAmount(),
            paymentRepository.sumTodayCompletedAmount(startOfDay),
            paymentRepository.countTodayPayments(startOfDay),
            null, // จะเพิ่ม Query สำหรับ payment method stats ทีหลัง
            null  // จะเพิ่ม Query สำหรับ status stats ทีหลัง
        );
    }

    // ==================== Private Methods ====================

    /**
     * ค้นหา Payment Entity จาก Reference ID
     */
    private Payment findPaymentByReferenceId(String referenceId) {
        return paymentRepository.findByReferenceId(referenceId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment", "referenceId", referenceId));
    }

    /**
     * สร้าง Reference ID
     * รูปแบบ: PAY-xxxxxxxx-xxxx-xxxx
     */
    private String generateReferenceId() {
        return "PAY-" + UUID.randomUUID().toString().toUpperCase().substring(0, 18);
    }

    /**
     * สร้าง Transaction
     */
    private Transaction createTransaction(Payment payment, TransactionType type, BigDecimal amount, TransactionStatus status) {
        Transaction transaction = Transaction.builder()
            .transactionId("TXN-" + UUID.randomUUID().toString().toUpperCase().substring(0, 18))
            .transactionType(type)
            .amount(amount)
            .currency(payment.getCurrency())
            .status(status)
            .payment(payment)
            .build();
        
        return transactionRepository.save(transaction);
    }

    /**
     * คำนวณยอดที่คืนเงินแล้ว
     */
    private BigDecimal calculateRefundedAmount(Long paymentId) {
        List<Transaction> refunds = transactionRepository.findByPaymentIdAndTransactionType(paymentId, TransactionType.REFUND);
        return refunds.stream()
            .filter(t -> t.getStatus() == TransactionStatus.SUCCESS)
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * แปลง Entity เป็น Response DTO
     */
    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
            payment.getId(),
            payment.getReferenceId(),
            payment.getOrderId(),
            payment.getAmount(),
            payment.getCurrency(),
            payment.getStatus(),
            payment.getPaymentMethod(),
            payment.getDescription(),
            new PaymentResponse.CustomerInfo(
                payment.getCustomerName(),
                payment.getCustomerEmail(),
                payment.getCustomerPhone()
            ),
            payment.getFailureReason(),
            payment.getPaidAt(),
            payment.getExpiresAt(),
            payment.getCreatedAt(),
            payment.getUpdatedAt(),
            "/pay/" + payment.getReferenceId() // URL สำหรับหน้าชำระเงิน
        );
    }

    /**
     * แปลง Entity เป็น Summary DTO
     */
    private PaymentSummary toSummary(Payment payment) {
        return new PaymentSummary(
            payment.getId(),
            payment.getReferenceId(),
            payment.getOrderId(),
            payment.getAmount(),
            payment.getCurrency(),
            payment.getStatus(),
            payment.getPaymentMethod(),
            payment.getCustomerName(),
            payment.getCreatedAt()
        );
    }

    /**
     * แปลง Page เป็น PageResponse
     */
    private PageResponse<PaymentSummary> toPageResponse(Page<Payment> page) {
        List<PaymentSummary> content = page.getContent().stream()
            .map(this::toSummary)
            .toList();
        
        return new PageResponse<>(
            content,
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.isFirst(),
            page.isLast()
        );
    }
}

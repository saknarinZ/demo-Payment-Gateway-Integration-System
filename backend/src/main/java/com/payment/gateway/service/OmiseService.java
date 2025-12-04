package com.payment.gateway.service;

import co.omise.Client;
import co.omise.models.Charge;
import co.omise.models.OmiseException;
import com.payment.gateway.dto.OmiseChargeRequest;
import com.payment.gateway.dto.OmiseChargeResponse;
import com.payment.gateway.entity.Payment;
import com.payment.gateway.entity.PaymentMethod;
import com.payment.gateway.entity.PaymentStatus;
import com.payment.gateway.entity.Transaction;
import com.payment.gateway.entity.TransactionStatus;
import com.payment.gateway.entity.TransactionType;
import com.payment.gateway.repository.MerchantRepository;
import com.payment.gateway.repository.PaymentRepository;
import com.payment.gateway.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * OmiseService - Service สำหรับจัดการ Payment ผ่าน Omise (Opn Payments)
 * 
 * หน้าที่หลัก:
 * 1. สร้าง Charge จาก Token
 * 2. ตรวจสอบสถานะ Charge
 * 3. Refund
 * 4. บันทึก Transaction ลง Database
 * 
 * @see <a href="https://www.omise.co/charges-api">Omise Charges API</a>
 */
@Service
public class OmiseService {

    private static final Logger logger = LoggerFactory.getLogger(OmiseService.class);

    private final Client omiseClient;
    private final PaymentRepository paymentRepository;
    private final TransactionRepository transactionRepository;
    private final MerchantRepository merchantRepository;

    @Value("${omise.public-key}")
    private String publicKey;

    public OmiseService(
            Client omiseClient,
            PaymentRepository paymentRepository,
            TransactionRepository transactionRepository,
            MerchantRepository merchantRepository) {
        this.omiseClient = omiseClient;
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.merchantRepository = merchantRepository;
    }

    /**
     * ดึง Public Key สำหรับส่งให้ Frontend
     * 
     * @return Omise Public Key
     */
    public String getPublicKey() {
        return publicKey;
    }

    /**
     * สร้าง Charge จาก Token
     * 
     * ขั้นตอน:
     * 1. รับ Token จาก Frontend (ได้จาก Omise.js)
     * 2. สร้าง Charge ผ่าน Omise API
     * 3. บันทึก Payment และ Transaction ลง Database
     * 4. Return Response
     * 
     * @param request OmiseChargeRequest (token, amount, currency, etc.)
     * @return OmiseChargeResponse
     */
    @Transactional
    public OmiseChargeResponse createCharge(OmiseChargeRequest request) {
        logger.info("Creating Omise charge: amount={} {}, token={}...",
                request.amountInBaht(),
                request.currency(),
                maskToken(request.token()));

        try {
            // ============================================================
            // 1. สร้าง Charge Parameters
            // ============================================================
            Map<String, Object> chargeParams = new HashMap<>();
            chargeParams.put("amount", request.amount());
            chargeParams.put("currency", request.currency().toLowerCase());
            chargeParams.put("card", request.token());  // Token จาก Omise.js
            
            // Description
            if (request.description() != null && !request.description().isBlank()) {
                chargeParams.put("description", request.description());
            }
            
            // Return URI สำหรับ 3D Secure
            if (request.returnUri() != null && !request.returnUri().isBlank()) {
                chargeParams.put("return_uri", request.returnUri());
            }
            
            // Metadata
            Map<String, Object> metadata = new HashMap<>();
            if (request.orderId() != null) {
                metadata.put("order_id", request.orderId());
            }
            if (request.customerEmail() != null) {
                metadata.put("customer_email", request.customerEmail());
            }
            if (request.customerName() != null) {
                metadata.put("customer_name", request.customerName());
            }
            if (!metadata.isEmpty()) {
                chargeParams.put("metadata", metadata);
            }

            // ============================================================
            // 2. เรียก Omise API เพื่อสร้าง Charge
            // ============================================================
            logger.debug("Calling Omise API to create charge...");
            
            Charge charge = omiseClient.charges().create(chargeParams);
            
            logger.info("Omise charge created: id={}, status={}, paid={}",
                    charge.getId(), charge.getStatus(), charge.isPaid());

            // ============================================================
            // 3. บันทึกลง Database
            // ============================================================
            Payment payment = savePaymentToDatabase(request, charge);

            // ============================================================
            // 4. สร้าง Response
            // ============================================================
            return buildChargeResponse(charge);

        } catch (OmiseException e) {
            // Omise API Error
            logger.error("Omise API error: code={}, message={}", e.getCode(), e.getMessage());
            return OmiseChargeResponse.builder()
                    .status("failed")
                    .failureCode(e.getCode())
                    .failureMessage(e.getMessage())
                    .createdAt(LocalDateTime.now())
                    .build();
                    
        } catch (IOException e) {
            // Network/IO Error
            logger.error("IO error while calling Omise API", e);
            return OmiseChargeResponse.builder()
                    .status("failed")
                    .failureCode("io_error")
                    .failureMessage("Failed to connect to Omise API: " + e.getMessage())
                    .createdAt(LocalDateTime.now())
                    .build();
        }
    }

    /**
     * ดึงข้อมูล Charge ตาม ID
     * 
     * @param chargeId Omise Charge ID (chr_xxx)
     * @return OmiseChargeResponse
     */
    public OmiseChargeResponse getCharge(String chargeId) {
        logger.info("Retrieving Omise charge: {}", chargeId);
        
        try {
            Charge charge = omiseClient.charges().get(chargeId);
            return buildChargeResponse(charge);
            
        } catch (OmiseException e) {
            logger.error("Failed to retrieve charge: {}", e.getMessage());
            return OmiseChargeResponse.builder()
                    .id(chargeId)
                    .status("failed")
                    .failureCode(e.getCode())
                    .failureMessage(e.getMessage())
                    .build();
                    
        } catch (IOException e) {
            logger.error("IO error while retrieving charge", e);
            return OmiseChargeResponse.builder()
                    .id(chargeId)
                    .status("failed")
                    .failureCode("io_error")
                    .failureMessage(e.getMessage())
                    .build();
        }
    }

    /**
     * บันทึก Payment ลง Database
     */
    private Payment savePaymentToDatabase(OmiseChargeRequest request, Charge charge) {
        // หา Default Merchant
        var merchant = merchantRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No merchant found"));

        // สร้าง Payment
        Payment payment = new Payment();
        payment.setMerchant(merchant);
        payment.setReferenceId("PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setAmount(BigDecimal.valueOf(request.amount() / 100.0));
        payment.setCurrency(request.currency());
        payment.setDescription(request.description());
        payment.setPaymentMethod(PaymentMethod.CREDIT_CARD);
        payment.setStatus(mapChargeStatus(charge.getStatus().toString(), charge.isPaid()));
        payment.setGatewayReference(charge.getId());
        
        // Customer Info
        if (request.customerEmail() != null) {
            payment.setCustomerEmail(request.customerEmail());
        }
        if (request.customerName() != null) {
            payment.setCustomerName(request.customerName());
        }
        
        // Metadata
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("omise_charge_id", charge.getId());
        metadata.put("card_last_digits", charge.getCard() != null ? charge.getCard().getLastDigits() : null);
        metadata.put("card_brand", charge.getCard() != null ? charge.getCard().getBrand() : null);
        payment.setMetadata(metadata);
        
        payment = paymentRepository.save(payment);
        logger.info("Payment saved: id={}, reference={}", payment.getId(), payment.getReferenceId());

        // สร้าง Transaction
        Transaction transaction = new Transaction();
        transaction.setPayment(payment);
        transaction.setTransactionType(TransactionType.CHARGE);
        transaction.setAmount(payment.getAmount());
        transaction.setStatus(mapTransactionStatus(charge.getStatus().toString(), charge.isPaid()));
        transaction.setGatewayTransactionId(charge.getId());
        transaction.setGatewayResponse(charge.toString());
        
        transactionRepository.save(transaction);
        logger.info("Transaction saved for payment: {}", payment.getReferenceId());

        return payment;
    }

    /**
     * แปลง Omise Status เป็น PaymentStatus
     */
    private PaymentStatus mapChargeStatus(String omiseStatus, boolean paid) {
        if (paid) {
            return PaymentStatus.COMPLETED;
        }
        return switch (omiseStatus.toLowerCase()) {
            case "successful" -> PaymentStatus.COMPLETED;
            case "pending" -> PaymentStatus.PENDING;
            case "failed" -> PaymentStatus.FAILED;
            case "expired" -> PaymentStatus.EXPIRED;
            case "reversed" -> PaymentStatus.REFUNDED;
            default -> PaymentStatus.PROCESSING;
        };
    }

    /**
     * แปลง Omise Status เป็น TransactionStatus
     */
    private TransactionStatus mapTransactionStatus(String omiseStatus, boolean paid) {
        if (paid) {
            return TransactionStatus.SUCCESS;
        }
        return switch (omiseStatus.toLowerCase()) {
            case "successful" -> TransactionStatus.SUCCESS;
            case "pending" -> TransactionStatus.PENDING;
            case "failed", "expired", "reversed" -> TransactionStatus.FAILED;
            default -> TransactionStatus.PENDING;
        };
    }

    /**
     * สร้าง Response จาก Omise Charge
     */
    private OmiseChargeResponse buildChargeResponse(Charge charge) {
        var builder = OmiseChargeResponse.builder()
                .id(charge.getId())
                .status(charge.getStatus().toString().toLowerCase())
                .amount(charge.getAmount())
                .currency(charge.getCurrency())
                .paid(charge.isPaid())
                .authorizeUri(charge.getAuthorizeUri())
                .returnUri(charge.getReturnUri());
        
        // Failure Info
        if (charge.getFailureCode() != null) {
            builder.failureCode(charge.getFailureCode().toString());
        }
        if (charge.getFailureMessage() != null) {
            builder.failureMessage(charge.getFailureMessage());
        }
        
        // Card Info
        if (charge.getCard() != null) {
            builder.cardLastDigits(charge.getCard().getLastDigits());
            builder.cardBrand(charge.getCard().getBrand());
        }
        
        // Transaction ID
        if (charge.getTransaction() != null) {
            builder.transactionId(charge.getTransaction());
        }
        
        // Created At
        if (charge.getCreated() != null) {
            builder.createdAt(LocalDateTime.ofInstant(
                    charge.getCreated().toInstant(),
                    ZoneId.of("Asia/Bangkok")));
        } else {
            builder.createdAt(LocalDateTime.now());
        }
        
        return builder.build();
    }

    /**
     * ซ่อน Token สำหรับ Log
     */
    private String maskToken(String token) {
        if (token == null || token.length() < 10) {
            return "***";
        }
        return token.substring(0, 10) + "***";
    }
}

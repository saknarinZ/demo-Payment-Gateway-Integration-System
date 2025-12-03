package com.payment.gateway.config;

import com.payment.gateway.dto.CreatePaymentRequest;
import com.payment.gateway.entity.Merchant;
import com.payment.gateway.entity.PaymentMethod;
import com.payment.gateway.repository.MerchantRepository;
import com.payment.gateway.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

/**
 * DataInitializer - สร้างข้อมูลเริ่มต้นสำหรับทดสอบ
 * 
 * ทำงานเฉพาะใน Development Profile
 * สร้าง Demo Merchant และ Sample Payments
 */
@Configuration
public class DataInitializer {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);
    
    // Demo API Key ที่ Frontend ใช้
    private static final String DEMO_API_KEY = "pk_live_demo_key_for_testing";
    private static final String DEMO_API_SECRET = "sk_live_demo_secret_for_testing_1234567890";
    private static final String DEMO_WEBHOOK_SECRET = "whsec_demo_webhook_secret_for_testing";

    /**
     * สร้างข้อมูลเริ่มต้น
     */
    @Bean
    CommandLineRunner initData(MerchantRepository merchantRepository, PaymentService paymentService) {
        return args -> {
            logger.info("Initializing demo data...");
            
            try {
                // ตรวจสอบว่ามี Demo Merchant แล้วหรือยัง
                if (merchantRepository.existsByApiKey(DEMO_API_KEY)) {
                    logger.info("Demo merchant already exists with API Key: {}", DEMO_API_KEY);
                    return;
                }
                
                // สร้าง Demo Merchant ด้วย API Key ที่กำหนด
                Merchant merchant = Merchant.builder()
                    .name("Demo Shop")
                    .email("demo@example.com")
                    .phone("0812345678")
                    .webhookUrl("https://example.com/webhook")
                    .webhookSecret(DEMO_WEBHOOK_SECRET)
                    .apiKey(DEMO_API_KEY)
                    .apiSecret(DEMO_API_SECRET)
                    .isActive(true)
                    .build();
                
                merchantRepository.save(merchant);
                logger.info("Demo merchant created with API Key: {}", DEMO_API_KEY);
                
                // สร้าง Sample Payments
                String apiKey = DEMO_API_KEY;
                
                // Payment 1 - Pending
                var payment1 = new CreatePaymentRequest(
                    "ORD-001",
                    new BigDecimal("1500.00"),
                    "THB",
                    PaymentMethod.CREDIT_CARD,
                    "สินค้าตัวอย่าง #1",
                    "สมชาย ใจดี",
                    "somchai@example.com",
                    "0891234567",
                    null,
                    null,
                    null
                );
                paymentService.createPayment(payment1, apiKey);
                
                // Payment 2 - Completed
                var payment2 = new CreatePaymentRequest(
                    "ORD-002",
                    new BigDecimal("2500.00"),
                    "THB",
                    PaymentMethod.PROMPTPAY,
                    "สินค้าตัวอย่าง #2",
                    "สมหญิง รักดี",
                    "somying@example.com",
                    "0899876543",
                    null,
                    null,
                    null
                );
                var p2 = paymentService.createPayment(payment2, apiKey);
                paymentService.completePayment(p2.referenceId());
                
                // Payment 3 - Cancelled
                var payment3 = new CreatePaymentRequest(
                    "ORD-003",
                    new BigDecimal("3200.00"),
                    "THB",
                    PaymentMethod.BANK_TRANSFER,
                    "สินค้าตัวอย่าง #3",
                    "วิชัย มั่นคง",
                    "wichai@example.com",
                    "0867654321",
                    null,
                    null,
                    null
                );
                var p3 = paymentService.createPayment(payment3, apiKey);
                paymentService.cancelPayment(p3.referenceId(), "ลูกค้ายกเลิก");
                
                // Payment 4-6 - More samples
                for (int i = 4; i <= 6; i++) {
                    var payment = new CreatePaymentRequest(
                        "ORD-00" + i,
                        new BigDecimal(1000 + (i * 500)),
                        "THB",
                        PaymentMethod.values()[i % PaymentMethod.values().length],
                        "สินค้าตัวอย่าง #" + i,
                        "ลูกค้า " + i,
                        "customer" + i + "@example.com",
                        "080000000" + i,
                        null,
                        null,
                        null
                    );
                    var p = paymentService.createPayment(payment, apiKey);
                    
                    // บาง Payment ให้สำเร็จ
                    if (i % 2 == 0) {
                        paymentService.completePayment(p.referenceId());
                    }
                }
                
                logger.info("Demo data initialized successfully!");
                logger.info("===================================");
                logger.info("Demo Merchant API Key: {}", DEMO_API_KEY);
                logger.info("Demo Merchant API Secret: {}", DEMO_API_SECRET);
                logger.info("===================================");
                
            } catch (Exception e) {
                logger.warn("Demo data may already exist: {}", e.getMessage());
            }
        };
    }
}

package com.payment.gateway.config;

import co.omise.Client;
import co.omise.ClientException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

/**
 * OmiseConfig - Configuration สำหรับ Omise (Opn Payments) SDK
 * 
 * สร้าง Omise Client Bean สำหรับใช้งานทั่วทั้ง Application
 * 
 * @see <a href="https://www.omise.co/docs">Omise API Documentation</a>
 */
@Configuration
public class OmiseConfig {

    private static final Logger logger = LoggerFactory.getLogger(OmiseConfig.class);

    /**
     * Public Key - ใช้สำหรับ Frontend Tokenization
     * รูปแบบ: pkey_test_xxxxx (Test) หรือ pkey_xxxxx (Live)
     */
    @Value("${omise.public-key}")
    private String publicKey;

    /**
     * Secret Key - ใช้สำหรับ Backend API Calls (Charge, Refund, etc.)
     * รูปแบบ: skey_test_xxxxx (Test) หรือ skey_xxxxx (Live)
     */
    @Value("${omise.secret-key}")
    private String secretKey;

    /**
     * API Version - กำหนด Version ของ Omise API
     */
    @Value("${omise.api-version:2019-05-29}")
    private String apiVersion;

    /**
     * สร้าง Omise Client Bean
     * 
     * Client นี้จะใช้สำหรับเรียก Omise API ทั้งหมด:
     * - สร้าง Charge
     * - Refund
     * - ดึงข้อมูล Transaction
     * 
     * @return Omise Client instance
     * @throws IOException หากไม่สามารถสร้าง Client ได้
     */
    @Bean
    public Client omiseClient() throws IOException, ClientException {
        logger.info("===========================================");
        logger.info("Initializing Omise Client...");
        logger.info("Public Key: {}...", maskKey(publicKey));
        logger.info("Secret Key: {}...", maskKey(secretKey));
        logger.info("API Version: {}", apiVersion);
        logger.info("===========================================");

        // ตรวจสอบว่า Keys ถูกต้อง
        validateKeys();

        // สร้าง Omise Client ด้วย Secret Key
        // Public Key ใช้เฉพาะ Frontend เท่านั้น
        Client client = new Client.Builder()
                .publicKey(publicKey)
                .secretKey(secretKey)
                .build();

        logger.info("Omise Client initialized successfully!");
        return client;
    }

    /**
     * ตรวจสอบว่า API Keys ถูกต้อง
     */
    private void validateKeys() {
        // ตรวจสอบ Public Key
        if (publicKey == null || publicKey.isBlank()) {
            throw new IllegalStateException("OMISE_PUBLIC_KEY is not configured!");
        }
        if (!publicKey.startsWith("pkey_")) {
            throw new IllegalStateException("Invalid OMISE_PUBLIC_KEY format. Must start with 'pkey_'");
        }

        // ตรวจสอบ Secret Key
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("OMISE_SECRET_KEY is not configured!");
        }
        if (!secretKey.startsWith("skey_")) {
            throw new IllegalStateException("Invalid OMISE_SECRET_KEY format. Must start with 'skey_'");
        }

        // เตือนถ้าใช้ Test Keys ใน Production
        if (publicKey.contains("_test_")) {
            logger.warn("⚠️  Using TEST keys! Switch to LIVE keys for production.");
        } else {
            logger.info("✅ Using LIVE keys");
        }
    }

    /**
     * ซ่อน Key สำหรับ Log (แสดงแค่ 10 ตัวแรก)
     */
    private String maskKey(String key) {
        if (key == null || key.length() < 15) {
            return "***";
        }
        return key.substring(0, 15) + "***";
    }

    /**
     * Getter สำหรับ Public Key (ใช้ส่งให้ Frontend)
     */
    public String getPublicKey() {
        return publicKey;
    }
}

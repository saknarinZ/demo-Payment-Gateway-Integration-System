package com.payment.gateway.security;

import com.payment.gateway.exception.WebhookSignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * HmacSignatureService - บริการสำหรับสร้างและตรวจสอบ HMAC-SHA256 Signature
 * 
 * ใช้สำหรับ:
 * 1. สร้าง Signature สำหรับส่งออกไปยัง Webhook
 * 2. ตรวจสอบ Signature ที่รับมาจาก Payment Gateway
 * 
 * Algorithm: HMAC-SHA256
 */
@Component
public class HmacSignatureService {

    private static final Logger logger = LoggerFactory.getLogger(HmacSignatureService.class);
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    @Value("${payment.webhook.secret}")
    private String webhookSecret;

    /**
     * สร้าง HMAC-SHA256 Signature
     * 
     * @param payload ข้อมูลที่ต้องการ Sign
     * @return Signature ในรูปแบบ Hex String
     */
    public String generateSignature(String payload) {
        return generateSignature(payload, webhookSecret);
    }

    /**
     * สร้าง HMAC-SHA256 Signature ด้วย Secret ที่กำหนด
     * 
     * @param payload ข้อมูลที่ต้องการ Sign
     * @param secret Secret Key สำหรับ Sign
     * @return Signature ในรูปแบบ Hex String
     */
    public String generateSignature(String payload, String secret) {
        try {
            // สร้าง HMAC-SHA256 Mac Instance
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            
            // ตั้งค่า Secret Key
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                secret.getBytes(StandardCharsets.UTF_8),
                HMAC_ALGORITHM
            );
            mac.init(secretKeySpec);
            
            // คำนวณ HMAC
            byte[] hmacBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            
            // แปลงเป็น Hex String (lowercase)
            return HexFormat.of().formatHex(hmacBytes);
            
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            logger.error("Failed to generate HMAC signature", e);
            throw new RuntimeException("Failed to generate signature", e);
        }
    }

    /**
     * ตรวจสอบ Signature ที่รับมา
     * 
     * @param payload ข้อมูลที่ใช้ในการ Sign
     * @param receivedSignature Signature ที่ได้รับมา
     * @return true ถ้า Signature ถูกต้อง
     */
    public boolean verifySignature(String payload, String receivedSignature) {
        return verifySignature(payload, receivedSignature, webhookSecret);
    }

    /**
     * ตรวจสอบ Signature ด้วย Secret ที่กำหนด
     * 
     * @param payload ข้อมูลที่ใช้ในการ Sign
     * @param receivedSignature Signature ที่ได้รับมา
     * @param secret Secret Key
     * @return true ถ้า Signature ถูกต้อง
     */
    public boolean verifySignature(String payload, String receivedSignature, String secret) {
        if (payload == null || receivedSignature == null || secret == null) {
            return false;
        }
        
        // สร้าง Expected Signature
        String expectedSignature = generateSignature(payload, secret);
        
        // เปรียบเทียบแบบ Constant Time เพื่อป้องกัน Timing Attack
        return constantTimeEquals(expectedSignature, receivedSignature.toLowerCase());
    }

    /**
     * ตรวจสอบ Signature และ Throw Exception ถ้าไม่ถูกต้อง
     * 
     * @param payload ข้อมูลที่ใช้ในการ Sign
     * @param receivedSignature Signature ที่ได้รับมา
     * @throws WebhookSignatureException ถ้า Signature ไม่ถูกต้อง
     */
    public void validateSignature(String payload, String receivedSignature) {
        if (!verifySignature(payload, receivedSignature)) {
            logger.warn("Invalid webhook signature received");
            throw new WebhookSignatureException("Invalid webhook signature");
        }
        logger.debug("Webhook signature verified successfully");
    }

    /**
     * ตรวจสอบ Signature ด้วย Merchant's API Secret
     * 
     * @param payload ข้อมูลที่ใช้ในการ Sign
     * @param receivedSignature Signature ที่ได้รับมา
     * @param merchantApiSecret Merchant's API Secret
     * @throws WebhookSignatureException ถ้า Signature ไม่ถูกต้อง
     */
    public void validateMerchantSignature(String payload, String receivedSignature, String merchantApiSecret) {
        if (!verifySignature(payload, receivedSignature, merchantApiSecret)) {
            logger.warn("Invalid merchant signature received");
            throw new WebhookSignatureException("Invalid merchant signature");
        }
        logger.debug("Merchant signature verified successfully");
    }

    /**
     * เปรียบเทียบ String แบบ Constant Time
     * ป้องกัน Timing Attack
     * 
     * @param a String แรก
     * @param b String ที่สอง
     * @return true ถ้าเท่ากัน
     */
    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        
        if (a.length() != b.length()) {
            return false;
        }
        
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        
        return result == 0;
    }

    /**
     * สร้าง Signature Header Value
     * รูปแบบ: sha256=<signature>
     * 
     * @param payload ข้อมูลที่ต้องการ Sign
     * @return Header Value
     */
    public String createSignatureHeader(String payload) {
        return "sha256=" + generateSignature(payload);
    }

    /**
     * Parse Signature จาก Header
     * รูปแบบ: sha256=<signature>
     * 
     * @param header Header Value
     * @return Signature หรือ null ถ้ารูปแบบไม่ถูกต้อง
     */
    public String parseSignatureFromHeader(String header) {
        if (header == null || !header.startsWith("sha256=")) {
            return null;
        }
        return header.substring(7);
    }
}

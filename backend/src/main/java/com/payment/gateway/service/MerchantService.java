package com.payment.gateway.service;

import com.payment.gateway.dto.CreateMerchantRequest;
import com.payment.gateway.dto.MerchantResponse;
import com.payment.gateway.entity.Merchant;
import com.payment.gateway.exception.DuplicateResourceException;
import com.payment.gateway.exception.ResourceNotFoundException;
import com.payment.gateway.repository.MerchantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

/**
 * MerchantService - บริการจัดการ Merchant
 * 
 * รับผิดชอบ:
 * - สร้าง Merchant ใหม่
 * - สร้าง API Key และ Secret
 * - ค้นหาและจัดการข้อมูล Merchant
 */
@Service
@Transactional
public class MerchantService {

    private static final Logger logger = LoggerFactory.getLogger(MerchantService.class);
    private static final SecureRandom secureRandom = new SecureRandom();
    
    private final MerchantRepository merchantRepository;

    public MerchantService(MerchantRepository merchantRepository) {
        this.merchantRepository = merchantRepository;
    }

    /**
     * สร้าง Merchant ใหม่
     * 
     * @param request ข้อมูล Merchant
     * @return MerchantResponse พร้อม API Key และ Secret
     */
    public MerchantResponse createMerchant(CreateMerchantRequest request) {
        logger.info("Creating new merchant: {}", request.email());
        
        // ตรวจสอบว่า Email ซ้ำหรือไม่
        if (merchantRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Merchant", "email", request.email());
        }
        
        // สร้าง API Key และ Secret
        String apiKey = generateApiKey();
        String apiSecret = generateApiSecret();
        String webhookSecret = generateWebhookSecret();
        
        // ตรวจสอบว่า API Key ไม่ซ้ำ
        while (merchantRepository.existsByApiKey(apiKey)) {
            apiKey = generateApiKey();
        }
        
        // สร้าง Merchant Entity
        Merchant merchant = Merchant.builder()
            .name(request.name())
            .email(request.email())
            .phone(request.phone())
            .webhookUrl(request.webhookUrl())
            .webhookSecret(webhookSecret)
            .apiKey(apiKey)
            .apiSecret(apiSecret)
            .isActive(true)
            .build();
        
        // บันทึกลง Database
        merchant = merchantRepository.save(merchant);
        logger.info("Merchant created successfully with ID: {}", merchant.getId());
        
        // ส่งกลับพร้อม Secret (แสดงแค่ครั้งเดียวตอนสร้าง)
        return toResponse(merchant, true);
    }

    /**
     * ค้นหา Merchant จาก ID
     * 
     * @param id Merchant ID
     * @return MerchantResponse
     */
    @Transactional(readOnly = true)
    public MerchantResponse getMerchantById(Long id) {
        Merchant merchant = findMerchantById(id);
        return toResponse(merchant, false);
    }

    /**
     * ค้นหา Merchant จาก API Key
     * 
     * @param apiKey API Key
     * @return Merchant Entity
     */
    @Transactional(readOnly = true)
    public Merchant getMerchantByApiKey(String apiKey) {
        return merchantRepository.findByApiKey(apiKey)
            .orElseThrow(() -> new ResourceNotFoundException("Merchant", "apiKey", apiKey));
    }

    /**
     * ดึงรายการ Merchant ทั้งหมด
     * 
     * @return รายการ MerchantResponse
     */
    @Transactional(readOnly = true)
    public List<MerchantResponse> getAllMerchants() {
        return merchantRepository.findAll().stream()
            .map(m -> toResponse(m, false))
            .toList();
    }

    /**
     * อัพเดทสถานะ Active/Inactive
     * 
     * @param id Merchant ID
     * @param isActive สถานะใหม่
     * @return MerchantResponse
     */
    public MerchantResponse updateMerchantStatus(Long id, boolean isActive) {
        logger.info("Updating merchant {} status to: {}", id, isActive);
        
        Merchant merchant = findMerchantById(id);
        merchant.setIsActive(isActive);
        merchant = merchantRepository.save(merchant);
        
        return toResponse(merchant, false);
    }

    /**
     * Regenerate API Secret
     * 
     * @param id Merchant ID
     * @return MerchantResponse พร้อม Secret ใหม่
     */
    public MerchantResponse regenerateApiSecret(Long id) {
        logger.info("Regenerating API secret for merchant: {}", id);
        
        Merchant merchant = findMerchantById(id);
        merchant.setApiSecret(generateApiSecret());
        merchant = merchantRepository.save(merchant);
        
        logger.info("API secret regenerated for merchant: {}", id);
        return toResponse(merchant, true);
    }

    /**
     * ค้นหา Merchant Entity จาก ID
     */
    private Merchant findMerchantById(Long id) {
        return merchantRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Merchant", "id", id));
    }

    /**
     * สร้าง API Key (32 characters)
     * รูปแบบ: pk_live_xxxxxxxx หรือ pk_test_xxxxxxxx
     */
    private String generateApiKey() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        String randomPart = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        return "pk_live_" + randomPart.substring(0, 24);
    }

    /**
     * สร้าง API Secret (64 characters)
     * รูปแบบ: sk_live_xxxxxxxx
     */
    private String generateApiSecret() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        String randomPart = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        return "sk_live_" + randomPart.substring(0, 56);
    }

    /**
     * สร้าง Webhook Secret (40 characters)
     * รูปแบบ: whsec_xxxxxxxx
     */
    private String generateWebhookSecret() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String randomPart = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        return "whsec_" + randomPart.substring(0, 34);
    }

    /**
     * แปลง Entity เป็น Response DTO
     * 
     * @param merchant Merchant Entity
     * @param includeSecret รวม API Secret หรือไม่
     * @return MerchantResponse
     */
    private MerchantResponse toResponse(Merchant merchant, boolean includeSecret) {
        return new MerchantResponse(
            merchant.getId(),
            merchant.getName(),
            merchant.getEmail(),
            merchant.getPhone(),
            merchant.getApiKey(),
            includeSecret ? merchant.getApiSecret() : null, // ซ่อน Secret
            merchant.getWebhookUrl(),
            merchant.getIsActive(),
            merchant.getCreatedAt(),
            merchant.getUpdatedAt()
        );
    }
}

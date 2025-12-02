package com.payment.gateway.repository;

import com.payment.gateway.entity.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * MerchantRepository - Repository สำหรับจัดการข้อมูล Merchant
 * 
 * ใช้ Spring Data JPA
 */
@Repository
public interface MerchantRepository extends JpaRepository<Merchant, Long> {

    /**
     * ค้นหา Merchant จาก API Key
     * 
     * @param apiKey API Key ของ Merchant
     * @return Merchant ที่พบ
     */
    Optional<Merchant> findByApiKey(String apiKey);
    
    /**
     * ค้นหา Merchant จาก Email
     * 
     * @param email Email ของ Merchant
     * @return Merchant ที่พบ
     */
    Optional<Merchant> findByEmail(String email);
    
    /**
     * ตรวจสอบว่ามี API Key นี้อยู่แล้วหรือไม่
     * 
     * @param apiKey API Key ที่ต้องการตรวจสอบ
     * @return true ถ้ามีอยู่แล้ว
     */
    boolean existsByApiKey(String apiKey);
    
    /**
     * ตรวจสอบว่ามี Email นี้อยู่แล้วหรือไม่
     * 
     * @param email Email ที่ต้องการตรวจสอบ
     * @return true ถ้ามีอยู่แล้ว
     */
    boolean existsByEmail(String email);
}

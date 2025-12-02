package com.payment.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Payment Gateway Application - Main Entry Point
 * 
 * แอพพลิเคชันหลักสำหรับ Payment Gateway Integration System
 * ใช้ Spring Boot 3.4+ พร้อม Java 21 Virtual Threads
 * 
 * @author Payment Gateway Team
 * @version 1.0.0
 */
@SpringBootApplication
public class PaymentGatewayApplication {

    /**
     * Main Method - จุดเริ่มต้นของ Application
     * 
     * @param args Command line arguments
     */
    public static void main(String[] args) {
        // เริ่มต้น Spring Boot Application
        // Virtual Threads จะถูกเปิดใช้งานผ่าน application.yml
        SpringApplication.run(PaymentGatewayApplication.class, args);
    }
}

package com.payment.gateway.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenApiConfig - การตั้งค่า Swagger/OpenAPI Documentation
 * 
 * เข้าถึง Swagger UI ได้ที่:
 * - http://localhost:8080/swagger-ui.html
 * - http://localhost:8080/swagger-ui/index.html
 * 
 * เข้าถึง OpenAPI JSON ได้ที่:
 * - http://localhost:8080/api-docs
 * 
 * @author Payment Gateway Team
 * @version 1.0
 */
@Configuration
public class OpenApiConfig {

    @Value("${spring.application.name:Payment Gateway}")
    private String applicationName;

    /**
     * กำหนด OpenAPI Specification
     * 
     * ประกอบด้วย:
     * - API Info (ชื่อ, เวอร์ชัน, รายละเอียด)
     * - Security Schemes (API Key)
     * - Servers (Development, Production)
     * - Tags (กลุ่ม Endpoints)
     */
    @Bean
    public OpenAPI paymentGatewayOpenAPI() {
        final String apiKeySecurityScheme = "X-API-Key";
        
        return new OpenAPI()
            // ============================================
            // API Information
            // ============================================
            .info(new Info()
                .title("Payment Gateway API")
                .description("""
                    ## 🏦 Payment Gateway Integration System API
                    
                    REST API สำหรับระบบจัดการการชำระเงิน พัฒนาด้วย **Spring Boot 3.4** และ **Java 21**
                    
                    ### ✨ Features
                    - สร้างและจัดการ Payment Transactions
                    - Webhook Notifications พร้อม HMAC-SHA256 Signature
                    - Refund และ Partial Refund
                    - Dashboard Statistics
                    - Redis Caching สำหรับ Performance
                    
                    ### 🔐 Authentication
                    ใช้ **API Key** ส่งผ่าน Header `X-API-Key` สำหรับทุก Request
                    
                    ### 📝 Response Format
                    - Success: HTTP 200/201 พร้อม JSON Response
                    - Error: RFC 7807 Problem Detail Format
                    
                    ### 🚀 Rate Limiting
                    - 1000 requests/minute per API Key
                    """)
                .version("1.0.0")
                .contact(new Contact()
                    .name("Payment Gateway Team")
                    .email("support@payment-gateway.com")
                    .url("https://payment-gateway.com"))
                .license(new License()
                    .name("MIT License")
                    .url("https://opensource.org/licenses/MIT"))
                .termsOfService("https://payment-gateway.com/terms"))
            
            // ============================================
            // External Documentation
            // ============================================
            .externalDocs(new ExternalDocumentation()
                .description("Payment Gateway Wiki Documentation")
                .url("https://github.com/payment-gateway/docs"))
            
            // ============================================
            // Servers
            // ============================================
            .servers(List.of(
                new Server()
                    .url("http://localhost:8080")
                    .description("Development Server"),
                new Server()
                    .url("https://api.payment-gateway.com")
                    .description("Production Server")
            ))
            
            // ============================================
            // Security Schemes
            // ============================================
            .components(new Components()
                .addSecuritySchemes(apiKeySecurityScheme, new SecurityScheme()
                    .type(SecurityScheme.Type.APIKEY)
                    .in(SecurityScheme.In.HEADER)
                    .name("X-API-Key")
                    .description("API Key สำหรับ Authentication (รับจาก Merchant Portal)")))
            
            // Apply Security Globally
            .addSecurityItem(new SecurityRequirement()
                .addList(apiKeySecurityScheme))
            
            // ============================================
            // Tags (กลุ่ม Endpoints)
            // ============================================
            .tags(List.of(
                new Tag()
                    .name("Payments")
                    .description("🛒 จัดการ Payment Transactions - สร้าง, ดู, ยกเลิก, คืนเงิน"),
                new Tag()
                    .name("Merchants")
                    .description("🏪 จัดการข้อมูล Merchant/ร้านค้า"),
                new Tag()
                    .name("Webhooks")
                    .description("🔔 รับ Webhook Notifications จาก Payment Provider"),
                new Tag()
                    .name("Health")
                    .description("❤️ Health Check Endpoints"),
                new Tag()
                    .name("Dashboard")
                    .description("📊 Dashboard Statistics และ Reports")
            ));
    }
}

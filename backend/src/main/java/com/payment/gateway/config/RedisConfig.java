package com.payment.gateway.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * RedisConfig - การตั้งค่า Redis สำหรับ Caching
 * 
 * ใช้สำหรับ:
 * - Cache Payment data เพื่อลดการ Query Database
 * - Cache Dashboard Statistics
 * - Cache Merchant Information
 * 
 * @author Payment Gateway Team
 * @version 1.0
 */
@Configuration
@EnableCaching
public class RedisConfig {

    /**
     * สร้าง ObjectMapper สำหรับ Redis Serialization
     * รองรับ Java 8 Date/Time API และ Type Information
     */
    private ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // รองรับ Java 8 Date/Time (LocalDateTime, etc.)
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // เพิ่ม Type Information สำหรับ Deserialization
        mapper.activateDefaultTyping(
            LaissezFaireSubTypeValidator.instance,
            ObjectMapper.DefaultTyping.NON_FINAL,
            JsonTypeInfo.As.PROPERTY
        );
        
        return mapper;
    }

    /**
     * RedisTemplate สำหรับ Manual Cache Operations
     * 
     * ใช้สำหรับกรณีที่ต้องการควบคุม Cache เอง
     * เช่น การ Set/Get ค่าเฉพาะ, การลบ Cache
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // ใช้ String Serializer สำหรับ Key
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        
        // ใช้ JSON Serializer สำหรับ Value
        GenericJackson2JsonRedisSerializer jsonSerializer = 
            new GenericJackson2JsonRedisSerializer(redisObjectMapper());
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        
        template.afterPropertiesSet();
        return template;
    }

    /**
     * CacheManager สำหรับ @Cacheable, @CachePut, @CacheEvict Annotations
     * 
     * กำหนด TTL (Time To Live) สำหรับแต่ละ Cache:
     * - payments: 5 นาที (ข้อมูลอัพเดทบ่อย)
     * - merchants: 30 นาที (ข้อมูลไม่ค่อยเปลี่ยน)
     * - dashboard-stats: 1 นาที (real-time statistics)
     * - payment-summary: 10 นาที
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Default Configuration
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer())
            )
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer(redisObjectMapper())
                )
            )
            .prefixCacheNameWith("payment-gateway::")
            .disableCachingNullValues();

        // Custom TTL สำหรับแต่ละ Cache
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // Cache สำหรับ Payment - TTL 5 นาที
        cacheConfigurations.put("payments", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        
        // Cache สำหรับ Payment by Reference ID - TTL 5 นาที
        cacheConfigurations.put("payment-by-ref", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        
        // Cache สำหรับ Merchant - TTL 30 นาที
        cacheConfigurations.put("merchants", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        
        // Cache สำหรับ Merchant by API Key - TTL 30 นาที  
        cacheConfigurations.put("merchant-by-apikey", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        
        // Cache สำหรับ Dashboard Stats - TTL 1 นาที (ต้องการ real-time)
        cacheConfigurations.put("dashboard-stats", defaultConfig.entryTtl(Duration.ofMinutes(1)));
        
        // Cache สำหรับ Payment Summary List - TTL 2 นาที
        cacheConfigurations.put("payment-list", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        
        // Cache สำหรับ Transactions - TTL 5 นาที
        cacheConfigurations.put("transactions", defaultConfig.entryTtl(Duration.ofMinutes(5)));

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .transactionAware()
            .build();
    }
}

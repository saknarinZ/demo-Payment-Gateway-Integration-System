package com.payment.gateway.dto;

import java.util.List;

/**
 * PageResponse - DTO สำหรับ Pagination Response
 * 
 * ใช้ Java Record สำหรับ Immutable DTO
 * Generic Type สำหรับรองรับข้อมูลหลายประเภท
 */
public record PageResponse<T>(
    
    /**
     * รายการข้อมูล
     */
    List<T> content,
    
    /**
     * หน้าปัจจุบัน (0-based)
     */
    int page,
    
    /**
     * จำนวนข้อมูลต่อหน้า
     */
    int size,
    
    /**
     * จำนวนข้อมูลทั้งหมด
     */
    long totalElements,
    
    /**
     * จำนวนหน้าทั้งหมด
     */
    int totalPages,
    
    /**
     * เป็นหน้าแรกหรือไม่
     */
    boolean first,
    
    /**
     * เป็นหน้าสุดท้ายหรือไม่
     */
    boolean last
) {}

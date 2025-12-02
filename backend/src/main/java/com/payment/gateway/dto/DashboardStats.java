package com.payment.gateway.dto;

import java.math.BigDecimal;
import java.util.Map;

/**
 * DashboardStats - DTO สำหรับข้อมูลสถิติบน Dashboard
 * 
 * ใช้ Java Record สำหรับ Immutable DTO
 */
public record DashboardStats(
    
    /**
     * จำนวน Payment ทั้งหมด
     */
    long totalPayments,
    
    /**
     * จำนวน Payment ที่รอดำเนินการ
     */
    long pendingPayments,
    
    /**
     * จำนวน Payment ที่สำเร็จ
     */
    long completedPayments,
    
    /**
     * จำนวน Payment ที่ล้มเหลว
     */
    long failedPayments,
    
    /**
     * ยอดรวมที่ชำระสำเร็จ
     */
    BigDecimal totalAmount,
    
    /**
     * ยอดรวมวันนี้
     */
    BigDecimal todayAmount,
    
    /**
     * จำนวน Payment วันนี้
     */
    long todayPayments,
    
    /**
     * สถิติแยกตามวิธีชำระเงิน
     */
    Map<String, Long> paymentMethodStats,
    
    /**
     * สถิติแยกตามสถานะ
     */
    Map<String, Long> statusStats
) {}

package com.payment.gateway.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * RefundRequest - DTO สำหรับขอคืนเงิน
 * 
 * ใช้ Java Record สำหรับ Immutable DTO
 */
public record RefundRequest(
    
    /**
     * Payment Reference ID ที่ต้องการคืนเงิน
     */
    @NotBlank(message = "Reference ID is required")
    String referenceId,
    
    /**
     * จำนวนเงินที่ต้องการคืน (null = คืนทั้งหมด)
     */
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Amount format is invalid")
    BigDecimal amount,
    
    /**
     * เหตุผลในการคืนเงิน
     */
    @NotBlank(message = "Reason is required")
    @Size(max = 500, message = "Reason must not exceed 500 characters")
    String reason
) {}

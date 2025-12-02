package com.payment.gateway.dto;

import com.payment.gateway.entity.PaymentMethod;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * CreatePaymentRequest - DTO สำหรับสร้าง Payment ใหม่
 * 
 * ใช้ Java Record สำหรับ Immutable DTO
 * รวม Validation Annotations
 */
public record CreatePaymentRequest(
    
    /**
     * Order ID จากร้านค้า
     */
    @NotBlank(message = "Order ID is required")
    @Size(max = 100, message = "Order ID must not exceed 100 characters")
    String orderId,
    
    /**
     * จำนวนเงินที่ต้องชำระ
     */
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Amount format is invalid")
    BigDecimal amount,
    
    /**
     * สกุลเงิน (default: THB)
     */
    @Size(min = 3, max = 3, message = "Currency must be 3 characters")
    String currency,
    
    /**
     * วิธีการชำระเงิน
     */
    PaymentMethod paymentMethod,
    
    /**
     * รายละเอียดสินค้า/บริการ
     */
    @Size(max = 500, message = "Description must not exceed 500 characters")
    String description,
    
    /**
     * ชื่อลูกค้า
     */
    @Size(max = 255, message = "Customer name must not exceed 255 characters")
    String customerName,
    
    /**
     * อีเมลลูกค้า
     */
    @Email(message = "Customer email format is invalid")
    @Size(max = 255, message = "Customer email must not exceed 255 characters")
    String customerEmail,
    
    /**
     * เบอร์โทรลูกค้า
     */
    @Size(max = 20, message = "Customer phone must not exceed 20 characters")
    String customerPhone,
    
    /**
     * Metadata เพิ่มเติม (JSON)
     */
    String metadata,
    
    /**
     * URL สำหรับ Redirect กลับหลังชำระเงิน
     */
    @Size(max = 500, message = "Return URL must not exceed 500 characters")
    String returnUrl,
    
    /**
     * URL สำหรับ Redirect กลับเมื่อยกเลิก
     */
    @Size(max = 500, message = "Cancel URL must not exceed 500 characters")
    String cancelUrl
) {
    /**
     * Constructor พร้อมค่า Default
     */
    public CreatePaymentRequest {
        if (currency == null || currency.isBlank()) {
            currency = "THB";
        }
    }
}

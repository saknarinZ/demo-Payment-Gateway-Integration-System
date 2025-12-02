package com.payment.gateway.entity;

/**
 * Payment Method Enum - วิธีการชำระเงิน
 * 
 * กำหนดวิธีการชำระเงินที่รองรับ
 */
public enum PaymentMethod {
    
    /**
     * บัตรเครดิต/เดบิต
     */
    CREDIT_CARD,
    
    /**
     * บัตรเดบิต
     */
    DEBIT_CARD,
    
    /**
     * โอนผ่านธนาคาร
     */
    BANK_TRANSFER,
    
    /**
     * QR Code PromptPay
     */
    PROMPTPAY,
    
    /**
     * Mobile Banking
     */
    MOBILE_BANKING,
    
    /**
     * E-Wallet (TrueMoney, Rabbit LINE Pay, etc.)
     */
    E_WALLET,
    
    /**
     * ผ่อนชำระ
     */
    INSTALLMENT,
    
    /**
     * เก็บเงินปลายทาง
     */
    CASH_ON_DELIVERY
}

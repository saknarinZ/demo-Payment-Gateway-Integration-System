-- =============================================================================
-- Payment Gateway Database Schema
-- SQL Script สำหรับ Initialize Payment Gateway Database
-- จะถูก Execute อัตโนมัติเมื่อ MySQL Container เริ่มต้นครั้งแรก
-- =============================================================================

-- สร้าง Database (ถ้ายังไม่มี)
CREATE DATABASE IF NOT EXISTS payment_gateway
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- ใช้งาน Database
USE payment_gateway;

-- =============================================================================
-- Grant Permissions สำหรับ Application User
-- =============================================================================

-- ให้สิทธิ์ทั้งหมดแก่ payment_user บน payment_gateway database
GRANT ALL PRIVILEGES ON payment_gateway.* TO 'payment_user'@'%';
FLUSH PRIVILEGES;

-- =============================================================================
-- Table: merchants (ร้านค้า/ผู้ขาย)
-- เก็บข้อมูล Merchant ที่ใช้งานระบบ Payment Gateway
-- =============================================================================
CREATE TABLE IF NOT EXISTS merchants (
    -- Primary Key
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- ข้อมูลพื้นฐาน
    name VARCHAR(255) NOT NULL COMMENT 'ชื่อร้านค้า/บริษัท',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT 'อีเมลสำหรับติดต่อ',
    
    -- API Credentials
    api_key VARCHAR(64) NOT NULL UNIQUE COMMENT 'API Key สำหรับ Authentication',
    webhook_url VARCHAR(500) NULL COMMENT 'URL สำหรับรับ Webhook Notifications',
    webhook_secret VARCHAR(64) NOT NULL COMMENT 'Secret Key สำหรับ HMAC Signature',
    
    -- สถานะ
    active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'สถานะการใช้งาน',
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้าง',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่อัพเดทล่าสุด',
    
    -- Indexes
    INDEX idx_merchants_api_key (api_key),
    INDEX idx_merchants_email (email),
    INDEX idx_merchants_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางเก็บข้อมูล Merchant ผู้ใช้งานระบบ';

-- =============================================================================
-- Table: payments (การชำระเงิน)
-- เก็บข้อมูล Payment Transactions หลัก
-- =============================================================================
CREATE TABLE IF NOT EXISTS payments (
    -- Primary Key
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Reference ID (สำหรับอ้างอิงภายนอก)
    reference_id VARCHAR(36) NOT NULL UNIQUE COMMENT 'UUID สำหรับอ้างอิง Payment',
    
    -- Foreign Key
    merchant_id BIGINT NOT NULL COMMENT 'ID ของ Merchant เจ้าของ Payment',
    
    -- ข้อมูลการชำระเงิน
    amount DECIMAL(15, 2) NOT NULL COMMENT 'จำนวนเงิน',
    currency VARCHAR(3) NOT NULL DEFAULT 'THB' COMMENT 'สกุลเงิน (ISO 4217)',
    
    -- สถานะ Payment
    status ENUM(
        'PENDING',      -- รอดำเนินการ
        'PROCESSING',   -- กำลังดำเนินการ
        'COMPLETED',    -- สำเร็จ
        'FAILED',       -- ล้มเหลว
        'CANCELLED',    -- ยกเลิก
        'REFUNDED'      -- คืนเงินแล้ว
    ) NOT NULL DEFAULT 'PENDING' COMMENT 'สถานะการชำระเงิน',
    
    -- วิธีการชำระเงิน
    payment_method ENUM(
        'CREDIT_CARD',   -- บัตรเครดิต
        'DEBIT_CARD',    -- บัตรเดบิต
        'BANK_TRANSFER', -- โอนเงินธนาคาร
        'QR_CODE',       -- QR Code (PromptPay)
        'E_WALLET'       -- E-Wallet
    ) NOT NULL DEFAULT 'CREDIT_CARD' COMMENT 'วิธีการชำระเงิน',
    
    -- ข้อมูลลูกค้า
    customer_name VARCHAR(255) NOT NULL COMMENT 'ชื่อลูกค้า',
    customer_email VARCHAR(255) NOT NULL COMMENT 'อีเมลลูกค้า',
    
    -- ข้อมูลเพิ่มเติม
    description VARCHAR(500) NULL COMMENT 'รายละเอียดการชำระเงิน',
    callback_url VARCHAR(500) NULL COMMENT 'URL สำหรับ Callback หลังชำระเงิน',
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้าง',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่อัพเดทล่าสุด',
    completed_at TIMESTAMP NULL COMMENT 'วันที่ชำระเงินสำเร็จ',
    
    -- Foreign Key Constraints
    CONSTRAINT fk_payments_merchant 
        FOREIGN KEY (merchant_id) REFERENCES merchants(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Indexes
    INDEX idx_payments_reference_id (reference_id),
    INDEX idx_payments_merchant_id (merchant_id),
    INDEX idx_payments_status (status),
    INDEX idx_payments_created_at (created_at),
    INDEX idx_payments_customer_email (customer_email),
    INDEX idx_payments_merchant_status (merchant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางเก็บข้อมูลการชำระเงิน';

-- =============================================================================
-- Table: transactions (ธุรกรรม)
-- เก็บข้อมูล Transaction ย่อยของแต่ละ Payment
-- =============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    -- Primary Key
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Transaction ID (สำหรับอ้างอิงภายนอก)
    transaction_id VARCHAR(36) NOT NULL UNIQUE COMMENT 'UUID สำหรับอ้างอิง Transaction',
    
    -- Foreign Key
    payment_id BIGINT NOT NULL COMMENT 'ID ของ Payment ที่เกี่ยวข้อง',
    
    -- ประเภท Transaction
    type ENUM(
        'CHARGE',  -- เรียกเก็บเงิน
        'REFUND',  -- คืนเงิน
        'VOID'     -- ยกเลิก
    ) NOT NULL COMMENT 'ประเภทธุรกรรม',
    
    -- จำนวนเงิน
    amount DECIMAL(15, 2) NOT NULL COMMENT 'จำนวนเงินของธุรกรรม',
    
    -- สถานะ Transaction
    status ENUM(
        'PENDING',  -- รอดำเนินการ
        'SUCCESS',  -- สำเร็จ
        'FAILED'    -- ล้มเหลว
    ) NOT NULL DEFAULT 'PENDING' COMMENT 'สถานะธุรกรรม',
    
    -- ข้อมูลจาก Payment Gateway
    gateway_reference VARCHAR(100) NULL COMMENT 'Reference ID จาก Payment Gateway ภายนอก',
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้าง',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่อัพเดทล่าสุด',
    
    -- Foreign Key Constraints
    CONSTRAINT fk_transactions_payment 
        FOREIGN KEY (payment_id) REFERENCES payments(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Indexes
    INDEX idx_transactions_transaction_id (transaction_id),
    INDEX idx_transactions_payment_id (payment_id),
    INDEX idx_transactions_type (type),
    INDEX idx_transactions_status (status),
    INDEX idx_transactions_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางเก็บข้อมูลธุรกรรมย่อยของแต่ละ Payment';

-- =============================================================================
-- Table: webhook_logs (บันทึก Webhook)
-- เก็บ Log ของ Webhook ที่ส่งออกไป
-- =============================================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
    -- Primary Key
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Foreign Keys
    merchant_id BIGINT NOT NULL COMMENT 'ID ของ Merchant ที่รับ Webhook',
    payment_id BIGINT NOT NULL COMMENT 'ID ของ Payment ที่เกี่ยวข้อง',
    
    -- Webhook Data
    event_type VARCHAR(50) NOT NULL COMMENT 'ประเภท Event (payment.completed, payment.failed, etc.)',
    payload JSON NOT NULL COMMENT 'Payload ที่ส่งไป (JSON)',
    signature VARCHAR(128) NOT NULL COMMENT 'HMAC-SHA256 Signature',
    
    -- Response
    response_status INT NULL COMMENT 'HTTP Status Code ที่ได้รับกลับ',
    response_body TEXT NULL COMMENT 'Response Body ที่ได้รับกลับ',
    
    -- สถานะการส่ง
    status ENUM(
        'PENDING',   -- รอส่ง
        'SENT',      -- ส่งแล้ว
        'DELIVERED', -- ส่งสำเร็จ (2xx response)
        'FAILED',    -- ส่งล้มเหลว
        'RETRYING'   -- กำลัง Retry
    ) NOT NULL DEFAULT 'PENDING' COMMENT 'สถานะการส่ง Webhook',
    
    -- Retry Information
    retry_count INT NOT NULL DEFAULT 0 COMMENT 'จำนวนครั้งที่ Retry',
    next_retry_at TIMESTAMP NULL COMMENT 'เวลาที่จะ Retry ครั้งถัดไป',
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้าง',
    sent_at TIMESTAMP NULL COMMENT 'วันที่ส่ง',
    
    -- Foreign Key Constraints
    CONSTRAINT fk_webhook_logs_merchant 
        FOREIGN KEY (merchant_id) REFERENCES merchants(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_webhook_logs_payment 
        FOREIGN KEY (payment_id) REFERENCES payments(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Indexes
    INDEX idx_webhook_logs_merchant_id (merchant_id),
    INDEX idx_webhook_logs_payment_id (payment_id),
    INDEX idx_webhook_logs_status (status),
    INDEX idx_webhook_logs_event_type (event_type),
    INDEX idx_webhook_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางเก็บ Log การส่ง Webhook';

-- =============================================================================
-- Table: audit_logs (บันทึกการเปลี่ยนแปลง)
-- เก็บ Audit Trail ของการเปลี่ยนแปลงข้อมูลสำคัญ
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    -- Primary Key
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- ข้อมูลการเปลี่ยนแปลง
    entity_type VARCHAR(50) NOT NULL COMMENT 'ประเภท Entity (Payment, Merchant, etc.)',
    entity_id BIGINT NOT NULL COMMENT 'ID ของ Entity',
    action VARCHAR(20) NOT NULL COMMENT 'การกระทำ (CREATE, UPDATE, DELETE)',
    
    -- รายละเอียด
    old_value JSON NULL COMMENT 'ค่าเดิมก่อนเปลี่ยน (JSON)',
    new_value JSON NULL COMMENT 'ค่าใหม่หลังเปลี่ยน (JSON)',
    
    -- ผู้ทำรายการ
    performed_by VARCHAR(100) NULL COMMENT 'ผู้ทำรายการ (User/System)',
    ip_address VARCHAR(45) NULL COMMENT 'IP Address ของผู้ทำรายการ',
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่ทำรายการ',
    
    -- Indexes
    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางเก็บ Audit Trail การเปลี่ยนแปลงข้อมูล';

-- =============================================================================
-- Insert Default Data (ข้อมูลเริ่มต้น)
-- =============================================================================

-- สร้าง Default Merchant สำหรับ Testing
INSERT INTO merchants (name, email, api_key, webhook_url, webhook_secret, active)
VALUES 
    (
        'Test Merchant',
        'test@merchant.com',
        'pk_test_1234567890abcdef1234567890abcdef12345678',
        'http://localhost:3000/webhook',
        'sk_test_abcdef1234567890abcdef1234567890abcdef12',
        TRUE
    ),
    (
        'Demo Shop',
        'demo@shop.com',
        'pk_demo_abcdefghijklmnopqrstuvwxyz123456789012',
        NULL,
        'sk_demo_zyxwvutsrqponmlkjihgfedcba987654321098',
        TRUE
    )
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- สร้าง Sample Payments สำหรับ Testing
INSERT INTO payments (reference_id, merchant_id, amount, currency, status, payment_method, customer_name, customer_email, description)
VALUES
    (
        UUID(),
        1,
        1500.00,
        'THB',
        'COMPLETED',
        'CREDIT_CARD',
        'สมชาย ใจดี',
        'somchai@email.com',
        'ซื้อสินค้าออนไลน์'
    ),
    (
        UUID(),
        1,
        2500.50,
        'THB',
        'COMPLETED',
        'QR_CODE',
        'สมหญิง รักดี',
        'somying@email.com',
        'ค่าบริการรายเดือน'
    ),
    (
        UUID(),
        1,
        899.00,
        'THB',
        'PENDING',
        'BANK_TRANSFER',
        'มานะ ทำดี',
        'mana@email.com',
        'สั่งซื้อหนังสือ'
    ),
    (
        UUID(),
        2,
        5000.00,
        'THB',
        'COMPLETED',
        'E_WALLET',
        'วิชัย เก่งกาจ',
        'wichai@email.com',
        'ค่าสมัครสมาชิกรายปี'
    ),
    (
        UUID(),
        1,
        350.00,
        'THB',
        'CANCELLED',
        'CREDIT_CARD',
        'สุดา น่ารัก',
        'suda@email.com',
        'ยกเลิกโดยลูกค้า'
    ),
    (
        UUID(),
        2,
        1200.00,
        'THB',
        'REFUNDED',
        'DEBIT_CARD',
        'ประเสริฐ ยอดเยี่ยม',
        'prasert@email.com',
        'คืนเงินตามคำร้องขอ'
    )
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- สร้าง Sample Transactions สำหรับ Testing
INSERT INTO transactions (transaction_id, payment_id, type, amount, status, gateway_reference)
SELECT 
    UUID(),
    p.id,
    'CHARGE',
    p.amount,
    CASE 
        WHEN p.status = 'COMPLETED' THEN 'SUCCESS'
        WHEN p.status IN ('CANCELLED', 'FAILED') THEN 'FAILED'
        ELSE 'PENDING'
    END,
    CONCAT('GW_', UPPER(SUBSTRING(MD5(RAND()), 1, 16)))
FROM payments p
WHERE NOT EXISTS (
    SELECT 1 FROM transactions t WHERE t.payment_id = p.id
);

-- สร้าง Refund Transaction สำหรับ Payment ที่ถูก Refund
INSERT INTO transactions (transaction_id, payment_id, type, amount, status, gateway_reference)
SELECT 
    UUID(),
    p.id,
    'REFUND',
    p.amount,
    'SUCCESS',
    CONCAT('RF_', UPPER(SUBSTRING(MD5(RAND()), 1, 16)))
FROM payments p
WHERE p.status = 'REFUNDED'
AND NOT EXISTS (
    SELECT 1 FROM transactions t WHERE t.payment_id = p.id AND t.type = 'REFUND'
);

-- =============================================================================
-- Views (มุมมองข้อมูล)
-- =============================================================================

-- View: รายงานสรุป Payment ตาม Merchant
CREATE OR REPLACE VIEW vw_merchant_payment_summary AS
SELECT 
    m.id AS merchant_id,
    m.name AS merchant_name,
    COUNT(p.id) AS total_payments,
    SUM(CASE WHEN p.status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN p.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
    SUM(CASE WHEN p.status = 'FAILED' THEN 1 ELSE 0 END) AS failed_count,
    SUM(CASE WHEN p.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count,
    SUM(CASE WHEN p.status = 'REFUNDED' THEN 1 ELSE 0 END) AS refunded_count,
    COALESCE(SUM(CASE WHEN p.status = 'COMPLETED' THEN p.amount ELSE 0 END), 0) AS total_completed_amount,
    COALESCE(SUM(CASE WHEN p.status = 'REFUNDED' THEN p.amount ELSE 0 END), 0) AS total_refunded_amount
FROM merchants m
LEFT JOIN payments p ON m.id = p.merchant_id
GROUP BY m.id, m.name;

-- View: รายงานสรุป Payment รายวัน
CREATE OR REPLACE VIEW vw_daily_payment_summary AS
SELECT 
    DATE(p.created_at) AS payment_date,
    COUNT(*) AS total_payments,
    SUM(CASE WHEN p.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
    SUM(CASE WHEN p.status = 'COMPLETED' THEN p.amount ELSE 0 END) AS total_amount,
    COUNT(DISTINCT p.merchant_id) AS active_merchants
FROM payments p
GROUP BY DATE(p.created_at)
ORDER BY payment_date DESC;

-- View: Payment พร้อมข้อมูล Merchant
CREATE OR REPLACE VIEW vw_payment_details AS
SELECT 
    p.id,
    p.reference_id,
    p.amount,
    p.currency,
    p.status,
    p.payment_method,
    p.customer_name,
    p.customer_email,
    p.description,
    p.created_at,
    p.completed_at,
    m.id AS merchant_id,
    m.name AS merchant_name,
    m.email AS merchant_email
FROM payments p
JOIN merchants m ON p.merchant_id = m.id;

-- =============================================================================
-- Stored Procedures (กระบวนการจัดเก็บ)
-- =============================================================================

-- Procedure: ดึงสถิติ Dashboard
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_get_dashboard_stats(IN p_merchant_id BIGINT)
BEGIN
    SELECT 
        COUNT(*) AS total_payments,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_payments,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_payments,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_payments,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_payments,
        SUM(CASE WHEN status = 'REFUNDED' THEN 1 ELSE 0 END) AS refunded_payments,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END), 0) AS total_amount,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS today_payments,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) AS today_amount
    FROM payments
    WHERE (p_merchant_id IS NULL OR merchant_id = p_merchant_id);
END //
DELIMITER ;

-- Procedure: สร้าง Payment ใหม่
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_create_payment(
    IN p_merchant_id BIGINT,
    IN p_amount DECIMAL(15, 2),
    IN p_currency VARCHAR(3),
    IN p_payment_method VARCHAR(20),
    IN p_customer_name VARCHAR(255),
    IN p_customer_email VARCHAR(255),
    IN p_description VARCHAR(500),
    IN p_callback_url VARCHAR(500),
    OUT p_reference_id VARCHAR(36)
)
BEGIN
    SET p_reference_id = UUID();
    
    INSERT INTO payments (
        reference_id, merchant_id, amount, currency, payment_method,
        customer_name, customer_email, description, callback_url
    ) VALUES (
        p_reference_id, p_merchant_id, p_amount, p_currency, p_payment_method,
        p_customer_name, p_customer_email, p_description, p_callback_url
    );
    
    SELECT p_reference_id AS reference_id;
END //
DELIMITER ;

-- =============================================================================
-- Events (งานตั้งเวลา)
-- =============================================================================

-- เปิดใช้งาน Event Scheduler
SET GLOBAL event_scheduler = ON;

-- Event: ลบ Audit Logs เก่ากว่า 90 วัน (รันทุกวัน)
DELIMITER //
CREATE EVENT IF NOT EXISTS evt_cleanup_old_audit_logs
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
END //
DELIMITER ;

-- Event: ลบ Webhook Logs ที่สำเร็จแล้วเก่ากว่า 30 วัน
DELIMITER //
CREATE EVENT IF NOT EXISTS evt_cleanup_old_webhook_logs
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM webhook_logs 
    WHERE status = 'DELIVERED' 
    AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
END //
DELIMITER ;

-- =============================================================================
-- เสร็จสิ้นการติดตั้ง Database
-- =============================================================================
SELECT 'Payment Gateway Database initialized successfully!' AS message;
SELECT 
    (SELECT COUNT(*) FROM merchants) AS merchants_count,
    (SELECT COUNT(*) FROM payments) AS payments_count,
    (SELECT COUNT(*) FROM transactions) AS transactions_count;

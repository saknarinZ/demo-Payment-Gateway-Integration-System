/**
 * Payment Models - TypeScript Interfaces
 *
 * ตรงกับ Backend DTOs
 * ใช้สำหรับ Type Safety
 */

/**
 * Payment Status - สถานะการชำระเงิน
 */
export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

/**
 * Payment Method - วิธีการชำระเงิน
 */
export type PaymentMethod =
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "BANK_TRANSFER"
  | "QR_CODE"
  | "E_WALLET";

/**
 * Transaction Type - ประเภทธุรกรรม
 */
export type TransactionType = "CHARGE" | "REFUND" | "VOID";

/**
 * Transaction Status - สถานะธุรกรรม
 */
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

/**
 * Create Payment Request - ข้อมูลสำหรับสร้าง Payment
 */
export interface CreatePaymentRequest {
  merchantId: number;
  amount: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
  description?: string;
  customerName: string;
  customerEmail: string;
  callbackUrl?: string;
}

/**
 * Payment Response - ข้อมูล Payment ที่ได้รับกลับ
 */
export interface PaymentResponse {
  id: number;
  referenceId: string;
  merchantId: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  description: string | null;
  customerName: string;
  customerEmail: string;
  callbackUrl: string | null;
  createdAt: string;
  completedAt: string | null;
  transactions: TransactionResponse[];
}

/**
 * Payment Summary - ข้อมูลสรุป Payment (สำหรับแสดงในรายการ)
 */
export interface PaymentSummary {
  id: number;
  referenceId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerName: string | null;
  createdAt: string;
}

/**
 * Transaction Response - ข้อมูล Transaction
 */
export interface TransactionResponse {
  id: number;
  transactionId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  gatewayReference: string | null;
  createdAt: string;
}

/**
 * Refund Request - ข้อมูลสำหรับขอคืนเงิน
 */
export interface RefundRequest {
  referenceId: string;
  amount: number;
  reason: string;
}

/**
 * Page Response - Pagination Response
 */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * Dashboard Stats - สถิติสำหรับ Dashboard
 */
export interface DashboardStats {
  totalPayments: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  cancelledPayments: number;
  refundedPayments: number;
  totalAmount: number;
  todayPayments: number;
  todayAmount: number;
}

/**
 * Merchant Response - ข้อมูล Merchant
 */
export interface MerchantResponse {
  id: number;
  name: string;
  email: string;
  apiKey: string;
  webhookUrl: string | null;
  webhookSecret: string;
  active: boolean;
  createdAt: string;
}

/**
 * Create Merchant Request - ข้อมูลสำหรับสร้าง Merchant
 */
export interface CreateMerchantRequest {
  name: string;
  email: string;
  webhookUrl?: string;
}

/**
 * API Health Response - ข้อมูลสถานะ API
 */
export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  virtualThreads: string;
}

/**
 * Problem Detail - Error Response (RFC 7807)
 */
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errorCode?: string;
  errors?: Record<string, string>;
  timestamp?: string;
}

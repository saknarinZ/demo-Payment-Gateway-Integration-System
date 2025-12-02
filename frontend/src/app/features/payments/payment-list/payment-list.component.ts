/**
 * Payment List Component
 *
 * Component สำหรับแสดงรายการ Payments ทั้งหมด
 * รองรับ Pagination และ Filter ตาม Status
 * ใช้ Signals Architecture และ New Control Flow
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { PaymentService } from "@core/services/payment.service";
import { PaymentResponse, PaymentStatus } from "@core/models/payment.model";

/**
 * PaymentListComponent - แสดงรายการ Payment ทั้งหมด
 *
 * Features:
 * - แสดงรายการ Payment ในรูปแบบ Table
 * - Filter ตาม Status (PENDING, COMPLETED, CANCELLED, etc.)
 * - Pagination สำหรับข้อมูลจำนวนมาก
 * - Actions: View Detail, Complete, Cancel
 */
@Component({
  selector: "app-payment-list",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="payment-list-container">
      <!-- Header Section -->
      <header class="page-header">
        <div class="header-left">
          <h1 class="page-title">รายการ Payment</h1>
          <p class="page-subtitle">
            ทั้งหมด {{ paymentService.totalElements() }} รายการ
          </p>
        </div>
        <div class="header-right">
          <a routerLink="/create-payment" class="btn btn-primary">
            + สร้าง Payment ใหม่
          </a>
        </div>
      </header>

      <!-- Filter Section -->
      <section class="filter-section">
        <div class="filter-group">
          <label class="filter-label">Filter by Status:</label>
          <select
            class="filter-select"
            [ngModel]="selectedStatus()"
            (ngModelChange)="onStatusFilterChange($event)"
          >
            <option value="">ทั้งหมด</option>
            @for (status of statusOptions; track status) {
            <option [value]="status">{{ getStatusLabel(status) }}</option>
            }
          </select>
        </div>

        <div class="filter-group">
          <button class="btn btn-secondary" (click)="refreshPayments()">
            🔄 รีเฟรช
          </button>
        </div>
      </section>

      <!-- Loading State -->
      @if (paymentService.loading()) {
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
      }

      <!-- Error State -->
      @if (paymentService.error()) {
      <div class="error-container">
        <p class="error-message">❌ {{ paymentService.error() }}</p>
        <button class="btn btn-primary" (click)="refreshPayments()">
          ลองใหม่อีกครั้ง
        </button>
      </div>
      }

      <!-- Payment Table -->
      @if (!paymentService.loading() && !paymentService.error()) { @if
      (paymentService.payments().length > 0) {
      <div class="table-container">
        <table class="payment-table">
          <thead>
            <tr>
              <th>Reference ID</th>
              <th>ชื่อลูกค้า</th>
              <th>จำนวนเงิน</th>
              <th>วิธีชำระเงิน</th>
              <th>สถานะ</th>
              <th>วันที่สร้าง</th>
              <th>การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            @for (payment of paymentService.payments(); track
            payment.referenceId) {
            <tr>
              <td class="ref-id">
                <a [routerLink]="['/payments', payment.referenceId]">
                  {{ payment.referenceId }}
                </a>
              </td>
              <td>{{ payment.customerName }}</td>
              <td class="amount">
                {{ formatAmount(payment.amount, payment.currency) }}
              </td>
              <td>
                <span class="method-badge">
                  {{ getPaymentMethodLabel(payment.paymentMethod) }}
                </span>
              </td>
              <td>
                <span
                  class="status-badge"
                  [class]="'status-' + payment.status.toLowerCase()"
                >
                  {{ getStatusLabel(payment.status) }}
                </span>
              </td>
              <td>{{ formatDate(payment.createdAt) }}</td>
              <td class="actions">
                <a
                  [routerLink]="['/payments', payment.referenceId]"
                  class="btn btn-sm btn-outline"
                  title="ดูรายละเอียด"
                >
                  👁️
                </a>
                @if (payment.status === 'PENDING') {
                <button
                  class="btn btn-sm btn-success"
                  (click)="completePayment(payment.referenceId)"
                  title="ยืนยันการชำระเงิน"
                >
                  ✓
                </button>
                <button
                  class="btn btn-sm btn-danger"
                  (click)="cancelPayment(payment.referenceId)"
                  title="ยกเลิก"
                >
                  ✕
                </button>
                }
              </td>
            </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (paymentService.totalPages() > 1) {
      <div class="pagination">
        <button
          class="btn btn-sm btn-outline"
          [disabled]="paymentService.currentPage() === 0"
          (click)="goToPage(paymentService.currentPage() - 1)"
        >
          ← ก่อนหน้า
        </button>

        <div class="page-info">
          หน้า {{ paymentService.currentPage() + 1 }} จาก
          {{ paymentService.totalPages() }}
        </div>

        <button
          class="btn btn-sm btn-outline"
          [disabled]="
            paymentService.currentPage() >= paymentService.totalPages() - 1
          "
          (click)="goToPage(paymentService.currentPage() + 1)"
        >
          ถัดไป →
        </button>
      </div>
      } } @else {
      <!-- Empty State -->
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>ไม่พบข้อมูล Payment</h3>
        <p>ยังไม่มีรายการ Payment ในระบบ</p>
        <a routerLink="/create-payment" class="btn btn-primary">
          สร้าง Payment แรก
        </a>
      </div>
      } }
    </div>
  `,
  styles: [
    `
      /* Container */
      .payment-list-container {
        padding: var(--spacing-4);
      }

      /* Header */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-6);
      }

      .page-title {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--color-gray-900);
        margin: 0;
      }

      .page-subtitle {
        font-size: var(--font-size-sm);
        color: var(--color-gray-500);
        margin: var(--spacing-1) 0 0 0;
      }

      /* Filter Section */
      .filter-section {
        display: flex;
        gap: var(--spacing-4);
        align-items: center;
        margin-bottom: var(--spacing-4);
        padding: var(--spacing-4);
        background-color: var(--color-gray-50);
        border-radius: var(--radius-lg);
      }

      .filter-group {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
      }

      .filter-label {
        font-size: var(--font-size-sm);
        font-weight: 500;
        color: var(--color-gray-700);
      }

      .filter-select {
        padding: var(--spacing-2) var(--spacing-3);
        border: 1px solid var(--color-gray-300);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        min-width: 150px;

        &:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }
      }

      /* Loading */
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-12);
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--color-gray-200);
        border-top-color: var(--color-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Error */
      .error-container {
        text-align: center;
        padding: var(--spacing-8);
        background-color: var(--color-error-bg);
        border-radius: var(--radius-lg);
      }

      .error-message {
        color: var(--color-error);
        margin-bottom: var(--spacing-4);
      }

      /* Table */
      .table-container {
        overflow-x: auto;
        background-color: var(--color-white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
      }

      .payment-table {
        width: 100%;
        border-collapse: collapse;

        th,
        td {
          padding: var(--spacing-3) var(--spacing-4);
          text-align: left;
          border-bottom: 1px solid var(--color-gray-100);
        }

        th {
          font-weight: 600;
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          background-color: var(--color-gray-50);
        }

        td {
          font-size: var(--font-size-sm);
          color: var(--color-gray-900);
        }

        tbody tr:hover {
          background-color: var(--color-gray-50);
        }
      }

      .ref-id a {
        color: var(--color-primary);
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }

      .amount {
        font-weight: 600;
        font-family: var(--font-family-mono);
      }

      /* Status Badge */
      .status-badge {
        display: inline-block;
        padding: var(--spacing-1) var(--spacing-2);
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        font-weight: 500;

        &.status-pending {
          background-color: var(--color-warning-bg);
          color: var(--color-warning);
        }

        &.status-processing {
          background-color: var(--color-info-bg);
          color: var(--color-info);
        }

        &.status-completed {
          background-color: var(--color-success-bg);
          color: var(--color-success);
        }

        &.status-failed {
          background-color: var(--color-error-bg);
          color: var(--color-error);
        }

        &.status-cancelled {
          background-color: var(--color-gray-100);
          color: var(--color-gray-600);
        }

        &.status-refunded {
          background-color: var(--color-gray-100);
          color: var(--color-gray-600);
        }
      }

      /* Method Badge */
      .method-badge {
        display: inline-block;
        padding: var(--spacing-1) var(--spacing-2);
        background-color: var(--color-gray-100);
        border-radius: var(--radius-md);
        font-size: var(--font-size-xs);
        font-weight: 500;
        color: var(--color-gray-700);
      }

      /* Actions */
      .actions {
        display: flex;
        gap: var(--spacing-2);
      }

      /* Buttons */
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-2) var(--spacing-4);
        border: none;
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-fast);
        text-decoration: none;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-sm {
        padding: var(--spacing-1) var(--spacing-2);
        font-size: var(--font-size-xs);
      }

      .btn-primary {
        background-color: var(--color-primary);
        color: var(--color-white);

        &:hover:not(:disabled) {
          background-color: var(--color-primary-dark);
        }
      }

      .btn-secondary {
        background-color: var(--color-gray-100);
        color: var(--color-gray-700);

        &:hover:not(:disabled) {
          background-color: var(--color-gray-200);
        }
      }

      .btn-outline {
        background-color: transparent;
        border: 1px solid var(--color-gray-300);
        color: var(--color-gray-700);

        &:hover:not(:disabled) {
          background-color: var(--color-gray-50);
        }
      }

      .btn-success {
        background-color: var(--color-success);
        color: var(--color-white);

        &:hover:not(:disabled) {
          background-color: #059669;
        }
      }

      .btn-danger {
        background-color: var(--color-error);
        color: var(--color-white);

        &:hover:not(:disabled) {
          background-color: #dc2626;
        }
      }

      /* Pagination */
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: var(--spacing-4);
        margin-top: var(--spacing-6);
      }

      .page-info {
        font-size: var(--font-size-sm);
        color: var(--color-gray-600);
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: var(--spacing-12);
        background-color: var(--color-white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
      }

      .empty-icon {
        font-size: 48px;
        margin-bottom: var(--spacing-4);
      }

      .empty-state h3 {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--color-gray-900);
        margin: 0 0 var(--spacing-2) 0;
      }

      .empty-state p {
        color: var(--color-gray-500);
        margin: 0 0 var(--spacing-4) 0;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--spacing-4);
        }

        .filter-section {
          flex-direction: column;
          align-items: flex-start;
        }

        .filter-select {
          width: 100%;
        }
      }
    `,
  ],
})
export class PaymentListComponent implements OnInit {
  // Inject Services
  protected readonly paymentService = inject(PaymentService);

  // Local State
  protected readonly selectedStatus = signal<PaymentStatus | "">("");

  // Status Options สำหรับ Filter
  protected readonly statusOptions: PaymentStatus[] = [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
    "REFUNDED",
  ];

  constructor() {
    // Effect: เมื่อ Status Filter เปลี่ยน ให้ reload ข้อมูล
    effect(() => {
      const status = this.selectedStatus();
      // จะถูก track โดย Angular Signals
      console.log("Status Filter Changed:", status || "ALL");
    });
  }

  ngOnInit(): void {
    // โหลดข้อมูล Payment เมื่อ Component เริ่มทำงาน
    this.loadPayments();
  }

  /**
   * โหลดรายการ Payment
   */
  private loadPayments(): void {
    const status = this.selectedStatus() || undefined;
    this.paymentService.loadPayments(0, 10, status);
  }

  /**
   * รีเฟรชข้อมูล Payment
   */
  protected refreshPayments(): void {
    this.loadPayments();
  }

  /**
   * เมื่อเปลี่ยน Status Filter
   */
  protected onStatusFilterChange(status: PaymentStatus | ""): void {
    this.selectedStatus.set(status);
    const filterStatus = status || undefined;
    this.paymentService.loadPayments(0, 10, filterStatus);
  }

  /**
   * ไปหน้าที่ระบุ
   */
  protected goToPage(page: number): void {
    const status = this.selectedStatus() || undefined;
    this.paymentService.loadPayments(page, 10, status);
  }

  /**
   * ยืนยันการชำระเงิน (Complete Payment)
   */
  protected completePayment(referenceId: string): void {
    if (confirm("ต้องการยืนยันการชำระเงินนี้หรือไม่?")) {
      this.paymentService.completePayment(referenceId);
    }
  }

  /**
   * ยกเลิก Payment
   */
  protected cancelPayment(referenceId: string): void {
    if (confirm("ต้องการยกเลิกการชำระเงินนี้หรือไม่?")) {
      this.paymentService.cancelPayment(referenceId);
    }
  }

  /**
   * Format จำนวนเงิน
   */
  protected formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: currency,
    }).format(amount);
  }

  /**
   * Format วันที่
   */
  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  /**
   * แปลง Status เป็นข้อความภาษาไทย
   */
  protected getStatusLabel(status: PaymentStatus): string {
    const statusLabels: Record<PaymentStatus, string> = {
      PENDING: "รอดำเนินการ",
      PROCESSING: "กำลังดำเนินการ",
      COMPLETED: "สำเร็จ",
      FAILED: "ล้มเหลว",
      CANCELLED: "ยกเลิก",
      REFUNDED: "คืนเงินแล้ว",
    };
    return statusLabels[status] || status;
  }

  /**
   * แปลง Payment Method เป็นข้อความภาษาไทย
   */
  protected getPaymentMethodLabel(method: string): string {
    const methodLabels: Record<string, string> = {
      CREDIT_CARD: "บัตรเครดิต",
      DEBIT_CARD: "บัตรเดบิต",
      BANK_TRANSFER: "โอนเงิน",
      QR_CODE: "QR Code",
      E_WALLET: "E-Wallet",
    };
    return methodLabels[method] || method;
  }
}

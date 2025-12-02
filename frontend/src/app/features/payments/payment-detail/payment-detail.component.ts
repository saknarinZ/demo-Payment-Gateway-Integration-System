/**
 * Payment Detail Component
 *
 * Component สำหรับแสดงรายละเอียดของ Payment
 * รวมถึงประวัติ Transactions และ Actions ต่างๆ
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
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { PaymentService } from "@core/services/payment.service";
import {
  PaymentResponse,
  TransactionResponse,
  PaymentStatus,
  TransactionType,
} from "@core/models/payment.model";

/**
 * PaymentDetailComponent - แสดงรายละเอียด Payment
 *
 * Features:
 * - แสดงข้อมูล Payment อย่างละเอียด
 * - แสดงประวัติ Transactions
 * - Actions: Complete, Cancel, Refund
 * - ใช้ Signals สำหรับ State Management
 */
@Component({
  selector: "app-payment-detail",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="payment-detail-container">
      <!-- Back Button -->
      <div class="back-nav">
        <a routerLink="/payments" class="back-link"
          >← กลับไปยังรายการ Payment</a
        >
      </div>

      <!-- Loading State -->
      @if (loading()) {
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
      }

      <!-- Error State -->
      @if (error()) {
      <div class="error-container">
        <p class="error-message">❌ {{ error() }}</p>
        <button class="btn btn-primary" (click)="loadPayment()">
          ลองใหม่อีกครั้ง
        </button>
      </div>
      }

      <!-- Payment Detail -->
      @if (payment(); as p) {
      <div class="detail-grid">
        <!-- Main Info Card -->
        <div class="card main-info">
          <div class="card-header">
            <h1 class="payment-ref">{{ p.referenceId }}</h1>
            <span
              class="status-badge"
              [class]="'status-' + p.status.toLowerCase()"
            >
              {{ getStatusLabel(p.status) }}
            </span>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="info-label">จำนวนเงิน</span>
              <span class="info-value amount">
                {{ formatAmount(p.amount, p.currency) }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">วิธีชำระเงิน</span>
              <span class="info-value">
                {{ getPaymentMethodLabel(p.paymentMethod) }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">วันที่สร้าง</span>
              <span class="info-value">{{ formatDate(p.createdAt) }}</span>
            </div>

            @if (p.completedAt) {
            <div class="info-row">
              <span class="info-label">วันที่เสร็จสิ้น</span>
              <span class="info-value">{{ formatDate(p.completedAt) }}</span>
            </div>
            }
          </div>
        </div>

        <!-- Customer Info Card -->
        <div class="card customer-info">
          <div class="card-header">
            <h2>ข้อมูลลูกค้า</h2>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="info-label">ชื่อลูกค้า</span>
              <span class="info-value">{{ p.customerName }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">อีเมล</span>
              <span class="info-value">{{ p.customerEmail }}</span>
            </div>

            @if (p.description) {
            <div class="info-row">
              <span class="info-label">รายละเอียด</span>
              <span class="info-value">{{ p.description }}</span>
            </div>
            }
          </div>
        </div>

        <!-- Actions Card -->
        <div class="card actions-card">
          <div class="card-header">
            <h2>การดำเนินการ</h2>
          </div>

          <div class="card-body">
            @switch (p.status) { @case ('PENDING') {
            <div class="action-buttons">
              <button
                class="btn btn-success btn-full"
                (click)="completePayment()"
                [disabled]="actionLoading()"
              >
                ✓ ยืนยันการชำระเงิน
              </button>
              <button
                class="btn btn-danger btn-full"
                (click)="cancelPayment()"
                [disabled]="actionLoading()"
              >
                ✕ ยกเลิกการชำระเงิน
              </button>
            </div>
            } @case ('COMPLETED') {
            <div class="action-buttons">
              <button
                class="btn btn-warning btn-full"
                (click)="showRefundForm.set(true)"
                [disabled]="actionLoading() || showRefundForm()"
              >
                ↩ คืนเงิน (Refund)
              </button>
            </div>

            @if (showRefundForm()) {
            <div class="refund-form">
              <h3>ฟอร์มคืนเงิน</h3>
              <div class="form-group">
                <label>จำนวนเงินที่ต้องการคืน</label>
                <input
                  type="number"
                  class="form-input"
                  [value]="refundAmount()"
                  (input)="onRefundAmountChange($event)"
                  [max]="p.amount"
                  min="0.01"
                  step="0.01"
                />
                <small>สูงสุด: {{ formatAmount(p.amount, p.currency) }}</small>
              </div>
              <div class="form-group">
                <label>เหตุผลในการคืนเงิน</label>
                <textarea
                  class="form-input"
                  rows="3"
                  [value]="refundReason()"
                  (input)="onRefundReasonChange($event)"
                  placeholder="ระบุเหตุผล..."
                ></textarea>
              </div>
              <div class="action-buttons">
                <button
                  class="btn btn-warning"
                  (click)="processRefund()"
                  [disabled]="actionLoading() || !isRefundValid()"
                >
                  ยืนยันคืนเงิน
                </button>
                <button
                  class="btn btn-secondary"
                  (click)="showRefundForm.set(false)"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
            } } @case ('CANCELLED') {
            <div class="status-message">
              <p>❌ Payment นี้ถูกยกเลิกแล้ว</p>
            </div>
            } @case ('REFUNDED') {
            <div class="status-message">
              <p>↩ Payment นี้ได้รับการคืนเงินแล้ว</p>
            </div>
            } @case ('FAILED') {
            <div class="status-message">
              <p>⚠️ Payment นี้ล้มเหลว</p>
            </div>
            } @default {
            <div class="status-message">
              <p>⏳ กำลังดำเนินการ...</p>
            </div>
            } }
          </div>
        </div>

        <!-- Transactions Card -->
        <div class="card transactions-card">
          <div class="card-header">
            <h2>ประวัติ Transactions</h2>
          </div>

          <div class="card-body">
            @if (p.transactions && p.transactions.length > 0) {
            <div class="transactions-list">
              @for (tx of p.transactions; track tx.transactionId) {
              <div class="transaction-item">
                <div class="tx-header">
                  <span
                    class="tx-type"
                    [class]="'type-' + tx.type.toLowerCase()"
                  >
                    {{ getTransactionTypeLabel(tx.type) }}
                  </span>
                  <span
                    class="tx-status"
                    [class]="'status-' + tx.status.toLowerCase()"
                  >
                    {{ tx.status }}
                  </span>
                </div>
                <div class="tx-body">
                  <div class="tx-info">
                    <span class="tx-id">{{ tx.transactionId }}</span>
                    <span class="tx-amount">
                      {{ formatAmount(tx.amount, p.currency) }}
                    </span>
                  </div>
                  <div class="tx-time">
                    {{ formatDate(tx.createdAt) }}
                  </div>
                </div>
              </div>
              }
            </div>
            } @else {
            <div class="empty-transactions">
              <p>ยังไม่มีประวัติ Transaction</p>
            </div>
            }
          </div>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      /* Container */
      .payment-detail-container {
        padding: var(--spacing-4);
        max-width: 1200px;
        margin: 0 auto;
      }

      /* Back Navigation */
      .back-nav {
        margin-bottom: var(--spacing-4);
      }

      .back-link {
        color: var(--color-primary);
        font-weight: 500;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      /* Loading & Error */
      .loading-container,
      .error-container {
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

      .error-message {
        color: var(--color-error);
        margin-bottom: var(--spacing-4);
      }

      /* Grid Layout */
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-6);
      }

      /* Cards */
      .card {
        background-color: var(--color-white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-4);
        border-bottom: 1px solid var(--color-gray-100);

        h2 {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-gray-900);
          margin: 0;
        }
      }

      .card-body {
        padding: var(--spacing-4);
      }

      /* Main Info */
      .main-info {
        grid-column: span 2;
      }

      .payment-ref {
        font-size: var(--font-size-xl);
        font-weight: 700;
        color: var(--color-gray-900);
        margin: 0;
        font-family: var(--font-family-mono);
      }

      /* Info Rows */
      .info-row {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-2) 0;
        border-bottom: 1px solid var(--color-gray-50);

        &:last-child {
          border-bottom: none;
        }
      }

      .info-label {
        font-size: var(--font-size-sm);
        color: var(--color-gray-500);
      }

      .info-value {
        font-size: var(--font-size-sm);
        font-weight: 500;
        color: var(--color-gray-900);

        &.amount {
          font-size: var(--font-size-lg);
          font-weight: 700;
          color: var(--color-primary);
          font-family: var(--font-family-mono);
        }
      }

      /* Status Badge */
      .status-badge {
        display: inline-block;
        padding: var(--spacing-1) var(--spacing-3);
        border-radius: var(--radius-full);
        font-size: var(--font-size-sm);
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

        &.status-cancelled,
        &.status-refunded {
          background-color: var(--color-gray-100);
          color: var(--color-gray-600);
        }
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

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-full {
        width: 100%;
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

      .btn-warning {
        background-color: var(--color-warning);
        color: var(--color-white);

        &:hover:not(:disabled) {
          background-color: #d97706;
        }
      }

      /* Action Buttons */
      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-3);
      }

      .status-message {
        text-align: center;
        padding: var(--spacing-4);
        color: var(--color-gray-600);
      }

      /* Refund Form */
      .refund-form {
        margin-top: var(--spacing-4);
        padding-top: var(--spacing-4);
        border-top: 1px solid var(--color-gray-100);

        h3 {
          font-size: var(--font-size-md);
          font-weight: 600;
          margin: 0 0 var(--spacing-4) 0;
        }
      }

      .form-group {
        margin-bottom: var(--spacing-4);

        label {
          display: block;
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-gray-700);
          margin-bottom: var(--spacing-1);
        }

        small {
          font-size: var(--font-size-xs);
          color: var(--color-gray-500);
        }
      }

      .form-input {
        width: 100%;
        padding: var(--spacing-2) var(--spacing-3);
        border: 1px solid var(--color-gray-300);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);

        &:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }
      }

      /* Transactions */
      .transactions-card {
        grid-column: span 2;
      }

      .transactions-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-3);
      }

      .transaction-item {
        padding: var(--spacing-3);
        background-color: var(--color-gray-50);
        border-radius: var(--radius-md);
      }

      .tx-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-2);
      }

      .tx-type {
        font-size: var(--font-size-xs);
        font-weight: 600;
        padding: var(--spacing-1) var(--spacing-2);
        border-radius: var(--radius-sm);

        &.type-charge {
          background-color: var(--color-info-bg);
          color: var(--color-info);
        }

        &.type-refund {
          background-color: var(--color-warning-bg);
          color: var(--color-warning);
        }

        &.type-void {
          background-color: var(--color-gray-100);
          color: var(--color-gray-600);
        }
      }

      .tx-status {
        font-size: var(--font-size-xs);
        font-weight: 500;

        &.status-success {
          color: var(--color-success);
        }

        &.status-pending {
          color: var(--color-warning);
        }

        &.status-failed {
          color: var(--color-error);
        }
      }

      .tx-body {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .tx-info {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-1);
      }

      .tx-id {
        font-size: var(--font-size-xs);
        font-family: var(--font-family-mono);
        color: var(--color-gray-600);
      }

      .tx-amount {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--color-gray-900);
      }

      .tx-time {
        font-size: var(--font-size-xs);
        color: var(--color-gray-500);
      }

      .empty-transactions {
        text-align: center;
        padding: var(--spacing-6);
        color: var(--color-gray-500);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .detail-grid {
          grid-template-columns: 1fr;
        }

        .main-info,
        .transactions-card {
          grid-column: span 1;
        }

        .refund-form .action-buttons {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class PaymentDetailComponent implements OnInit {
  // Inject Services
  private readonly paymentService = inject(PaymentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Local State
  protected readonly payment = signal<PaymentResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionLoading = signal(false);

  // Refund Form State
  protected readonly showRefundForm = signal(false);
  protected readonly refundAmount = signal(0);
  protected readonly refundReason = signal("");

  // Computed: Validate Refund Form
  protected readonly isRefundValid = computed(() => {
    const amount = this.refundAmount();
    const reason = this.refundReason();
    const payment = this.payment();
    return amount > 0 && amount <= (payment?.amount || 0) && reason.length > 0;
  });

  // Reference ID จาก Route
  private referenceId = "";

  constructor() {
    // Effect: Update refund amount when payment changes
    effect(() => {
      const payment = this.payment();
      if (payment) {
        this.refundAmount.set(payment.amount);
      }
    });
  }

  ngOnInit(): void {
    // ดึง Reference ID จาก Route Parameter
    this.route.params.subscribe((params) => {
      this.referenceId = params["referenceId"];
      if (this.referenceId) {
        this.loadPayment();
      }
    });
  }

  /**
   * โหลดข้อมูล Payment
   */
  protected loadPayment(): void {
    this.loading.set(true);
    this.error.set(null);

    this.paymentService.getPaymentByReference(this.referenceId).subscribe({
      next: (payment) => {
        this.payment.set(payment);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || "ไม่สามารถโหลดข้อมูล Payment ได้");
        this.loading.set(false);
      },
    });
  }

  /**
   * ยืนยันการชำระเงิน
   */
  protected completePayment(): void {
    if (!confirm("ต้องการยืนยันการชำระเงินนี้หรือไม่?")) return;

    this.actionLoading.set(true);

    this.paymentService.completePaymentDirect(this.referenceId).subscribe({
      next: (payment) => {
        this.payment.set(payment);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || "ไม่สามารถยืนยันการชำระเงินได้");
        this.actionLoading.set(false);
      },
    });
  }

  /**
   * ยกเลิก Payment
   */
  protected cancelPayment(): void {
    if (!confirm("ต้องการยกเลิกการชำระเงินนี้หรือไม่?")) return;

    this.actionLoading.set(true);

    this.paymentService.cancelPaymentDirect(this.referenceId).subscribe({
      next: (payment) => {
        this.payment.set(payment);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || "ไม่สามารถยกเลิกการชำระเงินได้");
        this.actionLoading.set(false);
      },
    });
  }

  /**
   * ดำเนินการคืนเงิน
   */
  protected processRefund(): void {
    if (!confirm("ต้องการคืนเงินหรือไม่?")) return;

    this.actionLoading.set(true);

    this.paymentService
      .refundPaymentDirect(
        this.referenceId,
        this.refundAmount(),
        this.refundReason()
      )
      .subscribe({
        next: (payment) => {
          this.payment.set(payment);
          this.showRefundForm.set(false);
          this.actionLoading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || "ไม่สามารถคืนเงินได้");
          this.actionLoading.set(false);
        },
      });
  }

  /**
   * Handle refund amount change
   */
  protected onRefundAmountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.refundAmount.set(parseFloat(input.value) || 0);
  }

  /**
   * Handle refund reason change
   */
  protected onRefundReasonChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.refundReason.set(textarea.value);
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

  /**
   * แปลง Transaction Type เป็นข้อความภาษาไทย
   */
  protected getTransactionTypeLabel(type: TransactionType): string {
    const typeLabels: Record<TransactionType, string> = {
      CHARGE: "เรียกเก็บเงิน",
      REFUND: "คืนเงิน",
      VOID: "ยกเลิก",
    };
    return typeLabels[type] || type;
  }
}

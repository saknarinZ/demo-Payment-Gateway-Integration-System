/**
 * Payment Form Component
 *
 * Component สำหรับสร้าง Payment ใหม่
 * ใช้ Reactive Forms ร่วมกับ Signals Architecture
 * รองรับ Form Validation
 */

import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { PaymentService } from "@core/services/payment.service";
import {
  CreatePaymentRequest,
  PaymentMethod,
} from "@core/models/payment.model";

/**
 * PaymentFormComponent - สร้าง Payment ใหม่
 *
 * Features:
 * - Form สำหรับกรอกข้อมูล Payment
 * - Validation ทุก Field
 * - เลือกวิธีชำระเงิน
 * - Submit และ Redirect เมื่อสำเร็จ
 */
@Component({
  selector: "app-payment-form",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  template: `
    <div class="payment-form-container">
      <!-- Back Button -->
      <div class="back-nav">
        <a routerLink="/payments" class="back-link"
          >← กลับไปยังรายการ Payment</a
        >
      </div>

      <!-- Form Card -->
      <div class="form-card">
        <div class="card-header">
          <h1>สร้าง Payment ใหม่</h1>
          <p>กรอกข้อมูลเพื่อสร้าง Payment</p>
        </div>

        <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()">
          <div class="card-body">
            <!-- Customer Information Section -->
            <section class="form-section">
              <h2 class="section-title">ข้อมูลลูกค้า</h2>

              <div class="form-row">
                <div class="form-group">
                  <label for="customerName"
                    >ชื่อลูกค้า <span class="required">*</span></label
                  >
                  <input
                    type="text"
                    id="customerName"
                    class="form-input"
                    formControlName="customerName"
                    placeholder="กรอกชื่อลูกค้า"
                    [class.error]="isFieldInvalid('customerName')"
                  />
                  @if (isFieldInvalid('customerName')) {
                  <span class="error-message">
                    @if (paymentForm.get('customerName')?.errors?.['required'])
                    { กรุณากรอกชื่อลูกค้า } @if
                    (paymentForm.get('customerName')?.errors?.['minlength']) {
                    ชื่อต้องมีอย่างน้อย 2 ตัวอักษร }
                  </span>
                  }
                </div>

                <div class="form-group">
                  <label for="customerEmail"
                    >อีเมล <span class="required">*</span></label
                  >
                  <input
                    type="email"
                    id="customerEmail"
                    class="form-input"
                    formControlName="customerEmail"
                    placeholder="email@example.com"
                    [class.error]="isFieldInvalid('customerEmail')"
                  />
                  @if (isFieldInvalid('customerEmail')) {
                  <span class="error-message">
                    @if (paymentForm.get('customerEmail')?.errors?.['required'])
                    { กรุณากรอกอีเมล } @if
                    (paymentForm.get('customerEmail')?.errors?.['email']) {
                    รูปแบบอีเมลไม่ถูกต้อง }
                  </span>
                  }
                </div>
              </div>
            </section>

            <!-- Payment Information Section -->
            <section class="form-section">
              <h2 class="section-title">ข้อมูลการชำระเงิน</h2>

              <div class="form-row">
                <div class="form-group">
                  <label for="amount"
                    >จำนวนเงิน <span class="required">*</span></label
                  >
                  <div class="input-with-prefix">
                    <input
                      type="number"
                      id="amount"
                      class="form-input"
                      formControlName="amount"
                      placeholder="0.00"
                      step="0.01"
                      min="1"
                      [class.error]="isFieldInvalid('amount')"
                    />
                    <select formControlName="currency" class="currency-select">
                      <option value="THB">THB</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  @if (isFieldInvalid('amount')) {
                  <span class="error-message">
                    @if (paymentForm.get('amount')?.errors?.['required']) {
                    กรุณากรอกจำนวนเงิน } @if
                    (paymentForm.get('amount')?.errors?.['min']) {
                    จำนวนเงินต้องมากกว่า 0 }
                  </span>
                  }
                </div>

                <div class="form-group">
                  <label>วิธีชำระเงิน <span class="required">*</span></label>
                  <div class="payment-methods">
                    @for (method of paymentMethods; track method.value) {
                    <label
                      class="method-option"
                      [class.selected]="
                        paymentForm.get('paymentMethod')?.value === method.value
                      "
                    >
                      <input
                        type="radio"
                        formControlName="paymentMethod"
                        [value]="method.value"
                      />
                      <span class="method-icon">{{ method.icon }}</span>
                      <span class="method-label">{{ method.label }}</span>
                    </label>
                    }
                  </div>
                  @if (isFieldInvalid('paymentMethod')) {
                  <span class="error-message">กรุณาเลือกวิธีชำระเงิน</span>
                  }
                </div>
              </div>
            </section>

            <!-- Additional Information Section -->
            <section class="form-section">
              <h2 class="section-title">ข้อมูลเพิ่มเติม</h2>

              <div class="form-group full-width">
                <label for="description">รายละเอียด (ไม่บังคับ)</label>
                <textarea
                  id="description"
                  class="form-input"
                  formControlName="description"
                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  rows="3"
                ></textarea>
              </div>

              <div class="form-group full-width">
                <label for="callbackUrl">Callback URL (ไม่บังคับ)</label>
                <input
                  type="url"
                  id="callbackUrl"
                  class="form-input"
                  formControlName="callbackUrl"
                  placeholder="https://your-website.com/callback"
                  [class.error]="isFieldInvalid('callbackUrl')"
                />
                @if (isFieldInvalid('callbackUrl')) {
                <span class="error-message">รูปแบบ URL ไม่ถูกต้อง</span>
                }
                <small class="field-hint">
                  URL ที่จะได้รับแจ้งเตือนเมื่อสถานะ Payment เปลี่ยนแปลง
                </small>
              </div>
            </section>
          </div>

          <!-- Form Actions -->
          <div class="card-footer">
            <div class="form-summary">
              @if (paymentForm.get('amount')?.value &&
              paymentForm.get('currency')?.value) {
              <span class="summary-label">ยอดรวม:</span>
              <span class="summary-amount">
                {{
                  formatAmount(
                    paymentForm.get("amount")?.value,
                    paymentForm.get("currency")?.value
                  )
                }}
              </span>
              }
            </div>

            <div class="form-actions">
              <a routerLink="/payments" class="btn btn-secondary">ยกเลิก</a>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="!paymentForm.valid || submitting()"
              >
                @if (submitting()) {
                <span class="btn-loading"></span>
                กำลังสร้าง... } @else { สร้าง Payment }
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Error Message -->
      @if (error()) {
      <div class="error-banner">
        <p>❌ {{ error() }}</p>
        <button class="btn-close" (click)="error.set(null)">✕</button>
      </div>
      }
    </div>
  `,
  styles: [
    `
      /* Container */
      .payment-form-container {
        padding: var(--spacing-4);
        max-width: 800px;
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

      /* Form Card */
      .form-card {
        background-color: var(--color-white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        overflow: hidden;
      }

      .card-header {
        padding: var(--spacing-6);
        border-bottom: 1px solid var(--color-gray-100);

        h1 {
          font-size: var(--font-size-xl);
          font-weight: 700;
          color: var(--color-gray-900);
          margin: 0 0 var(--spacing-1) 0;
        }

        p {
          font-size: var(--font-size-sm);
          color: var(--color-gray-500);
          margin: 0;
        }
      }

      .card-body {
        padding: var(--spacing-6);
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-4) var(--spacing-6);
        background-color: var(--color-gray-50);
        border-top: 1px solid var(--color-gray-100);
      }

      /* Form Sections */
      .form-section {
        margin-bottom: var(--spacing-6);

        &:last-child {
          margin-bottom: 0;
        }
      }

      .section-title {
        font-size: var(--font-size-md);
        font-weight: 600;
        color: var(--color-gray-900);
        margin: 0 0 var(--spacing-4) 0;
        padding-bottom: var(--spacing-2);
        border-bottom: 1px solid var(--color-gray-100);
      }

      /* Form Layout */
      .form-row {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-4);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-1);

        &.full-width {
          grid-column: span 2;
        }

        label {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-gray-700);
        }
      }

      .required {
        color: var(--color-error);
      }

      /* Form Inputs */
      .form-input {
        width: 100%;
        padding: var(--spacing-3);
        border: 1px solid var(--color-gray-300);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        transition: border-color var(--transition-fast),
          box-shadow var(--transition-fast);

        &:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }

        &.error {
          border-color: var(--color-error);

          &:focus {
            box-shadow: 0 0 0 2px var(--color-error-bg);
          }
        }

        &::placeholder {
          color: var(--color-gray-400);
        }
      }

      textarea.form-input {
        resize: vertical;
        min-height: 100px;
      }

      /* Input with Prefix/Suffix */
      .input-with-prefix {
        display: flex;
        gap: var(--spacing-2);
      }

      .input-with-prefix .form-input {
        flex: 1;
      }

      .currency-select {
        padding: var(--spacing-3);
        border: 1px solid var(--color-gray-300);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        font-weight: 500;
        background-color: var(--color-gray-50);
        cursor: pointer;

        &:focus {
          outline: none;
          border-color: var(--color-primary);
        }
      }

      /* Payment Methods */
      .payment-methods {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--spacing-2);
      }

      .method-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--spacing-3);
        border: 2px solid var(--color-gray-200);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-fast);

        input[type="radio"] {
          display: none;
        }

        &:hover {
          border-color: var(--color-primary-light);
          background-color: var(--color-gray-50);
        }

        &.selected {
          border-color: var(--color-primary);
          background-color: var(--color-primary-light);
        }
      }

      .method-icon {
        font-size: 24px;
        margin-bottom: var(--spacing-1);
      }

      .method-label {
        font-size: var(--font-size-xs);
        font-weight: 500;
        color: var(--color-gray-700);
        text-align: center;
      }

      /* Error Messages */
      .error-message {
        font-size: var(--font-size-xs);
        color: var(--color-error);
      }

      .field-hint {
        font-size: var(--font-size-xs);
        color: var(--color-gray-500);
      }

      /* Form Summary */
      .form-summary {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
      }

      .summary-label {
        font-size: var(--font-size-sm);
        color: var(--color-gray-600);
      }

      .summary-amount {
        font-size: var(--font-size-lg);
        font-weight: 700;
        color: var(--color-primary);
        font-family: var(--font-family-mono);
      }

      /* Form Actions */
      .form-actions {
        display: flex;
        gap: var(--spacing-3);
      }

      /* Buttons */
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-2);
        padding: var(--spacing-3) var(--spacing-6);
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

      .btn-loading {
        width: 16px;
        height: 16px;
        border: 2px solid var(--color-white);
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Error Banner */
      .error-banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: var(--spacing-4);
        padding: var(--spacing-3) var(--spacing-4);
        background-color: var(--color-error-bg);
        border: 1px solid var(--color-error);
        border-radius: var(--radius-md);

        p {
          margin: 0;
          color: var(--color-error);
          font-size: var(--font-size-sm);
        }
      }

      .btn-close {
        background: none;
        border: none;
        color: var(--color-error);
        cursor: pointer;
        font-size: var(--font-size-md);
        padding: var(--spacing-1);

        &:hover {
          opacity: 0.7;
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .form-row {
          grid-template-columns: 1fr;
        }

        .form-group.full-width {
          grid-column: span 1;
        }

        .payment-methods {
          grid-template-columns: repeat(2, 1fr);
        }

        .card-footer {
          flex-direction: column;
          gap: var(--spacing-4);
        }

        .form-actions {
          width: 100%;
          flex-direction: column;
        }

        .btn {
          width: 100%;
        }
      }
    `,
  ],
})
export class PaymentFormComponent {
  // Inject Services
  private readonly paymentService = inject(PaymentService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Form State
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  // Payment Methods Options
  protected readonly paymentMethods: {
    value: PaymentMethod;
    label: string;
    icon: string;
  }[] = [
    { value: "CREDIT_CARD", label: "บัตรเครดิต", icon: "💳" },
    { value: "DEBIT_CARD", label: "บัตรเดบิต", icon: "💳" },
    { value: "BANK_TRANSFER", label: "โอนเงิน", icon: "🏦" },
    { value: "QR_CODE", label: "QR Code", icon: "📱" },
    { value: "E_WALLET", label: "E-Wallet", icon: "👛" },
  ];

  // Reactive Form
  protected paymentForm: FormGroup;

  constructor() {
    // Initialize Form
    this.paymentForm = this.fb.group({
      customerName: ["", [Validators.required, Validators.minLength(2)]],
      customerEmail: ["", [Validators.required, Validators.email]],
      amount: [null, [Validators.required, Validators.min(1)]],
      currency: ["THB", Validators.required],
      paymentMethod: ["", Validators.required],
      description: [""],
      callbackUrl: ["", Validators.pattern(/^(https?:\/\/).*/)],
    });
  }

  /**
   * Submit Form
   */
  protected onSubmit(): void {
    if (!this.paymentForm.valid) {
      // Mark all fields as touched to show errors
      Object.keys(this.paymentForm.controls).forEach((key) => {
        this.paymentForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    // Prepare Request
    const formValue = this.paymentForm.value;
    const request: CreatePaymentRequest = {
      merchantId: 1, // TODO: ใช้ Merchant จริงจาก Authentication
      amount: formValue.amount,
      currency: formValue.currency,
      customerName: formValue.customerName,
      customerEmail: formValue.customerEmail,
      paymentMethod: formValue.paymentMethod,
      description: formValue.description || undefined,
      callbackUrl: formValue.callbackUrl || undefined,
    };

    // Call API
    this.paymentService.createPaymentDirect(request).subscribe({
      next: (payment) => {
        this.submitting.set(false);
        // Redirect ไปยังหน้า Payment Detail
        this.router.navigate(["/payments", payment.referenceId]);
      },
      error: (err) => {
        this.error.set(err.message || "ไม่สามารถสร้าง Payment ได้");
        this.submitting.set(false);
      },
    });
  }

  /**
   * Check if field is invalid and touched
   */
  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.paymentForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  /**
   * Format amount with currency
   */
  protected formatAmount(amount: number, currency: string): string {
    if (!amount || !currency) return "";
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: currency,
    }).format(amount);
  }
}

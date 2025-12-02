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
  templateUrl: "./payment-form.component.html",
  styleUrls: ["./payment-form.component.css"],
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

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
  templateUrl: "./payment-detail.component.html",
  styleUrls: ["./payment-detail.component.css"],
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

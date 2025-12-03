/**
 * Checkout Component
 *
 * หน้าสำหรับลูกค้าชำระเงิน
 * - แสดงรายละเอียด Payment
 * - เลือกวิธีชำระเงิน
 * - จำลองการชำระเงิน (Mock)
 */

import { Component, inject, signal, computed, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { PaymentService } from "@core/services/payment.service";
import { PaymentResponse, PaymentMethod } from "@shared/models/payment.model";

@Component({
  selector: "app-checkout",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./checkout.component.html",
  styleUrls: ["./checkout.component.scss"],
})
export class CheckoutComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);

  // State
  protected readonly payment = signal<PaymentResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly processing = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal(false);
  protected readonly selectedMethod = signal<string>("");

  // Mock Card Data
  protected cardNumber = "";
  protected cardExpiry = "";
  protected cardCvc = "";
  protected cardName = "";

  // Payment Methods
  protected readonly paymentMethods = [
    {
      value: "CREDIT_CARD",
      label: "บัตรเครดิต/เดบิต",
      icon: "💳",
      description: "Visa, Mastercard, JCB",
    },
    {
      value: "PROMPTPAY",
      label: "พร้อมเพย์",
      icon: "📱",
      description: "สแกน QR Code",
    },
    {
      value: "BANK_TRANSFER",
      label: "โอนเงินผ่านธนาคาร",
      icon: "🏦",
      description: "กสิกร, กรุงเทพ, ไทยพาณิชย์",
    },
    {
      value: "E_WALLET",
      label: "E-Wallet",
      icon: "👛",
      description: "TrueMoney, Rabbit LINE Pay",
    },
  ];

  // Computed
  protected readonly isExpired = computed(() => {
    // PaymentResponse doesn't have expiresAt, so never expired for now
    return false;
  });

  protected readonly canPay = computed(() => {
    const p = this.payment();
    return (
      p?.status === "PENDING" && !this.isExpired() && this.selectedMethod()
    );
  });

  protected readonly formattedAmount = computed(() => {
    const p = this.payment();
    if (!p) return "";
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: p.currency || "THB",
    }).format(p.amount);
  });

  ngOnInit(): void {
    const referenceId = this.route.snapshot.paramMap.get("referenceId");
    if (referenceId) {
      this.loadPayment(referenceId);
    } else {
      this.error.set("ไม่พบรหัสอ้างอิง Payment");
      this.loading.set(false);
    }
  }

  private loadPayment(referenceId: string): void {
    this.loading.set(true);
    this.paymentService.getPaymentByReference(referenceId).subscribe({
      next: (payment) => {
        this.payment.set(payment);
        this.selectedMethod.set(payment.paymentMethod || "");
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set("ไม่พบ Payment หรือ Link หมดอายุ");
        this.loading.set(false);
      },
    });
  }

  protected selectMethod(method: string): void {
    this.selectedMethod.set(method);
  }

  protected processPayment(): void {
    const p = this.payment();
    if (!p || !this.canPay()) return;

    this.processing.set(true);
    this.error.set(null);

    // Simulate payment processing delay
    setTimeout(() => {
      // Call API to complete payment
      this.paymentService.completePaymentDirect(p.referenceId).subscribe({
        next: (result) => {
          this.success.set(true);
          this.processing.set(false);
          this.payment.set(result);
        },
        error: (err) => {
          this.error.set("การชำระเงินล้มเหลว กรุณาลองใหม่อีกครั้ง");
          this.processing.set(false);
        },
      });
    }, 2000); // 2 second delay to simulate processing
  }

  protected formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\s/g, "").replace(/\D/g, "");
    value = value.substring(0, 16);
    const parts = value.match(/.{1,4}/g);
    this.cardNumber = parts ? parts.join(" ") : value;
  }

  protected formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, "");
    value = value.substring(0, 4);
    if (value.length >= 2) {
      value = value.substring(0, 2) + "/" + value.substring(2);
    }
    this.cardExpiry = value;
  }

  protected getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: "รอชำระเงิน",
      PROCESSING: "กำลังดำเนินการ",
      COMPLETED: "ชำระเงินสำเร็จ",
      FAILED: "ล้มเหลว",
      CANCELLED: "ยกเลิก",
      REFUNDED: "คืนเงินแล้ว",
    };
    return statusMap[status] || status;
  }

  protected getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      PENDING: "status-pending",
      PROCESSING: "status-processing",
      COMPLETED: "status-success",
      FAILED: "status-error",
      CANCELLED: "status-cancelled",
      REFUNDED: "status-refunded",
    };
    return classMap[status] || "";
  }
}

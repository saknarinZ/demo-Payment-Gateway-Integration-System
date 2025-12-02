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
  templateUrl: "./payment-list.component.html",
  styleUrls: ["./payment-list.component.css"],
})
export class PaymentListComponent implements OnInit {
  // Inject Services
  protected readonly paymentService = inject(PaymentService);

  // Local State
  protected readonly selectedStatus = signal<PaymentStatus | "">("");
  protected readonly searchQuery = signal<string>("");

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
    const search = this.searchQuery() || undefined;
    this.paymentService.loadPayments(0, 10, status, search);
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
    const search = this.searchQuery() || undefined;
    this.paymentService.loadPayments(0, 10, filterStatus, search);
  }

  /**
   * เมื่อค้นหา
   */
  protected onSearch(query: string): void {
    console.log("onSearch called with:", query);
    this.searchQuery.set(query);
    const status = this.selectedStatus() || undefined;
    // Debounce could be added here if needed, but for now direct call
    this.paymentService.loadPayments(0, 10, status, query || undefined);
  }

  /**
   * ไปหน้าที่ระบุ
   */
  protected goToPage(page: number): void {
    const status = this.selectedStatus() || undefined;
    const search = this.searchQuery() || undefined;
    this.paymentService.loadPayments(page, 10, status, search);
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

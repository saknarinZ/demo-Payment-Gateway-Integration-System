/**
 * Order Service - จัดการการสั่งซื้อ
 *
 * MVC Pattern: Service Layer (Business Logic)
 * - Single Responsibility: จัดการ Order/Payment
 * - ใช้ PaymentService สำหรับ API calls
 */

import { Injectable, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, catchError, tap, throwError } from "rxjs";
import { PaymentService } from "@core/services/payment.service";
import { CartService } from "@core/services/cart.service";
import { PaymentResponse } from "@core/models/payment.model";

/**
 * Order Request Interface
 */
export interface OrderRequest {
  merchantId: number;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: "CREDIT_CARD" | "BANK_TRANSFER" | "QR_CODE";
  description: string;
  customerName: string;
  customerEmail: string;
  callbackUrl: string;
}

@Injectable({
  providedIn: "root",
})
export class OrderService {
  private readonly paymentService = inject(PaymentService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  // State
  private readonly _processing = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastOrder = signal<PaymentResponse | null>(null);

  // Public readonly signals
  readonly processing = this._processing.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastOrder = this._lastOrder.asReadonly();

  /**
   * สร้าง Order ID ใหม่
   */
  generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * สร้าง Order Request จาก Cart
   */
  createOrderRequest(): OrderRequest {
    const customerInfo = this.cartService.customerInfo();

    return {
      merchantId: 1, // Demo Merchant
      orderId: this.generateOrderId(),
      amount: this.cartService.total(),
      currency: "THB",
      paymentMethod: "CREDIT_CARD",
      description: this.cartService.orderDescription().substring(0, 200),
      customerName: customerInfo.getDisplayName(),
      customerEmail: customerInfo.getEmailFromPhone(),
      callbackUrl: `${window.location.origin}/shop`,
    };
  }

  /**
   * ดำเนินการสั่งซื้อ
   * 1. สร้าง Payment
   * 2. Redirect ไป Checkout
   */
  placeOrder(): Observable<PaymentResponse> {
    // ตรวจสอบก่อน
    if (!this.cartService.canCheckout()) {
      return throwError(() => new Error("ตะกร้าว่างเปล่า"));
    }

    this._processing.set(true);
    this._error.set(null);

    const request = this.createOrderRequest();

    return this.paymentService.createPaymentDirect(request).pipe(
      tap((payment) => {
        this._lastOrder.set(payment);
        this._processing.set(false);

        // ล้างตะกร้าหลังสั่งซื้อสำเร็จ
        // this.cartService.clearCart();

        // Redirect ไปหน้า Checkout
        this.router.navigate(["/checkout", payment.referenceId]);
      }),
      catchError((err) => {
        this._error.set(
          err.message || "ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่"
        );
        this._processing.set(false);
        return throwError(() => err);
      })
    );
  }

  /**
   * ล้าง Error
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * รีเซ็ต State
   */
  reset(): void {
    this._processing.set(false);
    this._error.set(null);
    this._lastOrder.set(null);
  }
}

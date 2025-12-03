import { Injectable } from "@angular/core";
import { Observable, of, throwError } from "rxjs";
import { delay, tap } from "rxjs/operators";
import { PaymentService } from "./payment.service";
import {
  PaymentResponse,
  PaymentSummary,
  CreatePaymentRequest,
  PageResponse,
  DashboardStats,
  TransactionResponse,
  PaymentStatus,
  TransactionType,
  TransactionStatus,
} from "@core/models/payment.model";

@Injectable({
  providedIn: "root",
})
export class MockPaymentService extends PaymentService {
  private mockPayments: PaymentResponse[] = [];

  constructor() {
    super();
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create some initial mock data
    for (let i = 1; i <= 5; i++) {
      this.mockPayments.push({
        id: i,
        referenceId: `PAY-${100000 + i}`,
        merchantId: 1,
        amount: 1000 * i,
        currency: "THB",
        paymentMethod: "CREDIT_CARD",
        status: i % 2 === 0 ? "COMPLETED" : "PENDING",
        description: `Mock Payment ${i}`,
        customerEmail: `customer${i}@example.com`,
        customerName: `Customer ${i}`,
        callbackUrl: "http://example.com/callback",
        createdAt: new Date().toISOString(),
        completedAt: i % 2 === 0 ? new Date().toISOString() : null,
        transactions: [],
      });
    }
  }

  override loadPayments(
    page = 0,
    size = 20,
    status?: PaymentStatus,
    search?: string
  ): void {
    this.loading.set(true);
    this.error.set(null);

    // Simulate API delay
    setTimeout(() => {
      let filtered = [...this.mockPayments];

      if (status) {
        filtered = filtered.filter((p) => p.status === status);
      }

      if (search) {
        const lowerSearch = search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.referenceId.toLowerCase().includes(lowerSearch) ||
            p.customerName.toLowerCase().includes(lowerSearch)
        );
      }

      const start = page * size;
      const end = start + size;
      const content = filtered.slice(start, end).map((p) => ({
        id: p.id,
        referenceId: p.referenceId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        customerName: p.customerName,
        createdAt: p.createdAt,
      }));

      this.loading.set(false);
      this.payments.set(content);
      this.pagination.set({
        page,
        size,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
      });
    }, 800);
  }

  override createPaymentDirect(
    request: CreatePaymentRequest
  ): Observable<PaymentResponse> {
    const newPayment: PaymentResponse = {
      id: this.mockPayments.length + 1,
      referenceId: `PAY-${Date.now()}`,
      merchantId: 1,
      amount: request.amount,
      currency: request.currency || "THB",
      paymentMethod: request.paymentMethod || "CREDIT_CARD",
      status: "PENDING",
      description: request.description || "",
      customerEmail: request.customerEmail || "",
      customerName: request.customerName || "Guest",
      callbackUrl: request.callbackUrl || null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      transactions: [],
    };

    return of(newPayment).pipe(
      delay(1000),
      tap((payment) => {
        this.mockPayments.unshift(payment);
        this.updateMockPaymentInList(payment);
      })
    );
  }

  override getPaymentByReference(
    referenceId: string
  ): Observable<PaymentResponse> {
    const payment = this.mockPayments.find(
      (p) => p.referenceId === referenceId
    );
    if (!payment) {
      return throwError(() => new Error("Payment not found"));
    }
    return of(payment).pipe(delay(500));
  }

  override completePaymentDirect(
    referenceId: string
  ): Observable<PaymentResponse> {
    const payment = this.mockPayments.find(
      (p) => p.referenceId === referenceId
    );
    if (!payment) {
      return throwError(() => new Error("Payment not found"));
    }

    payment.status = "COMPLETED";
    payment.completedAt = new Date().toISOString();
    payment.transactions.push({
      id: Date.now(),
      transactionId: `TXN-${Date.now()}`,
      type: "CHARGE",
      amount: payment.amount,
      status: "SUCCESS",
      gatewayReference: `REF-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });

    return of({ ...payment }).pipe(
      delay(1000),
      tap((updated) => this.updateMockPaymentInList(updated))
    );
  }

  override cancelPaymentDirect(
    referenceId: string,
    reason = "Cancelled by user"
  ): Observable<PaymentResponse> {
    const payment = this.mockPayments.find(
      (p) => p.referenceId === referenceId
    );
    if (!payment) {
      return throwError(() => new Error("Payment not found"));
    }

    payment.status = "CANCELLED";
    payment.transactions.push({
      id: Date.now(),
      transactionId: `TXN-${Date.now()}`,
      type: "VOID",
      amount: payment.amount,
      status: "SUCCESS",
      gatewayReference: `REF-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });

    return of({ ...payment }).pipe(
      delay(1000),
      tap((updated) => this.updateMockPaymentInList(updated))
    );
  }

  override refundPaymentDirect(
    referenceId: string,
    amount: number,
    reason: string
  ): Observable<PaymentResponse> {
    const payment = this.mockPayments.find(
      (p) => p.referenceId === referenceId
    );
    if (!payment) {
      return throwError(() => new Error("Payment not found"));
    }

    payment.status = "REFUNDED";
    payment.transactions.push({
      id: Date.now(),
      transactionId: `TXN-${Date.now()}`,
      type: "REFUND",
      amount: amount,
      status: "SUCCESS",
      gatewayReference: `REF-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });

    return of({ ...payment }).pipe(
      delay(1000),
      tap((updated) => this.updateMockPaymentInList(updated))
    );
  }

  override getDashboardStats(): Observable<DashboardStats> {
    const totalAmount = this.mockPayments.reduce((sum, p) => sum + p.amount, 0);
    const today = new Date().toISOString().split("T")[0];
    const todayPayments = this.mockPayments.filter((p) =>
      p.createdAt.startsWith(today)
    );

    return of({
      totalPayments: this.mockPayments.length,
      pendingPayments: this.mockPayments.filter((p) => p.status === "PENDING")
        .length,
      completedPayments: this.mockPayments.filter(
        (p) => p.status === "COMPLETED"
      ).length,
      failedPayments: this.mockPayments.filter((p) => p.status === "FAILED")
        .length,
      cancelledPayments: this.mockPayments.filter(
        (p) => p.status === "CANCELLED"
      ).length,
      refundedPayments: this.mockPayments.filter((p) => p.status === "REFUNDED")
        .length,
      totalAmount: totalAmount,
      todayPayments: todayPayments.length,
      todayAmount: todayPayments.reduce((sum, p) => sum + p.amount, 0),
    }).pipe(
      delay(500),
      tap((stats) => this.stats.set(stats))
    );
  }

  // Helper to update the signal in the parent class
  private updateMockPaymentInList(payment: PaymentResponse): void {
    this.payments.update((payments) =>
      payments.map((p) =>
        p.referenceId === payment.referenceId
          ? {
              ...p,
              status: payment.status,
              paymentMethod: payment.paymentMethod,
            }
          : p
      )
    );
  }
}

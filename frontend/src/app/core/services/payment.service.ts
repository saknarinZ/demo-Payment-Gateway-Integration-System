/**
 * Payment Service - บริการจัดการ Payment
 *
 * ใช้ Signals Architecture
 * - inject() สำหรับ DI
 * - signal() สำหรับ State
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, tap, catchError, throwError } from "rxjs";
import {
  PaymentResponse,
  PaymentSummary,
  CreatePaymentRequest,
  RefundRequest,
  PageResponse,
  DashboardStats,
  TransactionResponse,
  PaymentStatus,
} from "@core/models/payment.model";

@Injectable({
  providedIn: "root",
})
export class PaymentService {
  // Inject HttpClient
  private readonly http = inject(HttpClient);

  // Base URL สำหรับ API
  private readonly baseUrl = "/api/v1/payments";

  // ============================================================
  // State Signals
  // ============================================================

  /** รายการ Payment ทั้งหมด */
  readonly payments = signal<PaymentSummary[]>([]);

  /** Payment ที่เลือกอยู่ */
  readonly selectedPayment = signal<PaymentResponse | null>(null);

  /** สถานะ Loading */
  readonly loading = signal(false);

  /** ข้อความ Error */
  readonly error = signal<string | null>(null);

  /** ข้อมูล Pagination */
  readonly pagination = signal({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  });

  /** สถิติ Dashboard */
  readonly stats = signal<DashboardStats | null>(null);

  // ============================================================
  // Computed Signals
  // ============================================================

  /** หน้าปัจจุบัน */
  readonly currentPage = computed(() => this.pagination().page);

  /** จำนวน Element ทั้งหมด */
  readonly totalElements = computed(() => this.pagination().totalElements);

  /** จำนวนหน้าทั้งหมด */
  readonly totalPages = computed(() => this.pagination().totalPages);

  /** จำนวน Payment ที่รอดำเนินการ */
  readonly pendingCount = computed(
    () => this.payments().filter((p) => p.status === "PENDING").length
  );

  /** จำนวน Payment ที่สำเร็จ */
  readonly completedCount = computed(
    () => this.payments().filter((p) => p.status === "COMPLETED").length
  );

  /** มี Error หรือไม่ */
  readonly hasError = computed(() => this.error() !== null);

  // ============================================================
  // API Methods - With State Update
  // ============================================================

  /**
   * โหลดรายการ Payment พร้อมอัพเดต State
   */
  loadPayments(page = 0, size = 20, status?: PaymentStatus): void {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString());

    if (status) {
      params = params.set("status", status);
    }

    this.http
      .get<PageResponse<PaymentSummary>>(this.baseUrl, { params })
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.payments.set(response.content);
          this.pagination.set({
            page: response.page,
            size: response.size,
            totalElements: response.totalElements,
            totalPages: response.totalPages,
          });
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(this.extractErrorMessage(err));
        },
      });
  }

  /**
   * ยืนยันการชำระเงินสำเร็จ (อัพเดต State)
   */
  completePayment(referenceId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .post<PaymentResponse>(`${this.baseUrl}/${referenceId}/complete`, {})
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.updatePaymentInList(response);
          this.selectedPayment.set(response);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(this.extractErrorMessage(err));
        },
      });
  }

  /**
   * ยกเลิก Payment (อัพเดต State)
   */
  cancelPayment(referenceId: string, reason = "Cancelled by user"): void {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set("reason", reason);

    this.http
      .post<PaymentResponse>(
        `${this.baseUrl}/${referenceId}/cancel`,
        {},
        { params }
      )
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.updatePaymentInList(response);
          this.selectedPayment.set(response);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(this.extractErrorMessage(err));
        },
      });
  }

  // ============================================================
  // API Methods - Return Observable (สำหรับใช้ใน Component)
  // ============================================================

  /**
   * สร้าง Payment ใหม่ - Return Observable
   */
  createPaymentDirect(
    request: CreatePaymentRequest
  ): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.baseUrl, request).pipe(
      tap((response) => {
        // เพิ่มเข้ารายการ
        this.payments.update((payments) => [
          {
            id: response.id,
            referenceId: response.referenceId,
            amount: response.amount,
            currency: response.currency,
            status: response.status,
            paymentMethod: response.paymentMethod,
            customerName: response.customerName,
            createdAt: response.createdAt,
          },
          ...payments,
        ]);
      }),
      catchError((err) => this.handleError(err))
    );
  }

  /**
   * ดึงรายการ Payment ทั้งหมด (พร้อม Pagination) - Return Observable
   */
  getPayments(
    page = 0,
    size = 20,
    status?: PaymentStatus
  ): Observable<PageResponse<PaymentSummary>> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString());

    if (status) {
      params = params.set("status", status);
    }

    return this.http
      .get<PageResponse<PaymentSummary>>(this.baseUrl, { params })
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * ดึง Payment ตาม Reference ID - Return Observable
   */
  getPaymentByReference(referenceId: string): Observable<PaymentResponse> {
    return this.http
      .get<PaymentResponse>(`${this.baseUrl}/${referenceId}`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  /**
   * ยืนยันการชำระเงินสำเร็จ - Return Observable
   */
  completePaymentDirect(referenceId: string): Observable<PaymentResponse> {
    return this.http
      .post<PaymentResponse>(`${this.baseUrl}/${referenceId}/complete`, {})
      .pipe(
        tap((response) => this.updatePaymentInList(response)),
        catchError((err) => this.handleError(err))
      );
  }

  /**
   * ยกเลิก Payment - Return Observable
   */
  cancelPaymentDirect(
    referenceId: string,
    reason = "Cancelled by user"
  ): Observable<PaymentResponse> {
    const params = new HttpParams().set("reason", reason);

    return this.http
      .post<PaymentResponse>(
        `${this.baseUrl}/${referenceId}/cancel`,
        {},
        { params }
      )
      .pipe(
        tap((response) => this.updatePaymentInList(response)),
        catchError((err) => this.handleError(err))
      );
  }

  /**
   * คืนเงิน - Return Observable
   */
  refundPaymentDirect(
    referenceId: string,
    amount: number,
    reason: string
  ): Observable<PaymentResponse> {
    const request: RefundRequest = {
      referenceId,
      amount,
      reason,
    };

    return this.http
      .post<PaymentResponse>(`${this.baseUrl}/refund`, request)
      .pipe(
        tap((response) => this.updatePaymentInList(response)),
        catchError((err) => this.handleError(err))
      );
  }

  /**
   * ดึง Transaction ของ Payment
   */
  getTransactions(paymentId: number): Observable<TransactionResponse[]> {
    return this.http.get<TransactionResponse[]>(
      `${this.baseUrl}/${paymentId}/transactions`
    );
  }

  /**
   * ดึงสถิติ Dashboard
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/stats`).pipe(
      tap((response) => this.stats.set(response)),
      catchError((err) => this.handleError(err))
    );
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  /**
   * อัพเดท Payment ในรายการ
   */
  private updatePaymentInList(payment: PaymentResponse): void {
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

  /**
   * ดึงข้อความ Error จาก HTTP Response
   */
  private extractErrorMessage(error: any): string {
    if (error.error?.detail) {
      return error.error.detail;
    } else if (error.error?.message) {
      return error.error.message;
    } else if (error.message) {
      return error.message;
    }
    return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
  }

  /**
   * จัดการ Error (สำหรับ Observable)
   */
  private handleError(error: any): Observable<never> {
    const errorMessage = this.extractErrorMessage(error);
    this.error.set(errorMessage);
    console.error("Payment Service Error:", error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * ล้าง Error
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * ล้าง Selected Payment
   */
  clearSelectedPayment(): void {
    this.selectedPayment.set(null);
  }
}

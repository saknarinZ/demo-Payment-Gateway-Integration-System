/**
 * API Service - บริการจัดการ API ทั่วไป
 *
 * ใช้สำหรับ Health Check และ API อื่นๆ
 */

import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap, catchError, of } from "rxjs";
import { HealthResponse } from "@shared/models/payment.model";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private readonly http = inject(HttpClient);

  // ============================================================
  // State Signals
  // ============================================================

  /** สถานะการเชื่อมต่อ API */
  readonly isConnected = signal(false);

  /** ข้อมูล Health */
  readonly healthInfo = signal<HealthResponse | null>(null);

  /** สถานะ Loading */
  readonly isLoading = signal(false);

  // ============================================================
  // API Methods
  // ============================================================

  /**
   * ตรวจสอบสถานะ API
   */
  checkHealth(): Observable<HealthResponse> {
    this.isLoading.set(true);

    return this.http.get<HealthResponse>("/api/v1/health").pipe(
      tap((response) => {
        this.isLoading.set(false);
        this.isConnected.set(response.status === "UP");
        this.healthInfo.set(response);
      }),
      catchError((error) => {
        this.isLoading.set(false);
        this.isConnected.set(false);
        this.healthInfo.set(null);
        console.error("Health check failed:", error);
        return of({
          status: "DOWN",
          service: "Payment Gateway API",
          version: "Unknown",
          timestamp: new Date().toISOString(),
          virtualThreads: "unknown",
        } as HealthResponse);
      })
    );
  }

  /**
   * ดึงข้อมูล API Info
   */
  getApiInfo(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>("/api/v1/info");
  }
}

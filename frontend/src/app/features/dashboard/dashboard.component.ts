/**
 * Dashboard Component
 *
 * หน้า Dashboard หลักของ Payment Gateway
 * แสดงข้อมูลสรุปและสถานะของระบบ
 */

import {
  Component,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PaymentService } from '@core/services/payment.service';
import { ApiService } from '@core/services/api.service';
import { DashboardStats, HealthResponse } from '@core/models/payment.model';

/**
 * DashboardComponent - Standalone Component
 *
 * ใช้ Signals Architecture เต็มรูปแบบ
 * - inject() แทน Constructor Injection
 * - signal() สำหรับ State
 * - New Control Flow (@if, @for)
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  // Inject Services
  private readonly http = inject(HttpClient);
  private readonly paymentService = inject(PaymentService);
  private readonly apiService = inject(ApiService);

  // Dashboard Stats
  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly statsLoading = signal(false);

  // System Status Signals
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly apiStatus = signal('CHECKING...');
  protected readonly virtualThreadsStatus = signal('checking...');
  protected readonly serverTime = signal('-');
  protected readonly apiVersion = signal('-');
  protected readonly serviceName = signal('-');

  // Tech Stack Data
  protected readonly techStack = signal([
    { name: 'Java', version: '21 LTS' },
    { name: 'Spring Boot', version: '3.4.0' },
    { name: 'Angular', version: '19.0.0' },
    { name: 'MySQL', version: '8.0' },
    { name: 'Redis', version: '7 Alpine' },
    { name: 'Virtual Threads', version: 'Enabled' },
  ]);

  ngOnInit(): void {
    // โหลดข้อมูลเมื่อ Component เริ่มทำงาน
    this.checkHealth();
    this.loadStats();
  }

  /**
   * โหลดสถิติ Dashboard
   */
  loadStats(): void {
    this.statsLoading.set(true);

    this.paymentService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.statsLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load stats:', error);
        this.statsLoading.set(false);
      },
    });
  }

  /**
   * ตรวจสอบสถานะ API
   */
  checkHealth(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<HealthResponse>('/api/v1/health').subscribe({
      next: (response) => {
        this.apiStatus.set(response.status);
        this.virtualThreadsStatus.set(response.virtualThreads);
        this.serverTime.set(response.timestamp);
        this.apiVersion.set(response.version);
        this.serviceName.set(response.service);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Health check failed:', error);
        this.errorMessage.set(
          'ไม่สามารถเชื่อมต่อกับ API Server ได้ กรุณาตรวจสอบว่า Backend กำลังทำงานอยู่'
        );
        this.apiStatus.set('DOWN');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Format จำนวนเงิน
   */
  protected formatAmount(amount: number): string {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  }
}

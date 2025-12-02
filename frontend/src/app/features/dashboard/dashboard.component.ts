/**
 * Dashboard Component
 *
 * หน้า Dashboard หลักของ Payment Gateway
 * แสดงข้อมูลสรุปและสถานะของระบบ
 */

import {
  Component,
  signal,
  computed,
  effect,
  inject,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { PaymentService } from "@core/services/payment.service";
import { ApiService } from "@core/services/api.service";
import { DashboardStats, HealthResponse } from "@core/models/payment.model";

/**
 * DashboardComponent - Standalone Component
 *
 * ใช้ Signals Architecture เต็มรูปแบบ
 * - inject() แทน Constructor Injection
 * - signal() สำหรับ State
 * - New Control Flow (@if, @for)
 */
@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <!-- Page Header -->
      <div class="page-header">
        <h1>Dashboard</h1>
        <p>ภาพรวมของระบบ Payment Gateway</p>
      </div>

      <!-- Payment Stats Cards -->
      <div class="stats-grid">
        <!-- Total Payments -->
        <div class="card stat-card primary">
          <div class="stat-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.totalPayments ?? 0 }}</span>
            <span class="stat-label">Payment ทั้งหมด</span>
          </div>
        </div>

        <!-- Pending Payments -->
        <div class="card stat-card warning">
          <div class="stat-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.pendingPayments ?? 0 }}</span>
            <span class="stat-label">รอดำเนินการ</span>
          </div>
        </div>

        <!-- Completed Payments -->
        <div class="card stat-card success">
          <div class="stat-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{
              stats()?.completedPayments ?? 0
            }}</span>
            <span class="stat-label">สำเร็จ</span>
          </div>
        </div>

        <!-- Failed Payments -->
        <div class="card stat-card danger">
          <div class="stat-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.failedPayments ?? 0 }}</span>
            <span class="stat-label">ล้มเหลว</span>
          </div>
        </div>
      </div>

      <!-- Amount Stats -->
      <div class="stats-grid amount-stats">
        <!-- Total Amount -->
        <div class="card stat-card large">
          <div class="stat-content">
            <span class="stat-label">ยอดรวมทั้งหมด</span>
            <span class="stat-value amount">{{
              formatAmount(stats()?.totalAmount ?? 0)
            }}</span>
          </div>
        </div>

        <!-- Today Stats -->
        <div class="card stat-card large">
          <div class="stat-content">
            <span class="stat-label">วันนี้</span>
            <span class="stat-value amount">{{
              formatAmount(stats()?.todayAmount ?? 0)
            }}</span>
            <span class="stat-sub"
              >{{ stats()?.todayPayments ?? 0 }} รายการ</span
            >
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card quick-actions">
        <div class="card-header">
          <h3 class="card-title">การดำเนินการด่วน</h3>
        </div>
        <div class="card-body">
          <div class="action-buttons">
            <a routerLink="/create-payment" class="action-btn primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              สร้าง Payment ใหม่
            </a>
            <a routerLink="/payments" class="action-btn secondary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              ดูรายการทั้งหมด
            </a>
            <button class="action-btn tertiary" (click)="loadStats()">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path
                  d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                />
              </svg>
              รีเฟรชข้อมูล
            </button>
          </div>
        </div>
      </div>

      <!-- System Status Card -->
      <div class="card info-card">
        <div class="card-header">
          <h3 class="card-title">สถานะระบบ</h3>
          <button class="btn btn-secondary" (click)="checkHealth()">
            @if (isLoading()) {
            <span class="spinner"></span>
            กำลังตรวจสอบ... } @else { รีเฟรช }
          </button>
        </div>
        <div class="card-body">
          @if (errorMessage()) {
          <div class="alert alert-error">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
          } @else {
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Service Name</span>
              <span class="info-value">{{ serviceName() }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status</span>
              <span class="info-value">
                <span
                  class="badge"
                  [class.badge-success]="apiStatus() === 'UP'"
                  [class.badge-error]="apiStatus() !== 'UP'"
                >
                  {{ apiStatus() }}
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Virtual Threads</span>
              <span class="info-value">
                <span
                  class="badge"
                  [class.badge-info]="virtualThreadsStatus() === 'enabled'"
                  [class.badge-warning]="virtualThreadsStatus() !== 'enabled'"
                >
                  {{ virtualThreadsStatus() }}
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Last Updated</span>
              <span class="info-value">{{ serverTime() }}</span>
            </div>
          </div>
          }
        </div>
      </div>

      <!-- Tech Stack Info -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Technology Stack</h3>
        </div>
        <div class="card-body">
          <div class="tech-grid">
            @for (tech of techStack(); track tech.name) {
            <div class="tech-item">
              <span class="tech-name">{{ tech.name }}</span>
              <span class="tech-version">{{ tech.version }}</span>
            </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-6);
      }

      /* Page Header */
      .page-header {
        h1 {
          margin-bottom: var(--spacing-2);
        }

        p {
          color: var(--color-gray-500);
          margin: 0;
        }
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--spacing-4);
      }

      .amount-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: var(--spacing-4);

        &.primary .stat-icon {
          background-color: var(--color-primary-light);
          color: var(--color-primary);
        }

        &.success .stat-icon {
          background-color: var(--color-success-bg);
          color: var(--color-success);
        }

        &.warning .stat-icon {
          background-color: var(--color-warning-bg);
          color: var(--color-warning);
        }

        &.danger .stat-icon {
          background-color: var(--color-error-bg);
          color: var(--color-error);
        }

        &.large {
          flex-direction: column;
          align-items: flex-start;

          .stat-value {
            font-size: var(--font-size-2xl);

            &.amount {
              color: var(--color-primary);
              font-family: var(--font-family-mono);
            }
          }

          .stat-sub {
            font-size: var(--font-size-sm);
            color: var(--color-gray-500);
          }
        }
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--color-gray-100);
        border-radius: var(--radius-lg);
        flex-shrink: 0;

        svg {
          width: 24px;
          height: 24px;
        }
      }

      .stat-content {
        display: flex;
        flex-direction: column;
      }

      .stat-label {
        font-size: var(--font-size-sm);
        color: var(--color-gray-500);
      }

      .stat-value {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--color-gray-900);
      }

      /* Quick Actions */
      .quick-actions {
        .card-body {
          padding: var(--spacing-4);
        }
      }

      .action-buttons {
        display: flex;
        gap: var(--spacing-3);
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        padding: var(--spacing-3) var(--spacing-4);
        border: none;
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-fast);
        text-decoration: none;

        svg {
          width: 18px;
          height: 18px;
        }

        &.primary {
          background-color: var(--color-primary);
          color: var(--color-white);

          &:hover {
            background-color: var(--color-primary-dark);
          }
        }

        &.secondary {
          background-color: var(--color-gray-100);
          color: var(--color-gray-700);

          &:hover {
            background-color: var(--color-gray-200);
          }
        }

        &.tertiary {
          background-color: transparent;
          border: 1px solid var(--color-gray-300);
          color: var(--color-gray-700);

          &:hover {
            background-color: var(--color-gray-50);
          }
        }
      }

      /* Info Card */
      .info-card {
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-4);
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-1);
      }

      .info-label {
        font-size: var(--font-size-sm);
        color: var(--color-gray-500);
      }

      .info-value {
        font-weight: 500;
        color: var(--color-gray-900);
      }

      /* Alert */
      .alert {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        padding: var(--spacing-4);
        border-radius: var(--radius-lg);

        svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        &.alert-error {
          background-color: var(--color-error-bg);
          color: var(--color-error);
        }
      }

      /* Tech Grid */
      .tech-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--spacing-3);
      }

      .tech-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-3);
        background-color: var(--color-gray-50);
        border-radius: var(--radius-md);
      }

      .tech-name {
        font-weight: 500;
        color: var(--color-gray-700);
      }

      .tech-version {
        font-size: var(--font-size-sm);
        color: var(--color-gray-500);
        background-color: var(--color-white);
        padding: var(--spacing-1) var(--spacing-2);
        border-radius: var(--radius-sm);
      }

      /* Responsive */
      @media (max-width: 1024px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 640px) {
        .stats-grid {
          grid-template-columns: 1fr;
        }

        .amount-stats {
          grid-template-columns: 1fr;
        }

        .action-buttons {
          flex-direction: column;
        }
      }
    `,
  ],
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
  protected readonly apiStatus = signal("CHECKING...");
  protected readonly virtualThreadsStatus = signal("checking...");
  protected readonly serverTime = signal("-");
  protected readonly apiVersion = signal("-");
  protected readonly serviceName = signal("-");

  // Tech Stack Data
  protected readonly techStack = signal([
    { name: "Java", version: "21 LTS" },
    { name: "Spring Boot", version: "3.4.0" },
    { name: "Angular", version: "19.0.0" },
    { name: "MySQL", version: "8.0" },
    { name: "Docker", version: "Latest" },
    { name: "Virtual Threads", version: "Enabled" },
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
        console.error("Failed to load stats:", error);
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

    this.http.get<HealthResponse>("/api/v1/health").subscribe({
      next: (response) => {
        this.apiStatus.set(response.status);
        this.virtualThreadsStatus.set(response.virtualThreads);
        this.serverTime.set(response.timestamp);
        this.apiVersion.set(response.version);
        this.serviceName.set(response.service);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error("Health check failed:", error);
        this.errorMessage.set(
          "ไม่สามารถเชื่อมต่อกับ API Server ได้ กรุณาตรวจสอบว่า Backend กำลังทำงานอยู่"
        );
        this.apiStatus.set("DOWN");
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Format จำนวนเงิน
   */
  protected formatAmount(amount: number): string {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  }
}

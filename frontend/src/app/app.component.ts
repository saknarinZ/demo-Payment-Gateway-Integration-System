/**
 * App Component - Root Component
 *
 * Component หลักของ Application
 * ใช้ Standalone Component และ New Control Flow
 */

import {
  Component,
  signal,
  computed,
  effect,
  inject,
  OnInit,
} from "@angular/core";
import { RouterOutlet, RouterLink, RouterLinkActive } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ApiService } from "@core/services/api.service";

/**
 * AppComponent - Root Component ของ Application
 *
 * ใช้ Signals Architecture สำหรับ State Management
 * - signal() สำหรับ Reactive State
 * - computed() สำหรับ Derived State
 * - effect() สำหรับ Side Effects
 */
@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      <!-- Header / Navigation -->
      <header class="app-header">
        <div class="header-content">
          <!-- Logo -->
          <div class="logo">
            <svg
              class="logo-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span class="logo-text">Payment Gateway</span>
          </div>

          <!-- Navigation -->
          <nav class="nav-menu">
            <a
              routerLink="/dashboard"
              routerLinkActive="active"
              class="nav-link"
            >
              Dashboard
            </a>
            <a
              routerLink="/payments"
              routerLinkActive="active"
              class="nav-link"
            >
              Payments
            </a>
            <a
              routerLink="/create-payment"
              routerLinkActive="active"
              class="nav-link btn-create"
            >
              + สร้าง Payment
            </a>
          </nav>

          <!-- User Info / Actions -->
          <div class="header-actions">
            <span class="status-badge">
              @if (apiService.isConnected()) {
              <span class="status-dot connected"></span>
              เชื่อมต่อแล้ว } @else {
              <span class="status-dot disconnected"></span>
              ไม่ได้เชื่อมต่อ }
            </span>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="app-main">
        <router-outlet />
      </main>

      <!-- Footer -->
      <footer class="app-footer">
        <p>
          © 2025 Payment Gateway Integration System | Version {{ version() }}
        </p>
      </footer>
    </div>
  `,
  styles: [
    `
      /* Layout */
      .app-layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      /* Header */
      .app-header {
        background-color: var(--color-white);
        border-bottom: 1px solid var(--color-gray-200);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-4) var(--spacing-6);
        max-width: 1440px;
        margin: 0 auto;
        width: 100%;
      }

      /* Logo */
      .logo {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
      }

      .logo-icon {
        width: 32px;
        height: 32px;
        color: var(--color-primary);
      }

      .logo-text {
        font-size: var(--font-size-xl);
        font-weight: 700;
        color: var(--color-gray-900);
      }

      /* Navigation */
      .nav-menu {
        display: flex;
        gap: var(--spacing-2);
      }

      .nav-link {
        padding: var(--spacing-2) var(--spacing-4);
        font-weight: 500;
        color: var(--color-gray-600);
        border-radius: var(--radius-lg);
        transition: all var(--transition-fast);

        &:hover {
          color: var(--color-primary);
          background-color: var(--color-primary-light);
        }

        &.active {
          color: var(--color-primary);
          background-color: var(--color-primary-light);
        }

        &.btn-create {
          background-color: var(--color-primary);
          color: var(--color-white);

          &:hover {
            background-color: var(--color-primary-dark);
          }
        }
      }

      /* Header Actions */
      .header-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-4);
      }

      .status-badge {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        font-size: var(--font-size-sm);
        color: var(--color-gray-600);
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;

        &.connected {
          background-color: var(--color-success);
          box-shadow: 0 0 0 2px var(--color-success-bg);
        }

        &.disconnected {
          background-color: var(--color-error);
          box-shadow: 0 0 0 2px var(--color-error-bg);
        }
      }

      /* Main Content */
      .app-main {
        flex: 1;
        padding: var(--spacing-6);
        max-width: 1440px;
        margin: 0 auto;
        width: 100%;
      }

      /* Footer */
      .app-footer {
        background-color: var(--color-white);
        border-top: 1px solid var(--color-gray-200);
        padding: var(--spacing-4) var(--spacing-6);
        text-align: center;

        p {
          margin: 0;
          font-size: var(--font-size-sm);
          color: var(--color-gray-500);
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .header-content {
          padding: var(--spacing-3) var(--spacing-4);
        }

        .logo-text {
          display: none;
        }

        .nav-link {
          padding: var(--spacing-2);
          font-size: var(--font-size-sm);
        }
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  // Inject Services ด้วย inject() function
  protected readonly apiService = inject(ApiService);

  // State ด้วย Signals
  // signal() สร้าง Reactive State
  protected readonly version = signal("1.0.0");

  // Computed State - คำนวณจาก State อื่น
  protected readonly statusText = computed(() =>
    this.apiService.isConnected() ? "เชื่อมต่อแล้ว" : "ไม่ได้เชื่อมต่อ"
  );

  constructor() {
    // Effect - Side Effect เมื่อ State เปลี่ยน
    effect(() => {
      console.log("Connection Status:", this.apiService.isConnected());
    });
  }

  ngOnInit(): void {
    // ตรวจสอบสถานะการเชื่อมต่อเมื่อ App เริ่มทำงาน
    this.apiService.checkHealth();
  }
}

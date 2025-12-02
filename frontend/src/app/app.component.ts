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
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '@core/services/api.service';

/**
 * AppComponent - Root Component ของ Application
 *
 * ใช้ Signals Architecture สำหรับ State Management
 * - signal() สำหรับ Reactive State
 * - computed() สำหรับ Derived State
 * - effect() สำหรับ Side Effects
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  // Inject Services ด้วย inject() function
  protected readonly apiService = inject(ApiService);

  // State ด้วย Signals
  // signal() สร้าง Reactive State
  protected readonly version = signal('1.0.0');

  // Computed State - คำนวณจาก State อื่น
  protected readonly statusText = computed(() =>
    this.apiService.isConnected() ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'
  );

  constructor() {
    // Effect - Side Effect เมื่อ State เปลี่ยน
    effect(() => {
      console.log('Connection Status:', this.apiService.isConnected());
    });
  }

  ngOnInit(): void {
    // ตรวจสอบสถานะการเชื่อมต่อเมื่อ App เริ่มทำงาน
    this.apiService.checkHealth();
  }
}

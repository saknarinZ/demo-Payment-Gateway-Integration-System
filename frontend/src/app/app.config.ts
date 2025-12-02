/**
 * Application Configuration - Angular 19
 *
 * การตั้งค่าหลักของ Angular Application
 * - Zoneless Change Detection
 * - HTTP Client
 * - Router
 */

import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from "@angular/core";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
} from "@angular/common/http";

import { routes } from "./app.routes";

/**
 * Application Configuration Object
 *
 * ใช้ Zoneless Change Detection เพื่อ Performance ที่ดีขึ้น
 * Angular จะใช้ Signals สำหรับ Change Detection แทน Zone.js
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Zoneless Change Detection - ไม่ใช้ Zone.js
    // ทำให้ต้องใช้ Signals สำหรับ State Management
    provideZonelessChangeDetection(),

    // Router Configuration
    // withComponentInputBinding() - ส่ง Route Params เป็น Input ได้
    provideRouter(routes, withComponentInputBinding()),

    // HTTP Client Configuration
    // withFetch() - ใช้ Fetch API แทน XMLHttpRequest
    provideHttpClient(withFetch(), withInterceptors([])),
  ],
};

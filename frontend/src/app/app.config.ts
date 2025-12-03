/**
 * Application Configuration - Angular 19
 *
 * การตั้งค่าหลักของ Angular Application
 * - Zoneless Change Detection
 * - HTTP Client
 * - Router
 */

import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
} from "@angular/common/http";

import { routes } from "./app.routes";
import { PaymentService } from "@core/services/payment.service";
import { MockPaymentService } from "@core/services/mock-payment.service";

/**
 * Application Configuration Object
 *
 * ใช้ Zone Change Detection (Standard)
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Zone Change Detection
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router Configuration
    // withComponentInputBinding() - ส่ง Route Params เป็น Input ได้
    provideRouter(routes, withComponentInputBinding()),

    // HTTP Client Configuration
    // withFetch() - ใช้ Fetch API แทน XMLHttpRequest
    provideHttpClient(withFetch(), withInterceptors([])),
  ],
};

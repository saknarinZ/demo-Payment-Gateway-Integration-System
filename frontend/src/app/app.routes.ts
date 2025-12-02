/**
 * Application Routes - Angular Router Configuration
 *
 * กำหนดเส้นทาง URL ของ Application
 * ใช้ Lazy Loading สำหรับ Performance
 */

import { Routes } from "@angular/router";

export const routes: Routes = [
  // หน้าแรก - Redirect ไป Dashboard
  {
    path: "",
    redirectTo: "dashboard",
    pathMatch: "full",
  },

  // Dashboard Route
  {
    path: "dashboard",
    loadComponent: () =>
      import("./features/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent
      ),
    title: "Dashboard - Payment Gateway",
  },

  // Payments Route - รายการ Payment
  {
    path: "payments",
    loadComponent: () =>
      import("./features/payments/payment-list/payment-list.component").then(
        (m) => m.PaymentListComponent
      ),
    title: "Payments - Payment Gateway",
  },

  // Payment Detail Route
  {
    path: "payments/:referenceId",
    loadComponent: () =>
      import(
        "./features/payments/payment-detail/payment-detail.component"
      ).then((m) => m.PaymentDetailComponent),
    title: "Payment Detail - Payment Gateway",
  },

  // Create Payment Route
  {
    path: "create-payment",
    loadComponent: () =>
      import("./features/payments/payment-form/payment-form.component").then(
        (m) => m.PaymentFormComponent
      ),
    title: "Create Payment - Payment Gateway",
  },

  // Wildcard Route - หน้าที่ไม่พบ
  {
    path: "**",
    redirectTo: "dashboard",
  },
];

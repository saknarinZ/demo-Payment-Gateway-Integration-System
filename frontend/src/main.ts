/**
 * Main Entry Point - Angular Application Bootstrap
 *
 * จุดเริ่มต้นของ Angular Application
 * ใช้ Zoneless Change Detection สำหรับ Performance ที่ดีขึ้น
 */

import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";

// Bootstrap Angular Application พร้อม Configuration
bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error("เกิดข้อผิดพลาดในการเริ่มต้น Application:", err)
);

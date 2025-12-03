/**
 * Menu Item Component - แสดงการ์ดเมนูแต่ละรายการ
 *
 * Type: Dumb/Presentational Component
 * - รับข้อมูลผ่าน @Input
 * - ส่ง event ผ่าน @Output
 * - ไม่มี business logic
 */

import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MenuItem } from "@core/models/shop.model";

@Component({
  selector: "app-menu-item",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./menu-item.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemComponent {
  // =====================================================
  // INPUTS - Data from Parent
  // =====================================================

  /** ข้อมูลเมนู */
  readonly item = input.required<MenuItem>();

  // =====================================================
  // OUTPUTS - Events to Parent
  // =====================================================

  /** Event เมื่อกดเพิ่มลงตะกร้า */
  readonly addToCart = output<MenuItem>();

  // =====================================================
  // VIEW HELPERS
  // =====================================================

  /**
   * Format ราคา
   */
  protected formatPrice(price: number): string {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(price);
  }

  /**
   * Check if the image string is a URL path
   */
  protected isImage(url: string): boolean {
    return url.includes("/") || url.includes(".");
  }

  /**
   * Handle click เพิ่มลงตะกร้า
   */
  protected onAddToCart(): void {
    this.addToCart.emit(this.item());
  }
}

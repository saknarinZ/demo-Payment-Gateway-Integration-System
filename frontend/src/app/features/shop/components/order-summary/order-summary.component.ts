/**
 * Order Summary Component - แสดงสรุปรายการสั่งซื้อ
 *
 * Type: Dumb/Presentational Component
 * - รับข้อมูลผ่าน @Input
 * - ไม่มี @Output (แสดงผลอย่างเดียว)
 */

import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CartItem } from "@core/models/shop.model";

@Component({
  selector: "app-order-summary",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./order-summary.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSummaryComponent {
  // =====================================================
  // INPUTS - Data from Parent
  // =====================================================

  /** รายการในตะกร้า */
  readonly items = input.required<CartItem[]>();

  /** ราคารวม */
  readonly total = input.required<number>();

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
}

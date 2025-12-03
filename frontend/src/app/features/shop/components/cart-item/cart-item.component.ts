/**
 * Cart Item Component - แสดงรายการในตะกร้าแต่ละรายการ
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
import { CartItem } from "@core/models/shop.model";

@Component({
  selector: "app-cart-item",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./cart-item.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartItemComponent {
  // =====================================================
  // INPUTS - Data from Parent
  // =====================================================

  /** ข้อมูลรายการในตะกร้า */
  readonly cartItem = input.required<CartItem>();

  // =====================================================
  // OUTPUTS - Events to Parent
  // =====================================================

  /** Event เมื่อเปลี่ยนจำนวน */
  readonly quantityChange = output<{ itemId: number; quantity: number }>();

  /** Event เมื่อลบรายการ */
  readonly remove = output<number>();

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
   * เพิ่มจำนวน
   */
  protected increment(): void {
    const item = this.cartItem();
    this.quantityChange.emit({
      itemId: item.item.id,
      quantity: item.quantity + 1,
    });
  }

  /**
   * ลดจำนวน
   */
  protected decrement(): void {
    const item = this.cartItem();
    this.quantityChange.emit({
      itemId: item.item.id,
      quantity: item.quantity - 1,
    });
  }

  /**
   * ลบรายการ
   */
  protected onRemove(): void {
    this.remove.emit(this.cartItem().item.id);
  }
}

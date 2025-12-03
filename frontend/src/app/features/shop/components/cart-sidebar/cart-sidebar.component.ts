/**
 * Cart Sidebar Component - แสดงตะกร้าสินค้าด้านข้าง
 *
 * Type: Dumb/Presentational Component
 * - รับข้อมูลผ่าน @Input
 * - ส่ง event ผ่าน @Output
 * - ใช้ CartItemComponent เป็น child
 */

import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { CartItem } from "@core/models/shop.model";
import { CartItemComponent } from "../cart-item/cart-item.component";

@Component({
  selector: "app-cart-sidebar",
  standalone: true,
  imports: [CommonModule, CartItemComponent],
  templateUrl: "./cart-sidebar.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartSidebarComponent {
  // =====================================================
  // INPUTS - Data from Parent
  // =====================================================

  /** รายการในตะกร้า */
  readonly items = input.required<CartItem[]>();

  /** ราคารวม */
  readonly total = input.required<number>();

  /** Mobile mode - ไม่แสดง background/shadow (ใช้ใน bottom sheet) */
  readonly isMobile = input<boolean>(false);

  // =====================================================
  // OUTPUTS - Events to Parent
  // =====================================================

  /** Event เมื่อเปลี่ยนจำนวน */
  readonly quantityChange = output<{ itemId: number; quantity: number }>();

  /** Event เมื่อลบรายการ */
  readonly removeItem = output<number>();

  /** Event เมื่อกด checkout */
  readonly checkout = output<void>();

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
   * Handle quantity change from cart item
   */
  protected onQuantityChange(event: {
    itemId: number;
    quantity: number;
  }): void {
    this.quantityChange.emit(event);
  }

  /**
   * Handle remove from cart item
   */
  protected onRemoveItem(itemId: number): void {
    this.removeItem.emit(itemId);
  }

  /**
   * Handle checkout click
   */
  protected onCheckout(): void {
    this.checkout.emit();
  }
}

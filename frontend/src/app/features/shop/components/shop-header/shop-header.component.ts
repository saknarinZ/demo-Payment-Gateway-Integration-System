/**
 * Shop Header Component - Header ของหน้าร้าน
 *
 * Type: Dumb/Presentational Component
 * - รับข้อมูลผ่าน @Input
 * - ส่ง event ผ่าน @Output
 */

import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-shop-header",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./shop-header.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopHeaderComponent {
  // =====================================================
  // INPUTS - Data from Parent
  // =====================================================

  /** ชื่อร้าน */
  readonly shopName = input<string>("🍜 ครัวคุณแม่");

  /** คำอธิบายร้าน */
  readonly tagline = input<string>("อร่อยทุกจาน สั่งง่าย จ่ายสะดวก");

  /** จำนวนสินค้าในตะกร้า */
  readonly cartItemCount = input<number>(0);

  /** ราคารวม */
  readonly cartTotal = input<number>(0);

  /** Mobile cart drawer เปิดอยู่หรือไม่ */
  readonly showMobileCart = input<boolean>(false);

  // =====================================================
  // OUTPUTS - Events to Parent
  // =====================================================

  /** Event เมื่อกดปุ่มตะกร้า */
  readonly cartClick = output<void>();

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
   * Handle cart button click
   */
  protected onCartClick(): void {
    this.cartClick.emit();
  }
}

/**
 * Cart Service - จัดการตะกร้าสินค้า
 *
 * MVC Pattern: Service Layer (Business Logic)
 * - Single Responsibility: จัดการ Cart อย่างเดียว
 * - State Management ด้วย Signals
 * - Encapsulates ShoppingCart business logic
 */

import { Injectable, signal, computed } from "@angular/core";
import {
  MenuItem,
  CartItem,
  ShoppingCart,
  CustomerInfo,
} from "@core/models/shop.model";

@Injectable({
  providedIn: "root",
})
export class CartService {
  // Private state - ใช้ ShoppingCart class
  private readonly cart = new ShoppingCart();

  // Signal สำหรับ trigger re-render
  private readonly _cartVersion = signal(0);

  // Customer info
  private readonly _customerInfo = signal(new CustomerInfo());

  // =====================================================
  // COMPUTED SIGNALS - Derived State
  // =====================================================

  /**
   * รายการในตะกร้า (reactive)
   */
  readonly items = computed(() => {
    this._cartVersion(); // Subscribe to changes
    return this.cart.getItems();
  });

  /**
   * จำนวนรายการ
   */
  readonly itemCount = computed(() => {
    this._cartVersion();
    return this.cart.getItemCount();
  });

  /**
   * ราคารวม
   */
  readonly total = computed(() => {
    this._cartVersion();
    return this.cart.getTotal();
  });

  /**
   * ราคารวม formatted
   */
  readonly formattedTotal = computed(() => {
    this._cartVersion();
    return this.cart.getFormattedTotal();
  });

  /**
   * ตะกร้าว่างหรือไม่
   */
  readonly isEmpty = computed(() => {
    this._cartVersion();
    return this.cart.isEmpty();
  });

  /**
   * Order description
   */
  readonly orderDescription = computed(() => {
    this._cartVersion();
    return this.cart.getOrderDescription();
  });

  /**
   * Customer info (readonly signal)
   */
  readonly customerInfo = this._customerInfo.asReadonly();

  // =====================================================
  // CART OPERATIONS
  // =====================================================

  /**
   * เพิ่มสินค้าลงตะกร้า
   */
  addItem(menuItem: MenuItem, quantity: number = 1): void {
    this.cart.addItem(menuItem, quantity);
    this.notifyChange();
  }

  /**
   * ลบสินค้าออกจากตะกร้า
   */
  removeItem(itemId: number): void {
    this.cart.removeItem(itemId);
    this.notifyChange();
  }

  /**
   * อัพเดทจำนวน
   */
  updateQuantity(itemId: number, quantity: number): void {
    this.cart.updateQuantity(itemId, quantity);
    this.notifyChange();
  }

  /**
   * เพิ่มจำนวน +1
   */
  incrementItem(itemId: number): void {
    const item = this.cart.getItems().find((i) => i.item.id === itemId);
    if (item) {
      this.updateQuantity(itemId, item.quantity + 1);
    }
  }

  /**
   * ลดจำนวน -1
   */
  decrementItem(itemId: number): void {
    const item = this.cart.getItems().find((i) => i.item.id === itemId);
    if (item) {
      this.updateQuantity(itemId, item.quantity - 1);
    }
  }

  /**
   * ล้างตะกร้า
   */
  clearCart(): void {
    this.cart.clear();
    this.notifyChange();
  }

  // =====================================================
  // CUSTOMER INFO OPERATIONS
  // =====================================================

  /**
   * อัพเดทชื่อลูกค้า
   */
  setCustomerName(name: string): void {
    const info = this._customerInfo();
    this._customerInfo.set(
      new CustomerInfo(name, info.phone, info.tableNumber)
    );
  }

  /**
   * อัพเดทเบอร์โทร
   */
  setCustomerPhone(phone: string): void {
    const info = this._customerInfo();
    this._customerInfo.set(
      new CustomerInfo(info.name, phone, info.tableNumber)
    );
  }

  /**
   * อัพเดทหมายเลขโต๊ะ
   */
  setTableNumber(tableNumber: string): void {
    const info = this._customerInfo();
    this._customerInfo.set(
      new CustomerInfo(info.name, info.phone, tableNumber)
    );
  }

  /**
   * รีเซ็ตข้อมูลลูกค้า
   */
  resetCustomerInfo(): void {
    this._customerInfo.set(new CustomerInfo());
  }

  // =====================================================
  // VALIDATION
  // =====================================================

  /**
   * ตรวจสอบว่าสามารถ checkout ได้หรือไม่
   */
  canCheckout(): boolean {
    return !this.cart.isEmpty();
  }

  // =====================================================
  // PRIVATE HELPERS
  // =====================================================

  /**
   * Notify subscribers ว่า cart เปลี่ยนแปลง
   */
  private notifyChange(): void {
    this._cartVersion.update((v) => v + 1);
  }
}

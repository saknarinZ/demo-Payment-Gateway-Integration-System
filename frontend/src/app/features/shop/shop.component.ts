/**
 * Shop Component - หน้าร้านค้า E-Commerce Demo
 *
 * MVC Pattern: Smart Container Component
 * - Coordinate child components
 * - Delegate business logic ไปยัง Services
 * - ไม่มี UI logic ในตัวเอง
 *
 * Architecture:
 * - MenuService: จัดการข้อมูลเมนู
 * - CartService: จัดการตะกร้าสินค้า
 * - OrderService: จัดการการสั่งซื้อ
 */

import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";

// Services (Business Logic Layer)
import { MenuService } from "@core/services/menu.service";
import { CartService } from "@core/services/cart.service";
import { OrderService } from "@core/services/order.service";

// Models (Data Layer)
import { MenuItem } from "@core/models/shop.model";

// Child Components (Presentational Layer)
import {
  ShopHeaderComponent,
  MenuItemComponent,
  CartSidebarComponent,
  CheckoutModalComponent,
  FormChangeEvent,
} from "./components";

@Component({
  selector: "app-shop",
  standalone: true,
  imports: [
    CommonModule,
    ShopHeaderComponent,
    MenuItemComponent,
    CartSidebarComponent,
    CheckoutModalComponent,
  ],
  templateUrl: "./shop.component.html",
  styleUrls: ["./shop.component.scss"],
})
export class ShopComponent {
  // =====================================================
  // DEPENDENCY INJECTION - Services
  // =====================================================

  private readonly menuService = inject(MenuService);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);

  // =====================================================
  // VIEW STATE - Local UI State Only
  // =====================================================

  protected readonly showCheckoutForm = signal(false);
  protected readonly showMobileCart = signal(false);

  // =====================================================
  // COMPUTED - Derived from Services (Read-only Proxies)
  // =====================================================

  // Menu Data (from MenuService)
  protected readonly menuItems = this.menuService.menuItems;

  // Cart Data (from CartService)
  protected readonly cart = this.cartService.items;
  protected readonly cartTotal = this.cartService.total;
  protected readonly cartItemCount = this.cartService.itemCount;
  protected readonly customerInfo = this.cartService.customerInfo;

  // Form validation
  protected readonly isFormValid = computed(() => {
    return this.cartService.canCheckout();
  });

  // Order State (from OrderService)
  protected readonly processing = this.orderService.processing;
  protected readonly error = this.orderService.error;

  // Customer form bindings (computed from service)
  protected readonly customerName = computed(() => this.customerInfo().name);
  protected readonly customerPhone = computed(() => this.customerInfo().phone);
  protected readonly tableNumber = computed(
    () => this.customerInfo().tableNumber
  );

  // =====================================================
  // EVENT HANDLERS - From Child Components
  // =====================================================

  /**
   * Handle add to cart from MenuItemComponent
   */
  protected onAddToCart(menuItem: MenuItem): void {
    this.cartService.addItem(menuItem);
  }

  /**
   * Handle quantity change from CartSidebarComponent
   */
  protected onQuantityChange(event: {
    itemId: number;
    quantity: number;
  }): void {
    this.cartService.updateQuantity(event.itemId, event.quantity);
  }

  /**
   * Handle remove item from CartSidebarComponent
   */
  protected onRemoveItem(itemId: number): void {
    this.cartService.removeItem(itemId);
  }

  /**
   * Handle checkout click from CartSidebarComponent or ShopHeaderComponent
   */
  protected onCheckout(): void {
    if (this.cartService.isEmpty()) return;
    this.showMobileCart.set(false); // ปิด mobile cart drawer
    this.showCheckoutForm.set(true);
  }

  /**
   * Toggle mobile cart drawer
   */
  protected onCartToggle(): void {
    if (this.cartService.isEmpty()) return;
    this.showMobileCart.update((v) => !v);
  }

  /**
   * Close mobile cart drawer
   */
  protected closeMobileCart(): void {
    this.showMobileCart.set(false);
  }

  /**
   * Checkout from mobile cart (close drawer first)
   */
  protected onMobileCheckout(): void {
    this.showMobileCart.set(false);
    setTimeout(() => this.showCheckoutForm.set(true), 200);
  }

  /**
   * Format price for display
   */
  protected formatPrice(price: number): string {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(price);
  }

  /**
   * Handle modal close from CheckoutModalComponent
   */
  protected onModalClose(): void {
    this.showCheckoutForm.set(false);
    this.orderService.clearError();
  }

  /**
   * Handle form field change from CheckoutModalComponent
   */
  protected onFormChange(event: FormChangeEvent): void {
    switch (event.field) {
      case "name":
        this.cartService.setCustomerName(event.value);
        break;
      case "phone":
        this.cartService.setCustomerPhone(event.value);
        break;
      case "tableNumber":
        this.cartService.setTableNumber(event.value);
        break;
    }
  }

  /**
   * Handle form submit from CheckoutModalComponent
   */
  protected onFormSubmit(): void {
    if (!this.isFormValid()) return;

    this.orderService.placeOrder().subscribe({
      // Success handling is done in OrderService (redirect)
      error: () => {
        // Error is already set in OrderService
      },
    });
  }
}

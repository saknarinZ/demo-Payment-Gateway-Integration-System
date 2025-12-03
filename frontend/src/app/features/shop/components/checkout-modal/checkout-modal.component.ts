/**
 * Checkout Modal Component - Modal สำหรับกรอกข้อมูลและชำระเงิน
 *
 * Type: Smart Component (มี Form logic)
 * - รับข้อมูลผ่าน @Input
 * - ส่ง event ผ่าน @Output
 * - จัดการ Form State
 */

import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CartItem } from "@core/models/shop.model";
import { OrderSummaryComponent } from "../order-summary/order-summary.component";

/**
 * Customer Form Data Interface
 */
export interface CustomerFormData {
  name: string;
  phone: string;
  tableNumber: string;
}

/**
 * Form Change Event
 */
export interface FormChangeEvent {
  field: "name" | "phone" | "tableNumber";
  value: string;
}

@Component({
  selector: "app-checkout-modal",
  standalone: true,
  imports: [CommonModule, FormsModule, OrderSummaryComponent],
  templateUrl: "./checkout-modal.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutModalComponent {
  // =====================================================
  // INPUTS - Data from Parent
  // =====================================================

  /** รายการในตะกร้า */
  readonly items = input.required<CartItem[]>();

  /** ราคารวม */
  readonly total = input.required<number>();

  /** Customer form data */
  readonly customerName = input<string>("");
  readonly customerPhone = input<string>("");
  readonly tableNumber = input<string>("");

  /** Form validation state */
  readonly isFormValid = input<boolean>(false);

  /** Processing state */
  readonly processing = input<boolean>(false);

  /** Error message */
  readonly error = input<string | null>(null);

  // =====================================================
  // OUTPUTS - Events to Parent
  // =====================================================

  /** Event เมื่อปิด modal */
  readonly close = output<void>();

  /** Event เมื่อ form field เปลี่ยน */
  readonly formChange = output<FormChangeEvent>();

  /** Event เมื่อ submit form */
  readonly submit = output<void>();

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
   * Handle close
   */
  protected onClose(): void {
    this.close.emit();
  }

  /**
   * Handle backdrop click
   */
  protected onBackdropClick(): void {
    this.close.emit();
  }

  /**
   * Prevent event propagation
   */
  protected onModalClick(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Handle name change
   */
  protected onNameChange(value: string): void {
    this.formChange.emit({ field: "name", value });
  }

  /**
   * Handle phone change
   */
  protected onPhoneChange(value: string): void {
    this.formChange.emit({ field: "phone", value });
  }

  /**
   * Handle table number change
   */
  protected onTableChange(value: string): void {
    this.formChange.emit({ field: "tableNumber", value });
  }

  /**
   * Handle form submit
   */
  protected onSubmit(): void {
    this.submit.emit();
  }
}

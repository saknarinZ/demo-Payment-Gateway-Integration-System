/**
 * OmiseCheckoutComponent - หน้า Checkout ด้วย Omise
 * 
 * Features:
 * - Form กรอกข้อมูลบัตร
 * - Validation แบบ Real-time
 * - Loading States
 * - 3D Secure Support
 * - Mobile Responsive
 */

import { Component, signal, computed, inject, input, output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OmisePaymentService, CardInfo } from '../../core/services/omise-payment.service';

@Component({
  selector: 'app-omise-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './omise-checkout.component.html'
})
export class OmiseCheckoutComponent implements OnInit, OnDestroy {

  private readonly omiseService = inject(OmisePaymentService);

  // =========================================================================
  // Inputs
  // =========================================================================

  /** จำนวนเงินที่ต้องจ่าย (บาท) */
  readonly amount = input.required<number>();

  /** คำอธิบาย Order */
  readonly description = input<string>('');

  /** Order ID */
  readonly orderId = input<string>('');

  /** Return URL หลัง 3D Secure */
  readonly returnUri = input<string>('');

  /** ข้อมูลลูกค้า */
  readonly customerEmail = input<string>('');
  readonly customerName = input<string>('');

  // =========================================================================
  // Outputs
  // =========================================================================

  /** เมื่อชำระเงินสำเร็จ */
  readonly paymentSuccess = output<{ chargeId: string; amount: number }>();

  /** เมื่อชำระเงินล้มเหลว */
  readonly paymentFailed = output<{ error: string }>();

  /** เมื่อต้อง Redirect ไป 3D Secure */
  readonly requiresAuth = output<{ authorizeUri: string }>();

  /** เมื่อกดยกเลิก */
  readonly cancelled = output<void>();

  // =========================================================================
  // State (Signals)
  // =========================================================================

  /** ข้อมูลบัตร */
  readonly cardName = signal('');
  readonly cardNumber = signal('');
  readonly expiryMonth = signal('');
  readonly expiryYear = signal('');
  readonly cvv = signal('');

  /** UI State */
  readonly showCvv = signal(false);
  readonly acceptedTerms = signal(false);
  readonly saveCard = signal(false);

  /** Focus State */
  readonly focusedField = signal<string | null>(null);

  // =========================================================================
  // From Service (Computed)
  // =========================================================================

  readonly isLoading = this.omiseService.isLoading;
  readonly error = this.omiseService.error;
  readonly isSuccess = this.omiseService.isSuccess;
  readonly isTestMode = this.omiseService.isTestMode;
  readonly omiseLoaded = this.omiseService.omiseLoaded;
  readonly state = this.omiseService.state;

  // =========================================================================
  // Computed
  // =========================================================================

  /** Format Card Number (แสดงผล) */
  readonly formattedCardNumber = computed(() => {
    const raw = this.cardNumber().replace(/\s/g, '');
    const groups = raw.match(/.{1,4}/g) || [];
    return groups.join(' ');
  });

  /** Card Brand */
  readonly cardBrand = computed(() => {
    const num = this.cardNumber().replace(/\s/g, '');
    if (num.startsWith('4')) return 'visa';
    if (num.startsWith('5') || num.startsWith('2')) return 'mastercard';
    if (num.startsWith('34') || num.startsWith('37')) return 'amex';
    if (num.startsWith('62')) return 'unionpay';
    if (num.startsWith('35')) return 'jcb';
    return null;
  });

  /** Card Brand Icon */
  readonly cardBrandIcon = computed(() => {
    const brand = this.cardBrand();
    switch (brand) {
      case 'visa': return '💳 Visa';
      case 'mastercard': return '💳 Mastercard';
      case 'amex': return '💳 Amex';
      case 'jcb': return '💳 JCB';
      case 'unionpay': return '💳 UnionPay';
      default: return '💳';
    }
  });

  /** Validation: Card Number */
  readonly isCardNumberValid = computed(() => {
    const num = this.cardNumber().replace(/\s/g, '');
    return num.length >= 13 && num.length <= 19 && /^\d+$/.test(num);
  });

  /** Validation: Expiry */
  readonly isExpiryValid = computed(() => {
    const month = parseInt(this.expiryMonth());
    const year = parseInt(this.expiryYear());
    
    if (isNaN(month) || isNaN(year)) return false;
    if (month < 1 || month > 12) return false;
    if (year < new Date().getFullYear()) return false;
    if (year === new Date().getFullYear() && month < new Date().getMonth() + 1) return false;
    
    return true;
  });

  /** Validation: CVV */
  readonly isCvvValid = computed(() => {
    const cvv = this.cvv();
    return /^\d{3,4}$/.test(cvv);
  });

  /** Validation: Name */
  readonly isNameValid = computed(() => {
    return this.cardName().trim().length >= 2;
  });

  /** Form Valid? */
  readonly isFormValid = computed(() => {
    return this.isCardNumberValid() &&
           this.isExpiryValid() &&
           this.isCvvValid() &&
           this.isNameValid() &&
           this.acceptedTerms() &&
           this.omiseLoaded();
  });

  /** Amount Display (บาท) */
  readonly displayAmount = computed(() => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(this.amount());
  });

  /** Years สำหรับ Dropdown */
  readonly years = computed(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => currentYear + i);
  });

  /** Months สำหรับ Dropdown */
  readonly months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  // =========================================================================
  // Lifecycle
  // =========================================================================

  ngOnInit(): void {
    // Reset state เมื่อเปิด Component
    this.omiseService.reset();
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  // =========================================================================
  // Event Handlers
  // =========================================================================

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // ลบ non-digits และ format
    let value = input.value.replace(/\D/g, '');
    // จำกัด 19 หลัก
    value = value.substring(0, 19);
    this.cardNumber.set(value);
  }

  onCvvInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    value = value.substring(0, 4);
    this.cvv.set(value);
  }

  toggleCvvVisibility(): void {
    this.showCvv.update(v => !v);
  }

  setFocus(field: string): void {
    this.focusedField.set(field);
  }

  clearFocus(): void {
    this.focusedField.set(null);
  }

  // =========================================================================
  // Payment
  // =========================================================================

  async submitPayment(): Promise<void> {
    if (!this.isFormValid() || this.isLoading()) {
      return;
    }

    const card: CardInfo = {
      name: this.cardName(),
      number: this.cardNumber(),
      expirationMonth: this.expiryMonth(),
      expirationYear: this.expiryYear(),
      securityCode: this.cvv()
    };

    try {
      const response = await this.omiseService.payWithCard(
        card,
        this.amount(),
        this.description(),
        {
          returnUri: this.returnUri() || window.location.href,
          orderId: this.orderId(),
          customerEmail: this.customerEmail(),
          customerName: this.customerName()
        }
      );

      // ตรวจสอบผลลัพธ์
      if (response.paid) {
        // ชำระเงินสำเร็จ
        this.paymentSuccess.emit({
          chargeId: response.id,
          amount: response.amount / 100  // แปลงกลับเป็นบาท
        });
      } else if (response.authorizeUri) {
        // ต้อง 3D Secure
        this.requiresAuth.emit({
          authorizeUri: response.authorizeUri
        });
        // Auto redirect
        setTimeout(() => {
          this.omiseService.redirectToAuthorize();
        }, 2000);
      } else {
        // รอ Webhook
        this.paymentSuccess.emit({
          chargeId: response.id,
          amount: response.amount / 100
        });
      }

    } catch (err: any) {
      this.paymentFailed.emit({
        error: err.message || 'Payment failed'
      });
    }
  }

  cancel(): void {
    this.omiseService.reset();
    this.cancelled.emit();
  }

  retry(): void {
    this.omiseService.reset();
    // Clear sensitive data
    this.cvv.set('');
  }

  // =========================================================================
  // Test Cards (for Test Mode)
  // =========================================================================

  readonly testCards = [
    { name: 'Successful Charge', number: '4242424242424242', cvv: '123' },
    { name: '3D Secure Required', number: '4111111111111111', cvv: '123' },
    { name: 'Insufficient Funds', number: '4111111111160013', cvv: '123' },
    { name: 'Stolen Card', number: '4111111111160021', cvv: '123' },
  ];

  fillTestCard(index: number): void {
    const card = this.testCards[index];
    this.cardNumber.set(card.number);
    this.cvv.set(card.cvv);
    this.cardName.set('TEST USER');
    this.expiryMonth.set('12');
    this.expiryYear.set((new Date().getFullYear() + 2).toString());
  }
}

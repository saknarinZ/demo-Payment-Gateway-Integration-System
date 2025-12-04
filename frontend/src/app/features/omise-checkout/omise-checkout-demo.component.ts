/**
 * Omise Checkout Demo Page
 * 
 * หน้า Demo ที่แสดงการใช้งาน OmiseCheckoutComponent
 * สามารถกรอกจำนวนเงินและทดสอบการชำระเงินได้
 */

import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OmiseCheckoutComponent } from './omise-checkout.component';

@Component({
  selector: 'app-omise-checkout-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, OmiseCheckoutComponent],
  template: `
    <div class="min-h-screen bg-slate-900">
      @if (!showCheckout()) {
        <!-- Demo Input Form -->
        <div class="max-w-md mx-auto pt-20 px-4">
          <div class="bg-slate-800 rounded-2xl p-8 shadow-xl">
            <h1 class="text-2xl font-bold text-white mb-6 text-center">
              Omise Payment Demo
            </h1>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm text-slate-400 mb-2">Amount (THB)</label>
                <input
                  type="number"
                  [ngModel]="amount()"
                  (ngModelChange)="amount.set($event)"
                  min="20"
                  step="1"
                  class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl 
                         text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <label class="block text-sm text-slate-400 mb-2">Description</label>
                <input
                  type="text"
                  [ngModel]="description()"
                  (ngModelChange)="description.set($event)"
                  class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl 
                         text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Order #12345"
                />
              </div>
              
              <button
                (click)="startCheckout()"
                [disabled]="amount() < 20"
                class="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 
                       text-white font-semibold rounded-xl hover:from-blue-500 
                       hover:to-purple-500 transition-all disabled:opacity-50 
                       disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>
            </div>
            
            <p class="mt-4 text-center text-sm text-slate-500">
              Minimum amount: ฿20.00
            </p>
          </div>
        </div>
      } @else {
        <!-- Omise Checkout -->
        <app-omise-checkout
          [amount]="amount()"
          [description]="description()"
          [orderId]="orderId()"
          (paymentSuccess)="onPaymentSuccess($event)"
          (paymentFailed)="onPaymentFailed($event)"
          (requiresAuth)="onRequiresAuth($event)"
          (cancelled)="onCancelled()"
        />
      }
      
      <!-- Result Modal -->
      @if (showResult()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div class="bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            @if (paymentResult()?.success) {
              <div class="text-center">
                <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <h2 class="text-xl font-bold text-white mb-2">Payment Successful!</h2>
                <p class="text-slate-400 mb-2">Charge ID: {{ paymentResult()?.chargeId }}</p>
                <p class="text-2xl font-bold text-green-500 mb-6">
                  {{ paymentResult()?.amount | currency:'THB':'symbol':'1.2-2' }}
                </p>
              </div>
            } @else {
              <div class="text-center">
                <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </div>
                <h2 class="text-xl font-bold text-white mb-2">Payment Failed</h2>
                <p class="text-red-400 mb-6">{{ paymentResult()?.error }}</p>
              </div>
            }
            
            <button
              (click)="resetDemo()"
              class="w-full py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class OmiseCheckoutDemoComponent {
  private readonly router = inject(Router);

  // State
  readonly amount = signal(100);
  readonly description = signal('Test Payment');
  readonly orderId = signal(`ORD-${Date.now()}`);
  readonly showCheckout = signal(false);
  readonly showResult = signal(false);
  readonly paymentResult = signal<{
    success: boolean;
    chargeId?: string;
    amount?: number;
    error?: string;
  } | null>(null);

  startCheckout(): void {
    if (this.amount() >= 20) {
      this.orderId.set(`ORD-${Date.now()}`);
      this.showCheckout.set(true);
    }
  }

  onPaymentSuccess(event: { chargeId: string; amount: number }): void {
    this.paymentResult.set({
      success: true,
      chargeId: event.chargeId,
      amount: event.amount
    });
    this.showResult.set(true);
    this.showCheckout.set(false);
  }

  onPaymentFailed(event: { error: string }): void {
    this.paymentResult.set({
      success: false,
      error: event.error
    });
    this.showResult.set(true);
    this.showCheckout.set(false);
  }

  onRequiresAuth(event: { authorizeUri: string }): void {
    // จะ redirect อัตโนมัติจาก OmiseCheckoutComponent
    console.log('Redirecting to:', event.authorizeUri);
  }

  onCancelled(): void {
    this.showCheckout.set(false);
  }

  resetDemo(): void {
    this.showResult.set(false);
    this.paymentResult.set(null);
    this.showCheckout.set(false);
  }
}

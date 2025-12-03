/**
 * Payment Detail Component - Unit Tests
 *
 * ทดสอบ Component สำหรับแสดงรายละเอียดของ Payment
 * รวมถึงประวัติ Transactions และ Actions ต่างๆ
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { provideRouter, ActivatedRoute } from "@angular/router";
import { of, throwError, Subject } from "rxjs";

import { PaymentDetailComponent } from "./payment-detail.component";
import { PaymentService } from "@core/services/payment.service";
import {
  PaymentResponse,
  PaymentStatus,
  TransactionType,
  TransactionStatus,
} from "@core/models/payment.model";

describe("PaymentDetailComponent", () => {
  let component: PaymentDetailComponent;
  let fixture: ComponentFixture<PaymentDetailComponent>;
  let paymentServiceSpy: jasmine.SpyObj<PaymentService>;
  let paramsSubject: Subject<{ referenceId: string }>;

  // Mock Payment Data
  const mockPayment: PaymentResponse = {
    id: 1,
    referenceId: "PAY-123456789",
    merchantId: 1,
    amount: 1000.0,
    currency: "THB",
    paymentMethod: "CREDIT_CARD",
    status: "PENDING" as PaymentStatus,
    description: "Test Payment",
    customerEmail: "customer@example.com",
    customerName: "Test Customer",
    callbackUrl: null,
    transactions: [
      {
        id: 1,
        transactionId: "TXN-123",
        type: "CHARGE" as TransactionType,
        amount: 1000.0,
        status: "PENDING" as TransactionStatus,
        gatewayReference: "REF-123",
        createdAt: "2025-01-01T12:00:00",
      },
    ],
    createdAt: "2025-01-01T12:00:00",
    completedAt: null,
  };

  const mockCompletedPayment: PaymentResponse = {
    ...mockPayment,
    status: "COMPLETED" as PaymentStatus,
  };

  const mockCancelledPayment: PaymentResponse = {
    ...mockPayment,
    status: "CANCELLED" as PaymentStatus,
  };

  const mockRefundedPayment: PaymentResponse = {
    ...mockPayment,
    status: "REFUNDED" as PaymentStatus,
  };

  beforeEach(async () => {
    paramsSubject = new Subject();

    paymentServiceSpy = jasmine.createSpyObj("PaymentService", [
      "getPaymentByReference",
      "completePaymentDirect",
      "cancelPaymentDirect",
      "refundPaymentDirect",
    ]);

    await TestBed.configureTestingModule({
      imports: [PaymentDetailComponent],
      providers: [
        provideRouter([]),
        { provide: PaymentService, useValue: paymentServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentDetailComponent);
    component = fixture.componentInstance;
  });
  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Initialization", () => {
    it("should load payment on init when referenceId is provided", fakeAsync(() => {
      paymentServiceSpy.getPaymentByReference.and.returnValue(of(mockPayment));

      fixture.detectChanges();
      paramsSubject.next({ referenceId: "PAY-123456789" });
      tick();

      expect(paymentServiceSpy.getPaymentByReference).toHaveBeenCalledWith(
        "PAY-123456789"
      );
      expect(component["payment"]()).toEqual(mockPayment);
      expect(component["loading"]()).toBeFalse();
    }));

    it("should handle error when loading payment fails", fakeAsync(() => {
      paymentServiceSpy.getPaymentByReference.and.returnValue(
        throwError(() => new Error("Payment not found"))
      );

      fixture.detectChanges();
      paramsSubject.next({ referenceId: "INVALID" });
      tick();

      expect(component["error"]()).toBe("Payment not found");
      expect(component["loading"]()).toBeFalse();
    }));

    it("should set refund amount when payment loads", fakeAsync(() => {
      paymentServiceSpy.getPaymentByReference.and.returnValue(of(mockPayment));

      fixture.detectChanges();
      paramsSubject.next({ referenceId: "PAY-123456789" });
      tick();
      fixture.detectChanges(); // Trigger effect

      expect(component["refundAmount"]()).toBe(1000.0);
    }));
  });

  describe("Complete Payment", () => {
    beforeEach(fakeAsync(() => {
      paymentServiceSpy.getPaymentByReference.and.returnValue(of(mockPayment));
      fixture.detectChanges();
      paramsSubject.next({ referenceId: "PAY-123456789" });
      tick();
    }));

    it("should complete payment successfully", fakeAsync(() => {
      spyOn(window, "confirm").and.returnValue(true);
      paymentServiceSpy.completePaymentDirect.and.returnValue(
        of(mockCompletedPayment)
      );

      component["completePayment"]();
      tick();

      expect(paymentServiceSpy.completePaymentDirect).toHaveBeenCalledWith(
        "PAY-123456789"
      );
      expect(component["payment"]()?.status).toBe("COMPLETED");
      expect(component["actionLoading"]()).toBeFalse();
    }));

    it("should not complete payment when user cancels confirmation", fakeAsync(() => {
      spyOn(window, "confirm").and.returnValue(false);

      component["completePayment"]();
      tick();

      expect(paymentServiceSpy.completePaymentDirect).not.toHaveBeenCalled();
    }));

    it("should handle error when completing payment fails", fakeAsync(() => {
      spyOn(window, "confirm").and.returnValue(true);
      paymentServiceSpy.completePaymentDirect.and.returnValue(
        throwError(() => new Error("Complete failed"))
      );

      component["completePayment"]();
      tick();

      expect(component["error"]()).toBe("Complete failed");
      expect(component["actionLoading"]()).toBeFalse();
    }));
  });

  describe("Cancel Payment", () => {
    beforeEach(fakeAsync(() => {
      paymentServiceSpy.getPaymentByReference.and.returnValue(of(mockPayment));
      fixture.detectChanges();
      paramsSubject.next({ referenceId: "PAY-123456789" });
      tick();
    }));

    it("should cancel payment successfully", fakeAsync(() => {
      spyOn(window, "confirm").and.returnValue(true);
      paymentServiceSpy.cancelPaymentDirect.and.returnValue(
        of(mockCancelledPayment)
      );

      component["cancelPayment"]();
      tick();

      expect(paymentServiceSpy.cancelPaymentDirect).toHaveBeenCalledWith(
        "PAY-123456789"
      );
      expect(component["payment"]()?.status).toBe("CANCELLED");
      expect(component["actionLoading"]()).toBeFalse();
    }));

    it("should not cancel payment when user cancels confirmation", fakeAsync(() => {
      spyOn(window, "confirm").and.returnValue(false);

      component["cancelPayment"]();
      tick();

      expect(paymentServiceSpy.cancelPaymentDirect).not.toHaveBeenCalled();
    }));

    it("should handle error when cancelling payment fails", fakeAsync(() => {
      spyOn(window, "confirm").and.returnValue(true);
      paymentServiceSpy.cancelPaymentDirect.and.returnValue(
        throwError(() => new Error("Cancel failed"))
      );

      component["cancelPayment"]();
      tick();

      expect(component["error"]()).toBe("Cancel failed");
      expect(component["actionLoading"]()).toBeFalse();
    }));
  });

  describe("Refund Payment", () => {
    beforeEach(fakeAsync(() => {
      const completedPayment = {
        ...mockPayment,
        status: "COMPLETED" as PaymentStatus,
      };
      paymentServiceSpy.getPaymentByReference.and.returnValue(
        of(completedPayment)
      );
      fixture.detectChanges();
      paramsSubject.next({ referenceId: "PAY-123456789" });
      tick();
    }));

    it("should process refund successfully", fakeAsync(() => {
      spyOn(window, "confirm").and.returnValue(true);
      paymentServiceSpy.refundPaymentDirect.and.returnValue(
        of(mockRefundedPayment)
      );

      component["refundAmount"].set(500);
      component["refundReason"].set("Customer request");
      component["processRefund"]();
      tick();

      expect(paymentServiceSpy.refundPaymentDirect).toHaveBeenCalledWith(
        "PAY-123456789",
        500,
        "Customer request"
      );
      expect(component["payment"]()?.status).toBe("REFUNDED");
      expect(component["showRefundForm"]()).toBeFalse();
      expect(component["actionLoading"]()).toBeFalse();
    }));

    it("should not refund when user cancels confirmation", fakeAsync(() => {
      spyOn(window, "confirm").and.returnValue(false);

      component["processRefund"]();
      tick();

      expect(paymentServiceSpy.refundPaymentDirect).not.toHaveBeenCalled();
    }));

    it("should handle error when refund fails", fakeAsync(() => {
      spyOn(window, "confirm").and.returnValue(true);
      paymentServiceSpy.refundPaymentDirect.and.returnValue(
        throwError(() => new Error("Refund failed"))
      );

      component["processRefund"]();
      tick();

      expect(component["error"]()).toBe("Refund failed");
      expect(component["actionLoading"]()).toBeFalse();
    }));
  });

  describe("Refund Form Validation", () => {
    beforeEach(fakeAsync(() => {
      paymentServiceSpy.getPaymentByReference.and.returnValue(of(mockPayment));
      fixture.detectChanges();
      paramsSubject.next({ referenceId: "PAY-123456789" });
      tick();
    }));

    it("should be invalid when amount is 0", () => {
      component["refundAmount"].set(0);
      component["refundReason"].set("Test reason");
      expect(component["isRefundValid"]()).toBeFalse();
    });

    it("should be invalid when amount exceeds payment amount", () => {
      component["refundAmount"].set(2000);
      component["refundReason"].set("Test reason");
      expect(component["isRefundValid"]()).toBeFalse();
    });

    it("should be invalid when reason is empty", () => {
      component["refundAmount"].set(500);
      component["refundReason"].set("");
      expect(component["isRefundValid"]()).toBeFalse();
    });

    it("should be valid when amount and reason are correct", () => {
      component["refundAmount"].set(500);
      component["refundReason"].set("Customer request");
      expect(component["isRefundValid"]()).toBeTrue();
    });
  });

  describe("Event Handlers", () => {
    beforeEach(fakeAsync(() => {
      paymentServiceSpy.getPaymentByReference.and.returnValue(of(mockPayment));
      fixture.detectChanges();
      paramsSubject.next({ referenceId: "PAY-123456789" });
      tick();
    }));

    it("should update refund amount on change", () => {
      const mockEvent = {
        target: { value: "750.50" },
      } as unknown as Event;

      component["onRefundAmountChange"](mockEvent);
      expect(component["refundAmount"]()).toBe(750.5);
    });

    it("should handle invalid refund amount", () => {
      const mockEvent = {
        target: { value: "invalid" },
      } as unknown as Event;

      component["onRefundAmountChange"](mockEvent);
      expect(component["refundAmount"]()).toBe(0);
    });

    it("should update refund reason on change", () => {
      const mockEvent = {
        target: { value: "Product defective" },
      } as unknown as Event;

      component["onRefundReasonChange"](mockEvent);
      expect(component["refundReason"]()).toBe("Product defective");
    });
  });

  describe("Utility Methods", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should format amount correctly in THB", () => {
      const formatted = component["formatAmount"](1234.56, "THB");
      expect(formatted).toContain("1,234.56");
    });

    it("should format amount correctly in USD", () => {
      const formatted = component["formatAmount"](100, "USD");
      expect(formatted).toContain("100");
    });

    it("should format date correctly", () => {
      const formatted = component["formatDate"]("2025-06-15T10:30:00");
      expect(formatted).toBeTruthy();
      // Date format varies by locale, just ensure it returns a string
    });

    it("should return correct status labels in Thai", () => {
      expect(component["getStatusLabel"]("PENDING" as PaymentStatus)).toBe(
        "รอดำเนินการ"
      );
      expect(component["getStatusLabel"]("PROCESSING" as PaymentStatus)).toBe(
        "กำลังดำเนินการ"
      );
      expect(component["getStatusLabel"]("COMPLETED" as PaymentStatus)).toBe(
        "สำเร็จ"
      );
      expect(component["getStatusLabel"]("FAILED" as PaymentStatus)).toBe(
        "ล้มเหลว"
      );
      expect(component["getStatusLabel"]("CANCELLED" as PaymentStatus)).toBe(
        "ยกเลิก"
      );
      expect(component["getStatusLabel"]("REFUNDED" as PaymentStatus)).toBe(
        "คืนเงินแล้ว"
      );
    });

    it("should return correct payment method labels in Thai", () => {
      expect(component["getPaymentMethodLabel"]("CREDIT_CARD")).toBe(
        "บัตรเครดิต"
      );
      expect(component["getPaymentMethodLabel"]("DEBIT_CARD")).toBe(
        "บัตรเดบิต"
      );
      expect(component["getPaymentMethodLabel"]("BANK_TRANSFER")).toBe(
        "โอนเงิน"
      );
      expect(component["getPaymentMethodLabel"]("QR_CODE")).toBe("QR Code");
      expect(component["getPaymentMethodLabel"]("E_WALLET")).toBe("E-Wallet");
    });

    it("should return unknown payment method as-is", () => {
      expect(component["getPaymentMethodLabel"]("UNKNOWN")).toBe("UNKNOWN");
    });

    it("should return correct transaction type labels in Thai", () => {
      expect(
        component["getTransactionTypeLabel"]("CHARGE" as TransactionType)
      ).toBe("เรียกเก็บเงิน");
      expect(
        component["getTransactionTypeLabel"]("REFUND" as TransactionType)
      ).toBe("คืนเงิน");
      expect(
        component["getTransactionTypeLabel"]("VOID" as TransactionType)
      ).toBe("ยกเลิก");
    });
  });

  describe("Loading States", () => {
    it("should set loading to true while fetching payment", fakeAsync(() => {
      const paymentSubject = new Subject<PaymentResponse>();
      paymentServiceSpy.getPaymentByReference.and.returnValue(
        paymentSubject.asObservable()
      );

      fixture.detectChanges();
      paramsSubject.next({ referenceId: "PAY-123456789" });

      // Before async completes
      expect(component["loading"]()).toBeTrue();

      paymentSubject.next(mockPayment);
      tick();

      // After async completes
      expect(component["loading"]()).toBeFalse();
    }));

    it("should set actionLoading to true while processing action", fakeAsync(() => {
      paymentServiceSpy.getPaymentByReference.and.returnValue(of(mockPayment));
      fixture.detectChanges();
      paramsSubject.next({ referenceId: "PAY-123456789" });
      tick();

      const actionSubject = new Subject<PaymentResponse>();
      spyOn(window, "confirm").and.returnValue(true);
      paymentServiceSpy.completePaymentDirect.and.returnValue(
        actionSubject.asObservable()
      );

      component["completePayment"]();

      // Action loading should be true immediately
      expect(component["actionLoading"]()).toBeTrue();

      actionSubject.next(mockCompletedPayment);
      tick();

      // After completion
      expect(component["actionLoading"]()).toBeFalse();
    }));
  });
});

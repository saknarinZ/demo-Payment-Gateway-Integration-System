import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, ActivatedRoute } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { of } from "rxjs";
import { CheckoutComponent } from "./checkout.component";

describe("CheckoutComponent", () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: (key: string) => "PAY-TEST-123",
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have loading state initially", () => {
    // Will be true during API call
    expect(component["loading"]()).toBeDefined();
  });

  it("should have payment methods defined", () => {
    expect(component["paymentMethods"].length).toBe(4);
  });

  it("should have credit card payment method", () => {
    const creditCard = component["paymentMethods"].find(
      (m) => m.value === "CREDIT_CARD"
    );
    expect(creditCard).toBeTruthy();
    expect(creditCard?.icon).toBe("💳");
  });

  it("should have promptpay payment method", () => {
    const promptPay = component["paymentMethods"].find(
      (m) => m.value === "PROMPTPAY"
    );
    expect(promptPay).toBeTruthy();
    expect(promptPay?.icon).toBe("📱");
  });

  it("should have bank transfer payment method", () => {
    const bankTransfer = component["paymentMethods"].find(
      (m) => m.value === "BANK_TRANSFER"
    );
    expect(bankTransfer).toBeTruthy();
    expect(bankTransfer?.icon).toBe("🏦");
  });

  it("should have e-wallet payment method", () => {
    const eWallet = component["paymentMethods"].find(
      (m) => m.value === "E_WALLET"
    );
    expect(eWallet).toBeTruthy();
    expect(eWallet?.icon).toBe("👛");
  });

  it("should select payment method", () => {
    component["selectMethod"]("PROMPTPAY");
    expect(component["selectedMethod"]()).toBe("PROMPTPAY");
  });

  it("should get correct status text for PENDING", () => {
    expect(component["getStatusText"]("PENDING")).toBe("รอชำระเงิน");
  });

  it("should get correct status text for COMPLETED", () => {
    expect(component["getStatusText"]("COMPLETED")).toBe("ชำระเงินสำเร็จ");
  });

  it("should get correct status text for FAILED", () => {
    expect(component["getStatusText"]("FAILED")).toBe("ล้มเหลว");
  });

  it("should get correct status text for CANCELLED", () => {
    expect(component["getStatusText"]("CANCELLED")).toBe("ยกเลิก");
  });

  it("should get correct status text for REFUNDED", () => {
    expect(component["getStatusText"]("REFUNDED")).toBe("คืนเงินแล้ว");
  });

  it("should get correct status class for PENDING", () => {
    expect(component["getStatusClass"]("PENDING")).toBe("status-pending");
  });

  it("should get correct status class for COMPLETED", () => {
    expect(component["getStatusClass"]("COMPLETED")).toBe("status-success");
  });

  it("should get correct status class for FAILED", () => {
    expect(component["getStatusClass"]("FAILED")).toBe("status-error");
  });

  it("should format card number correctly", () => {
    const mockEvent = {
      target: { value: "4242424242424242" },
    } as unknown as Event;

    component["formatCardNumber"](mockEvent);
    expect(component.cardNumber).toBe("4242 4242 4242 4242");
  });

  it("should format card number with partial input", () => {
    const mockEvent = {
      target: { value: "424242" },
    } as unknown as Event;

    component["formatCardNumber"](mockEvent);
    expect(component.cardNumber).toBe("4242 42");
  });

  it("should format expiry correctly", () => {
    const mockEvent = {
      target: { value: "1225" },
    } as unknown as Event;

    component["formatExpiry"](mockEvent);
    expect(component.cardExpiry).toBe("12/25");
  });

  it("should format expiry with partial input", () => {
    const mockEvent = {
      target: { value: "12" },
    } as unknown as Event;

    component["formatExpiry"](mockEvent);
    expect(component.cardExpiry).toBe("12/");
  });

  it("should not be expired by default", () => {
    expect(component["isExpired"]()).toBe(false);
  });

  it("should have canPay as false without payment", () => {
    expect(component["canPay"]()).toBe(false);
  });

  it("should have empty formatted amount without payment", () => {
    component["payment"].set(null);
    expect(component["formattedAmount"]()).toBe("");
  });

  it("should not process payment without payment data", () => {
    component["payment"].set(null);
    component["processPayment"]();
    expect(component["processing"]()).toBe(false);
  });
});

import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PaymentFormComponent } from "./payment-form.component";
import { PaymentService } from "../../../core/services/payment.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { of, throwError } from "rxjs";

describe("PaymentFormComponent", () => {
  let component: PaymentFormComponent;
  let fixture: ComponentFixture<PaymentFormComponent>;
  let paymentServiceMock: any;

  beforeEach(async () => {
    paymentServiceMock = {
      createPaymentDirect: jasmine
        .createSpy("createPaymentDirect")
        .and.returnValue(of({ referenceId: "PAY-123" })),
    };

    await TestBed.configureTestingModule({
      imports: [
        PaymentFormComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
      ],
      providers: [{ provide: PaymentService, useValue: paymentServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize form with default values", () => {
    expect(component["paymentForm"]).toBeDefined();
    expect(component["paymentForm"].get("currency")?.value).toBe("THB");
  });

  it("should be invalid when empty", () => {
    expect(component["paymentForm"].valid).toBeFalsy();
  });

  it("should be valid when all required fields are filled", () => {
    component["paymentForm"].patchValue({
      customerName: "John Doe",
      customerEmail: "john@example.com",
      amount: 100,
      currency: "THB",
      paymentMethod: "CREDIT_CARD",
    });
    expect(component["paymentForm"].valid).toBeTruthy();
  });

  it("should call createPaymentDirect on submit when valid", () => {
    component["paymentForm"].patchValue({
      customerName: "John Doe",
      customerEmail: "john@example.com",
      amount: 100,
      currency: "THB",
      paymentMethod: "CREDIT_CARD",
    });

    component["onSubmit"](); // Access protected method

    expect(paymentServiceMock.createPaymentDirect).toHaveBeenCalled();
  });

  it("should not call createPaymentDirect on submit when invalid", () => {
    component["paymentForm"].patchValue({
      customerName: "", // Invalid
      customerEmail: "john@example.com",
      amount: 100,
      currency: "THB",
      paymentMethod: "CREDIT_CARD",
    });

    component["onSubmit"]();

    expect(paymentServiceMock.createPaymentDirect).not.toHaveBeenCalled();
  });

  it("should handle error on submit", () => {
    paymentServiceMock.createPaymentDirect.and.returnValue(
      throwError(() => new Error("API Error"))
    );

    component["paymentForm"].patchValue({
      customerName: "John Doe",
      customerEmail: "john@example.com",
      amount: 100,
      currency: "THB",
      paymentMethod: "CREDIT_CARD",
    });

    component["onSubmit"]();

    expect(component["error"]()).toBe("API Error");
    expect(component["submitting"]()).toBeFalse();
  });
});

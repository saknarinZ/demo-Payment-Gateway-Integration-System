import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PaymentListComponent } from "./payment-list.component";
import { PaymentService } from "../../../core/services/payment.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { FormsModule } from "@angular/forms";
import { of } from "rxjs";
import { signal } from "@angular/core";

describe("PaymentListComponent", () => {
  let component: PaymentListComponent;
  let fixture: ComponentFixture<PaymentListComponent>;
  let paymentServiceMock: any;

  beforeEach(async () => {
    paymentServiceMock = {
      loadPayments: jasmine.createSpy("loadPayments"),
      payments: signal([]),
      loading: signal(false),
      error: signal(null),
      totalElements: signal(0),
      totalPages: signal(0),
      currentPage: signal(0),
    };

    await TestBed.configureTestingModule({
      imports: [
        PaymentListComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
      ],
      providers: [{ provide: PaymentService, useValue: paymentServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call loadPayments with search query when onSearch is called", () => {
    const searchQuery = "PAY-123";
    component["onSearch"](searchQuery); // Access protected method
    expect(paymentServiceMock.loadPayments).toHaveBeenCalledWith(
      0,
      10,
      undefined,
      searchQuery
    );
  });

  it("should call loadPayments with status and search query when both are set", () => {
    component["selectedStatus"].set("PENDING");
    component["searchQuery"].set("John");

    // Trigger reload manually or via method that calls loadPayments
    component["loadPayments"](); // Access private method

    expect(paymentServiceMock.loadPayments).toHaveBeenCalledWith(
      0,
      10,
      "PENDING",
      "John"
    );
  });
});

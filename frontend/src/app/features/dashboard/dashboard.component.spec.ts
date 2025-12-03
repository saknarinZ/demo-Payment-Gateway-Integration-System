import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { DashboardComponent } from "./dashboard.component";
import { PaymentService } from "@core/services/payment.service";
import { ApiService } from "@core/services/api.service";

describe("DashboardComponent", () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule],
      providers: [PaymentService, ApiService, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display page title", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector(".page-header h1")?.textContent).toContain(
      "Dashboard"
    );
  });

  it("should have stats cards", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const statCards = compiled.querySelectorAll(".stat-card");
    expect(statCards.length).toBeGreaterThan(0);
  });

  it("should have quick action buttons", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const actionButtons = compiled.querySelectorAll(".action-btn");
    expect(actionButtons.length).toBe(3);
  });

  it("should format amount correctly", () => {
    const result = component["formatAmount"](1000);
    expect(result).toContain("1,000");
  });

  it("should load stats on init", () => {
    spyOn(component, "loadStats");
    component.ngOnInit();
    expect(component.loadStats).toHaveBeenCalled();
  });

  it("should check health on init", () => {
    spyOn(component, "checkHealth");
    component.ngOnInit();
    expect(component.checkHealth).toHaveBeenCalled();
  });
});

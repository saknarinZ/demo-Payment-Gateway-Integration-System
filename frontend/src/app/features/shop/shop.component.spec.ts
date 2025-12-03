import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ShopComponent } from "./shop.component";

describe("ShopComponent", () => {
  let component: ShopComponent;
  let fixture: ComponentFixture<ShopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have menu items", () => {
    expect(component["menuItems"].length).toBe(10);
  });

  it("should have empty cart initially", () => {
    expect(component["cart"]().length).toBe(0);
  });

  it("should calculate cart total as 0 initially", () => {
    expect(component["cartTotal"]()).toBe(0);
  });

  it("should calculate cart item count as 0 initially", () => {
    expect(component["cartItemCount"]()).toBe(0);
  });

  it("should add item to cart", () => {
    const menuItem = component["menuItems"][0];
    component["addToCart"](menuItem);

    expect(component["cart"]().length).toBe(1);
    expect(component["cart"]()[0].quantity).toBe(1);
  });

  it("should increase quantity when adding same item", () => {
    const menuItem = component["menuItems"][0];
    component["addToCart"](menuItem);
    component["addToCart"](menuItem);

    expect(component["cart"]().length).toBe(1);
    expect(component["cart"]()[0].quantity).toBe(2);
  });

  it("should remove item from cart", () => {
    const menuItem = component["menuItems"][0];
    component["addToCart"](menuItem);
    component["removeFromCart"](menuItem.id);

    expect(component["cart"]().length).toBe(0);
  });

  it("should update quantity", () => {
    const menuItem = component["menuItems"][0];
    component["addToCart"](menuItem);
    component["updateQuantity"](menuItem.id, 5);

    expect(component["cart"]()[0].quantity).toBe(5);
  });

  it("should remove item when quantity is 0 or less", () => {
    const menuItem = component["menuItems"][0];
    component["addToCart"](menuItem);
    component["updateQuantity"](menuItem.id, 0);

    expect(component["cart"]().length).toBe(0);
  });

  it("should calculate cart total correctly", () => {
    const menuItem1 = component["menuItems"][0]; // 80 THB
    const menuItem2 = component["menuItems"][1]; // 90 THB

    component["addToCart"](menuItem1);
    component["addToCart"](menuItem1); // 160 THB
    component["addToCart"](menuItem2); // 90 THB

    expect(component["cartTotal"]()).toBe(250);
  });

  it("should calculate cart item count correctly", () => {
    const menuItem1 = component["menuItems"][0];
    const menuItem2 = component["menuItems"][1];

    component["addToCart"](menuItem1);
    component["addToCart"](menuItem1);
    component["addToCart"](menuItem2);

    expect(component["cartItemCount"]()).toBe(3);
  });

  it("should not proceed to checkout with empty cart", () => {
    component["proceedToCheckout"]();
    expect(component["showCheckoutForm"]()).toBe(false);
  });

  it("should proceed to checkout with items in cart", () => {
    const menuItem = component["menuItems"][0];
    component["addToCart"](menuItem);
    component["proceedToCheckout"]();

    expect(component["showCheckoutForm"]()).toBe(true);
  });

  it("should close checkout form", () => {
    component["showCheckoutForm"].set(true);
    component["closeCheckoutForm"]();

    expect(component["showCheckoutForm"]()).toBe(false);
  });

  it("should format price correctly", () => {
    const formatted = component["formatPrice"](1500);
    expect(formatted).toContain("1,500");
    expect(formatted).toContain("฿");
  });

  it("should have form valid when cart has items", () => {
    expect(component["isFormValid"]()).toBe(false);

    const menuItem = component["menuItems"][0];
    component["addToCart"](menuItem);

    expect(component["isFormValid"]()).toBe(true);
  });
});

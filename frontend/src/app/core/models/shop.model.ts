/**
 * Shop Models - Data Transfer Objects
 *
 * MVC Pattern: Model Layer
 * - ใช้ Interface สำหรับ Type Safety
 * - ใช้ Class สำหรับ Business Logic
 */

// =====================================================
// INTERFACES - Pure Data Structures
// =====================================================

/**
 * Menu Item Interface - รายการเมนู
 */
export interface IMenuItem {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly image: string;
  readonly category: string;
  readonly description: string;
}

/**
 * Cart Item Interface - รายการในตะกร้า
 */
export interface ICartItem {
  readonly item: IMenuItem;
  quantity: number;
}

/**
 * Customer Info Interface - ข้อมูลลูกค้า
 */
export interface ICustomerInfo {
  name: string;
  phone: string;
  tableNumber: string;
}

// =====================================================
// CLASSES - With Business Logic (OOP)
// =====================================================

/**
 * MenuItem Class - เมนูอาหาร
 */
export class MenuItem implements IMenuItem {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly price: number,
    public readonly image: string,
    public readonly category: string,
    public readonly description: string
  ) {}

  /**
   * Format price สำหรับแสดงผล
   */
  getFormattedPrice(): string {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(this.price);
  }

  /**
   * สร้างจาก plain object
   */
  static fromObject(obj: IMenuItem): MenuItem {
    return new MenuItem(
      obj.id,
      obj.name,
      obj.price,
      obj.image,
      obj.category,
      obj.description
    );
  }
}

/**
 * CartItem Class - รายการในตะกร้า
 */
export class CartItem implements ICartItem {
  constructor(public readonly item: MenuItem, public quantity: number = 1) {}

  /**
   * คำนวณราคารวมของรายการนี้
   */
  getSubtotal(): number {
    return this.item.price * this.quantity;
  }

  /**
   * Format subtotal สำหรับแสดงผล
   */
  getFormattedSubtotal(): string {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(this.getSubtotal());
  }

  /**
   * เพิ่มจำนวน
   */
  increment(): void {
    this.quantity++;
  }

  /**
   * ลดจำนวน
   */
  decrement(): boolean {
    if (this.quantity > 1) {
      this.quantity--;
      return true;
    }
    return false; // ควรลบออก
  }

  /**
   * Clone รายการนี้
   */
  clone(): CartItem {
    return new CartItem(this.item, this.quantity);
  }
}

/**
 * ShoppingCart Class - ตะกร้าสินค้า (Aggregate Root)
 */
export class ShoppingCart {
  private items: Map<number, CartItem> = new Map();

  /**
   * เพิ่มสินค้าลงตะกร้า
   */
  addItem(menuItem: MenuItem, quantity: number = 1): void {
    const existingItem = this.items.get(menuItem.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.set(menuItem.id, new CartItem(menuItem, quantity));
    }
  }

  /**
   * ลบสินค้าออกจากตะกร้า
   */
  removeItem(itemId: number): boolean {
    return this.items.delete(itemId);
  }

  /**
   * อัพเดทจำนวน
   */
  updateQuantity(itemId: number, quantity: number): boolean {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    const item = this.items.get(itemId);
    if (item) {
      item.quantity = quantity;
      return true;
    }
    return false;
  }

  /**
   * ล้างตะกร้า
   */
  clear(): void {
    this.items.clear();
  }

  /**
   * คำนวณราคารวม
   */
  getTotal(): number {
    let total = 0;
    this.items.forEach((item) => {
      total += item.getSubtotal();
    });
    return total;
  }

  /**
   * นับจำนวนชิ้น
   */
  getItemCount(): number {
    let count = 0;
    this.items.forEach((item) => {
      count += item.quantity;
    });
    return count;
  }

  /**
   * ตรวจสอบว่าตะกร้าว่างหรือไม่
   */
  isEmpty(): boolean {
    return this.items.size === 0;
  }

  /**
   * ดึงรายการทั้งหมดเป็น Array
   */
  getItems(): CartItem[] {
    return Array.from(this.items.values());
  }

  /**
   * สร้าง Order Description
   */
  getOrderDescription(): string {
    return this.getItems()
      .map((cartItem) => `${cartItem.item.name} x${cartItem.quantity}`)
      .join(", ");
  }

  /**
   * Format total สำหรับแสดงผล
   */
  getFormattedTotal(): string {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(this.getTotal());
  }
}

/**
 * CustomerInfo Class - ข้อมูลลูกค้า
 */
export class CustomerInfo implements ICustomerInfo {
  constructor(
    public name: string = "",
    public phone: string = "",
    public tableNumber: string = ""
  ) {}

  /**
   * ดึงชื่อสำหรับแสดง (default ถ้าว่าง)
   */
  getDisplayName(): string {
    return this.name.trim() || "ลูกค้า";
  }

  /**
   * สร้าง email จากเบอร์โทร
   */
  getEmailFromPhone(): string {
    const phone = this.phone.trim() || "guest";
    return `${phone}@phone.local`;
  }

  /**
   * ตรวจสอบความถูกต้อง (optional fields)
   */
  isValid(): boolean {
    // ทุก field เป็น optional
    return true;
  }

  /**
   * Clone object
   */
  clone(): CustomerInfo {
    return new CustomerInfo(this.name, this.phone, this.tableNumber);
  }
}

/**
 * Menu Service - จัดการข้อมูลเมนู
 *
 * MVC Pattern: Service Layer (Business Logic)
 * - Single Responsibility: จัดการเมนูอย่างเดียว
 * - ในอนาคตสามารถเชื่อม API ได้
 */

import { Injectable, signal, computed } from "@angular/core";
import { MenuItem, IMenuItem } from "@core/models/shop.model";

@Injectable({
  providedIn: "root",
})
export class MenuService {
  // Private state
  private readonly _menuItems = signal<MenuItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly menuItems = this._menuItems.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed: จัดกลุ่มตาม category
  readonly menuByCategory = computed(() => {
    const items = this._menuItems();
    const grouped = new Map<string, MenuItem[]>();

    items.forEach((item) => {
      const categoryItems = grouped.get(item.category) || [];
      categoryItems.push(item);
      grouped.set(item.category, categoryItems);
    });

    return grouped;
  });

  // Computed: รายการ categories
  readonly categories = computed(() => {
    return Array.from(this.menuByCategory().keys());
  });

  constructor() {
    // โหลดเมนูเริ่มต้น
    this.loadDefaultMenu();
  }

  /**
   * โหลดเมนูจาก static data
   * ในอนาคตสามารถเปลี่ยนเป็น API call
   */
  private loadDefaultMenu(): void {
    const defaultMenuData: IMenuItem[] = [
      {
        id: 1,
        name: "ข้าวผัดกุ้ง",
        price: 80,
        image: "/images/menu/fried_rice.png",
        category: "จานหลัก",
        description: "ข้าวผัดกุ้งสด ไข่ดาว",
      },
      {
        id: 2,
        name: "ผัดไทยกุ้งสด",
        price: 90,
        image: "/images/menu/pad_thai.png",
        category: "จานหลัก",
        description: "ผัดไทยเส้นจันท์ กุ้งแม่น้ำ",
      },
      {
        id: 3,
        name: "ต้มยำกุ้ง",
        price: 150,
        image: "/images/menu/tom_yum.png",
        category: "จานหลัก",
        description: "ต้มยำน้ำข้น กุ้งแม่น้ำตัวใหญ่",
      },
      {
        id: 4,
        name: "ส้มตำไทย",
        price: 50,
        image: "/images/menu/som_tum.png",
        category: "จานเรียกน้ำย่อย",
        description: "ส้มตำรสจัดจ้าน",
      },
      {
        id: 5,
        name: "ไก่ทอดหาดใหญ่",
        price: 120,
        image: "/images/menu/fried_chicken.png",
        category: "จานหลัก",
        description: "ไก่ทอดกรอบ พร้อมน้ำจิ้ม",
      },
      {
        id: 6,
        name: "ข้าวมันไก่",
        price: 60,
        image: "/images/menu/chicken_rice.png",
        category: "จานหลัก",
        description: "ข้าวมันไก่ต้ม/ทอด น้ำจิ้มสูตรพิเศษ",
      },
      {
        id: 7,
        name: "ชาเย็น",
        price: 35,
        image: "/images/menu/thai_tea.png",
        category: "เครื่องดื่ม",
        description: "ชาไทยเย็นหวานมัน",
      },
      {
        id: 8,
        name: "น้ำมะนาว",
        price: 30,
        image: "/images/menu/lime_juice.png",
        category: "เครื่องดื่ม",
        description: "น้ำมะนาวสดคั้น",
      },
      {
        id: 9,
        name: "ข้าวเหนียวมะม่วง",
        price: 80,
        image: "/images/menu/mango_sticky_rice.png",
        category: "ของหวาน",
        description: "ข้าวเหนียวมูน มะม่วงสุก",
      },
      {
        id: 10,
        name: "ลอดช่องสิงคโปร์",
        price: 45,
        image: "/images/menu/lod_chong.png",
        category: "ของหวาน",
        description: "ลอดช่องใบเตย กะทิสด",
      },
    ];

    // แปลงเป็น MenuItem objects
    const menuItems = defaultMenuData.map((data) => MenuItem.fromObject(data));
    this._menuItems.set(menuItems);
  }

  /**
   * ค้นหาเมนูตาม ID
   */
  getMenuItemById(id: number): MenuItem | undefined {
    return this._menuItems().find((item) => item.id === id);
  }

  /**
   * ค้นหาเมนูตามชื่อ
   */
  searchByName(query: string): MenuItem[] {
    const lowerQuery = query.toLowerCase();
    return this._menuItems().filter((item) =>
      item.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * กรองตาม category
   */
  getByCategory(category: string): MenuItem[] {
    return this._menuItems().filter((item) => item.category === category);
  }

  /**
   * โหลดเมนูจาก API (สำหรับอนาคต)
   */
  async loadFromApi(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // TODO: เรียก API
      // const response = await this.http.get<IMenuItem[]>('/api/menu').toPromise();
      // const menuItems = response.map(data => MenuItem.fromObject(data));
      // this._menuItems.set(menuItems);

      // ตอนนี้ใช้ default data
      this.loadDefaultMenu();
    } catch (err) {
      this._error.set("ไม่สามารถโหลดเมนูได้");
    } finally {
      this._loading.set(false);
    }
  }
}

# Project Blueprint: Payment Gateway Integration System (2025 Stack)

**Project Name:** Modern Payment Gateway Integration
**Owner:** Saknarin (Fang)
**Last Updated:** December 2025

## 1. Technology Stack (Bleeding Edge)

**"Late 2025 Enterprise Standard"**

### Backend

- **Language:** Java 21 LTS (Feature: Virtual Threads, Records)
- **Framework:** Spring Boot 3.4+
- **Database:** MySQL 8.0
- **Architecture:** Clean Architecture + MVC

### Frontend

- **Framework:** Angular 21 (Latest)
- **State Management:** **Full Signals Architecture** (No RxJS BehaviorSubject)
- **Change Detection:** **Experimental Zoneless** (No Zone.js)
- **Styling:** TailwindCSS
- **Components:** Standalone Components

### Infrastructure

- **Container:** Docker & Docker Compose (Multi-stage builds)
- **Orchestration:** Single command `docker-compose up`

---

## 2. System Architecture (MVC Pattern)

| Layer              | Frontend (Angular)                         | Backend (Spring Boot)                          |
| :----------------- | :----------------------------------------- | :--------------------------------------------- |
| **Model**          | TypeScript Interfaces<br>(Strictly Typed)  | Java Records<br>(`@Entity`, DTOs)              |
| **View**           | HTML Templates<br>(`@if`, `@for`, Signals) | JSON Responses<br>(`ProblemDetail` for errors) |
| **Controller**     | Angular Components<br>(UI Logic Only)      | `@RestController`<br>(HTTP Endpoints)          |
| **Business Logic** | `@Injectable` Services                     | `@Service` Classes                             |

---

## 2.1 Component-Based Architecture (Frontend)

### Design Principles

| หลักการ                                   | คำอธิบาย                                         |
| :---------------------------------------- | :----------------------------------------------- |
| **Single Responsibility Principle (SRP)** | แต่ละ Component ทำหน้าที่เดียว                   |
| **Separation of Concerns**                | แยกส่วนที่เกี่ยวข้องกันออกจากกัน                 |
| **DRY (Don't Repeat Yourself)**           | ไม่เขียนโค้ดซ้ำ สร้าง Component ใช้ซ้ำ           |
| **Atomic Design**                         | แยกจากเล็กไปใหญ่ (Atoms → Molecules → Organisms) |
| **Smart/Dumb Components**                 | แยก Container (logic) กับ Presentational (UI)    |

### Component Types

```
┌─────────────────────────────────────────────────────────────┐
│  SMART COMPONENTS (Container)                               │
│  - Inject Services                                          │
│  - Manage State (Signals)                                   │
│  - Handle Business Logic                                    │
│  - Coordinate Child Components                              │
├─────────────────────────────────────────────────────────────┤
│  DUMB COMPONENTS (Presentational)                           │
│  - Receive data via @Input()                                │
│  - Emit events via @Output()                                │
│  - Pure UI rendering                                        │
│  - No Service injection                                     │
│  - Reusable across features                                 │
└─────────────────────────────────────────────────────────────┘
```

### Example Structure: Shop Feature

```
shop/ (Feature Module)
├── shop.component.ts          ← Smart Container
├── shop.component.html
│
├── components/                ← Dumb/Presentational Components
│   ├── menu-item/
│   │   ├── menu-item.component.ts
│   │   └── menu-item.component.html
│   │
│   ├── cart-sidebar/
│   │   ├── cart-sidebar.component.ts
│   │   └── cart-sidebar.component.html
│   │
│   ├── cart-item/
│   │   ├── cart-item.component.ts
│   │   └── cart-item.component.html
│   │
│   └── checkout-modal/
│       ├── checkout-modal.component.ts
│       └── checkout-modal.component.html
│
└── services/                  ← Feature-specific Services
    ├── menu.service.ts
    ├── cart.service.ts
    └── order.service.ts
```

### Service Layer (OOP Principles)

```
┌─────────────────────────────────────────────────────────────┐
│  MODELS (shop.model.ts)                                     │
│  - MenuItem, CartItem (Interfaces)                          │
│  - ShoppingCart (Class with methods)                        │
│  - CustomerInfo (Class with validation)                     │
├─────────────────────────────────────────────────────────────┤
│  SERVICES                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ MenuService │  │ CartService │  │ OrderService│         │
│  │ - menuItems │  │ - items     │  │ - placeOrder│         │
│  │ - getById() │  │ - addItem() │  │ - process() │         │
│  │ - search()  │  │ - total     │  │ - error     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  COMPONENTS                                                 │
│  - Inject Services                                          │
│  - Delegate business logic to Services                      │
│  - Only handle UI events and rendering                      │
└─────────────────────────────────────────────────────────────┘
```

### Benefits

1. **Reusability** - Components สามารถใช้ซ้ำได้หลายที่
2. **Testability** - Test แต่ละ Component/Service แยกกัน
3. **Maintainability** - แก้ไขง่าย หาโค้ดเจอเร็ว
4. **Scalability** - เพิ่ม feature ใหม่ได้ง่าย
5. **Performance** - OnPush Change Detection ทำงานได้ดี

---

## 2.2 Responsive Design (Tailwind CSS)

### Breakpoint System

| Prefix | Min Width | Target Device    |
| :----- | :-------- | :--------------- |
| (none) | 0px       | Mobile (default) |
| `sm`   | 640px     | Small tablets    |
| `md`   | 768px     | Tablets          |
| `lg`   | 1024px    | Laptops          |
| `xl`   | 1280px    | Desktops         |
| `2xl`  | 1536px    | Large screens    |

### Mobile-First Approach

```
┌─────────────────────────────────────────────────────────────┐
│  MOBILE FIRST STRATEGY                                      │
│                                                             │
│  เขียน CSS สำหรับ Mobile ก่อน แล้วค่อยเพิ่มสำหรับจอใหญ่     │
│                                                             │
│  ❌ Bad:   lg:hidden block    (ซ่อนบน desktop, แสดงบน mobile)│
│  ✅ Good:  block lg:hidden    (แสดงบน mobile, ซ่อนบน desktop)│
└─────────────────────────────────────────────────────────────┘
```

### Common Responsive Patterns

#### 1. Grid Layout

```html
<!-- 1 column mobile → 2 columns tablet → 3 columns desktop → 4 columns large -->
<div
  class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>
```

#### 2. Flexbox Direction

```html
<!-- Stack vertically on mobile, horizontal on desktop -->
<div class="flex flex-col md:flex-row gap-4">
  <div class="w-full md:w-1/3">Sidebar</div>
  <div class="w-full md:w-2/3">Main Content</div>
</div>
```

#### 3. Sidebar/Drawer Pattern

```html
<!-- Fixed sidebar on desktop, slide-in drawer on mobile -->
<aside
  class="
  fixed inset-y-0 left-0 z-50 w-72
  transform -translate-x-full lg:translate-x-0
  transition-transform duration-300
"
>
  <!-- Sidebar content -->
</aside>
```

#### 4. Typography Scaling

```html
<!-- Responsive font sizes -->
<h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">Heading</h1>

<p class="text-sm md:text-base lg:text-lg">Body text that scales</p>
```

#### 5. Spacing & Padding

```html
<!-- Responsive padding -->
<div class="p-4 md:p-6 lg:p-8 xl:p-12">Content with responsive padding</div>

<!-- Responsive margin -->
<div class="mx-4 md:mx-8 lg:mx-auto lg:max-w-6xl">Centered container</div>
```

#### 6. Show/Hide Elements

```html
<!-- Mobile only -->
<button class="block lg:hidden">☰ Menu</button>

<!-- Desktop only -->
<nav class="hidden lg:flex gap-4">
  <a href="#">Home</a>
  <a href="#">About</a>
</nav>
```

#### 7. Card Layout Example

```html
<div
  class="
  bg-white rounded-lg shadow-md
  p-4 md:p-6
  flex flex-col md:flex-row
  gap-4 md:gap-6
"
>
  <!-- Image: Full width on mobile, fixed width on desktop -->
  <img class="w-full md:w-48 h-48 object-cover rounded" src="..." />

  <!-- Content -->
  <div class="flex-1">
    <h3 class="text-lg md:text-xl font-semibold">Title</h3>
    <p class="text-sm md:text-base text-gray-600">Description</p>
  </div>
</div>
```

### Responsive Component Checklist

```
✅ Mobile First - เขียน base style สำหรับ mobile ก่อน
✅ Touch Friendly - ปุ่มขนาดอย่างน้อย 44x44px บน mobile
✅ Readable Text - font-size อย่างน้อย 16px บน mobile
✅ No Horizontal Scroll - ใช้ max-w-full, overflow-hidden
✅ Flexible Images - ใช้ w-full, max-w-full, object-cover
✅ Adequate Spacing - เพิ่ม padding/margin บนจอใหญ่
✅ Collapsible Navigation - ใช้ hamburger menu บน mobile
✅ Stack vs Row - flex-col บน mobile, flex-row บน desktop
```

### Testing Responsive Design

```
1. Chrome DevTools (F12 → Toggle Device Toolbar)
2. ทดสอบ Breakpoints: 320px, 640px, 768px, 1024px, 1280px
3. ทดสอบ Portrait และ Landscape
4. ทดสอบบนอุปกรณ์จริง (iOS Safari, Android Chrome)
```

---

## 3. AI System Prompt (Master Command)

_Copy this prompt to start/restart the project with any AI Agent._

```text
### ROLE & OBJECTIVE
You are a Senior Full-Stack Architect & DevOps Engineer specializing in the "Late 2025" tech stack.
Your task is to build a robust **Payment Gateway Integration System** using the specified technologies and architecture.

### TECH STACK (STRICT ENFORCEMENT)
1.  **Backend:** Java 21 LTS, Spring Boot 3.4+ (Latest).
    - Features: Virtual Threads, Java Records, Spring Data JPA.
2.  **Frontend:** Angular 21 (Latest).
    - Features: **Signals Architecture (Full)**, Zoneless Change Detection, Standalone Components, New Control Flow (`@if`, `@for`).
3.  **Database:** MySQL 8.0.
4.  **Infrastructure:** Docker & Docker Compose.

### ARCHITECTURE RULES (MVC PATTERN)
- **Model:**
  - Backend: Use `@Entity` for Database and `Java Records` for DTOs.
  - Frontend: Use strict TypeScript `interfaces` matching Backend DTOs.
- **View:**
  - Frontend: Angular Templates using new control flow. UI must be responsive.
- **Controller:**
  - Backend: `@RestController` strictly for HTTP handling. Business logic goes to `@Service`.
  - Frontend: Angular Components strictly for View logic. Business logic goes to `@Injectable` Services.

### CODING STANDARDS & CONSTRAINTS
1.  **Angular 21 Rules:**
    - Use `signal()`, `computed()`, and `effect()` for ALL state management. **DO NOT** use RxJS `BehaviorSubject`.
    - Use `inject()` instead of constructor injection where appropriate.
    - Setup for **Zoneless** execution (`provideExperimentalZonelessChangeDetection`).
2.  **Spring Boot Rules:**
    - Enable Virtual Threads (`spring.threads.virtual.enabled=true`).
    - Use Global Exception Handling returning `ProblemDetail`.
    - **Security:** Implement HMAC-SHA256 signature verification for Payment Webhooks.
3.  **Docker Rules:**
    - Use **Multi-stage builds** for both Backend (Maven -> JRE) and Frontend (Node -> Nginx).
    - `docker-compose.yml` must orchestrate Database, Backend, and Frontend with proper networking and volume persistence.
4.  **Language:**
    - Code: English.
    - **Comments & Explanations: THAI (ภาษาไทย)**.

### FIRST STEP: INFRASTRUCTURE & STRUCTURE
Please start by:
1.  Defining the **Project Folder Structure** (Tree view).
2.  Creating the **`docker-compose.yml`** file.
3.  Creating the **`Dockerfile` for Backend**.
4.  Creating the **`Dockerfile` for Frontend**.
```

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

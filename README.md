# 💳 Payment Gateway Integration System

> ระบบเชื่อมต่อ Payment Gateway สร้างด้วย Technology Stack ล่าสุดของปี 2025

![Java](https://img.shields.io/badge/Java-21_LTS-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4-green?logo=springboot)
![Angular](https://img.shields.io/badge/Angular-19-red?logo=angular)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)

---

## 📋 ภาพรวมโปรเจค (Project Overview)

ระบบ Payment Gateway แบบครบวงจร พร้อม Demo Shop สำหรับทดสอบการชำระเงิน

### ✨ Features

- 🛒 **Demo Shop** - ร้านอาหาร "ครัวคุณแม่" สำหรับทดสอบ
- 💳 **Payment Management** - สร้าง/จัดการ Payment
- 🔐 **Webhook Security** - HMAC-SHA256 Signature Verification
- 📱 **Responsive Design** - รองรับทุกขนาดหน้าจอ
- ⚡ **Modern Stack** - Java 21 Virtual Threads + Angular Signals

### Tech Stack

| Layer      | Technology              | Version |
| ---------- | ----------------------- | ------- |
| Backend    | Java LTS                | 21      |
| Backend    | Spring Boot             | 3.4+    |
| Frontend   | Angular (Signals)       | 19+     |
| Styling    | TailwindCSS             | 4.0     |
| Database   | MySQL                   | 8.0     |
| Cache      | Redis                   | 7       |
| Container  | Docker & Docker Compose | Latest  |

### สถาปัตยกรรม (Architecture)

- **Backend:** RESTful API พร้อม Virtual Threads
- **Frontend:** Signals Architecture + Zoneless Change Detection
- **Database:** MySQL 8.0 พร้อม JPA/Hibernate
- **Container:** Multi-stage Docker Builds

---

## 🚀 วิธีการรัน (How to Run)

### Prerequisites

- Docker Desktop
- Docker Compose

### ขั้นตอนการรัน

1. **Clone Repository**

   ```bash
   git clone <repository-url>
   cd "Payment Gateway Integration System"
   ```

2. **สร้างและรัน Containers**

   ```bash
   docker-compose up --build
   ```

3. **เข้าใช้งาน Application**

   | Service       | URL                                   |
   | ------------- | ------------------------------------- |
   | 🏠 Frontend   | http://localhost                      |
   | 🍜 Demo Shop  | http://localhost/shop                 |
   | 🔌 Backend API| http://localhost:8080/api/v1          |
   | 📚 Swagger UI | http://localhost:8080/swagger-ui.html |
   | ❤️ Health     | http://localhost:8080/actuator/health |

### หยุดการทำงาน

```bash
docker-compose down
```

### หยุดและลบ Volumes

```bash
docker-compose down -v
```

---

## 📁 โครงสร้างโปรเจค (Project Structure)

```
Payment Gateway Integration System/
├── docker-compose.yml          # Docker Compose Configuration
├── .env                        # Environment Variables
├── backend/
│   ├── Dockerfile             # Multi-stage Docker Build
│   ├── pom.xml                # Maven Dependencies
│   └── src/
│       └── main/
│           ├── java/          # Java Source Code
│           └── resources/     # Application Configuration
├── frontend/
│   ├── Dockerfile             # Multi-stage Docker Build
│   ├── nginx.conf             # Nginx Configuration
│   ├── package.json           # NPM Dependencies
│   └── src/
│       └── app/               # Angular Application
└── database/
    └── init/
        └── init.sql           # Database Initialization
```

---

## 🔧 Environment Variables

| Variable                 | Description         | Default         |
| ------------------------ | ------------------- | --------------- |
| `MYSQL_ROOT_PASSWORD`    | MySQL Root Password | rootpassword    |
| `MYSQL_DATABASE`         | Database Name       | payment_gateway |
| `MYSQL_USER`             | Database User       | payment_user    |
| `MYSQL_PASSWORD`         | Database Password   | payment_secret  |
| `PAYMENT_WEBHOOK_SECRET` | HMAC-SHA256 Secret  | -               |

---

## 🔒 Security Features

- **HMAC-SHA256** Webhook Signature Verification
- **Non-Root User** ใน Docker Containers
- **Security Headers** ใน Nginx

---

## 📝 API Endpoints

### Payments

| Method | Endpoint                       | Description          |
| ------ | ------------------------------ | -------------------- |
| GET    | `/api/v1/payments`             | รายการ payments      |
| GET    | `/api/v1/payments/{id}`        | ดู payment ตาม ID    |
| POST   | `/api/v1/payments`             | สร้าง payment ใหม่   |
| PUT    | `/api/v1/payments/{id}`        | อัพเดท payment       |
| DELETE | `/api/v1/payments/{id}`        | ลบ payment           |
| POST   | `/api/v1/payments/{id}/refund` | ขอ refund            |

### Merchants

| Method | Endpoint                 | Description         |
| ------ | ------------------------ | ------------------- |
| GET    | `/api/v1/merchants`      | รายการร้านค้า       |
| GET    | `/api/v1/merchants/{id}` | ดูร้านค้าตาม ID     |
| POST   | `/api/v1/merchants`      | สร้างร้านค้าใหม่    |

### Webhooks

| Method | Endpoint                   | Description          |
| ------ | -------------------------- | -------------------- |
| POST   | `/api/v1/webhooks/payment` | รับ webhook          |

### System

| Method | Endpoint           | Description     |
| ------ | ------------------ | --------------- |
| GET    | `/api/v1/health`   | Health Check    |
| GET    | `/api/v1/info`     | API Information |
| GET    | `/actuator/health` | Actuator Health |

---

## 📸 Screenshots

### Demo Shop (ครัวคุณแม่)
หน้าร้านอาหารสำหรับทดสอบ Payment Flow

### Dashboard
หน้า Dashboard แสดงสถิติ Payment

### Payment Management  
จัดการ Payment พร้อม Payment Link

---

## 🛠️ Development

### Backend Development

```bash
cd backend
./mvnw spring-boot:run
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

---

## 👨‍💻 Author

**Saknarin (Fang)**

- GitHub: [@saknarinZ](https://github.com/saknarinZ)

---

## 📄 License

MIT License - © 2025 Payment Gateway Team

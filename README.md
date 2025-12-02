# Payment Gateway Integration System

## 📋 ภาพรวมโปรเจค (Project Overview)

ระบบเชื่อมต่อ Payment Gateway สร้างด้วย Technology Stack ล่าสุดของปี 2025

### Tech Stack

| Layer     | Technology              | Version |
| --------- | ----------------------- | ------- |
| Backend   | Java LTS                | 21      |
| Backend   | Spring Boot             | 3.4+    |
| Frontend  | Angular                 | 19+     |
| Database  | MySQL                   | 8.0     |
| Container | Docker & Docker Compose | Latest  |

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
   - Frontend: http://localhost
   - Backend API: http://localhost:8080/api/v1
   - Health Check: http://localhost:8080/actuator/health

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

| Method | Endpoint           | Description     |
| ------ | ------------------ | --------------- |
| GET    | `/api/v1/health`   | Health Check    |
| GET    | `/api/v1/info`     | API Information |
| GET    | `/actuator/health` | Actuator Health |

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

## 📄 License

MIT License - © 2025 Payment Gateway Team

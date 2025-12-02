# =============================================================================
# Multi-Stage Dockerfile สำหรับ Angular Frontend
# Stage 1: Build ด้วย Node.js
# Stage 2: Serve ด้วย Nginx
# =============================================================================

# =============================================================================
# Stage 1: BUILD
# ใช้ Node.js LTS สำหรับ Build Angular Application
# =============================================================================
FROM node:22-alpine AS builder

# ตั้งค่า Working Directory
WORKDIR /app

# Copy package.json และ package-lock.json ก่อน
# เพื่อใช้ Docker Layer Caching สำหรับ npm install
COPY package*.json ./

# Install Dependencies
# --legacy-peer-deps สำหรับกรณีที่มี Peer Dependency Conflicts
RUN npm ci --legacy-peer-deps

# Copy Source Code ทั้งหมด
COPY . .

# Build Angular Application สำหรับ Production
# --configuration=production ใช้ Production Build Settings
# Output จะอยู่ที่ dist/frontend/browser
RUN npm run build -- --configuration=production

# =============================================================================
# Stage 2: RUNTIME
# ใช้ Nginx Alpine สำหรับ Serve Static Files
# =============================================================================
FROM nginx:alpine AS runtime

# ลบ Default Nginx Configuration
RUN rm -rf /usr/share/nginx/html/*

# Copy Built Angular Application จาก Builder Stage
# Angular 17+ จะ Output ไปที่ dist/<project-name>/browser
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Copy Custom Nginx Configuration
# สำหรับ SPA Routing และ API Proxy
COPY nginx.conf /etc/nginx/nginx.conf

# สร้าง Non-Root User สำหรับ Security Best Practice
# Nginx ต้อง Run ด้วย Root ในตอนเริ่มต้น แต่จะ Drop Privileges หลังจาก Bind Port
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Expose Port 80
EXPOSE 80

# Health Check สำหรับ Container
# ตรวจสอบว่า Nginx ทำงานปกติ
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Start Nginx ใน Foreground Mode
CMD ["nginx", "-g", "daemon off;"]

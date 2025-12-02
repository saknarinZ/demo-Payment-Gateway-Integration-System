# =============================================================================
# Multi-Stage Dockerfile สำหรับ Spring Boot Backend
# Stage 1: Build ด้วย Maven
# Stage 2: Run ด้วย Eclipse Temurin JRE 21
# =============================================================================

# =============================================================================
# Stage 1: BUILD
# ใช้ Maven Image สำหรับ Build โปรเจค Spring Boot
# =============================================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

# ตั้งค่า Working Directory
WORKDIR /app

# Copy pom.xml ก่อนเพื่อใช้ Docker Layer Caching
# ถ้า pom.xml ไม่เปลี่ยน จะใช้ Cache จาก Layer เดิม
COPY pom.xml .

# Download Dependencies ก่อน (ใช้ Cache ได้ถ้า pom.xml ไม่เปลี่ยน)
RUN mvn dependency:go-offline -B

# Copy Source Code
COPY src ./src

# Build โปรเจค โดยข้าม Tests (เพื่อความเร็วใน Build)
# -DskipTests ข้าม Unit Tests
# -Dspring-boot.build-image.skip=true ข้าม Spring Boot Image Build
RUN mvn clean package -DskipTests -B

# =============================================================================
# Stage 2: RUNTIME
# ใช้ JRE Image เล็กๆ สำหรับ Run Application
# =============================================================================
FROM eclipse-temurin:21-jre-alpine AS runtime

# ตั้งค่า Working Directory
WORKDIR /app

# สร้าง Non-Root User สำหรับ Security Best Practice
# ไม่ควร Run Application ด้วย Root User
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy JAR File จาก Builder Stage
# ใช้ชื่อไฟล์ที่ชัดเจนเพื่อง่ายต่อการจัดการ
COPY --from=builder /app/target/*.jar app.jar

# เปลี่ยน Owner ของไฟล์เป็น appuser
RUN chown appuser:appgroup app.jar

# สลับไปใช้ Non-Root User
USER appuser

# Expose Port 8080
EXPOSE 8080

# Health Check สำหรับ Container
# ตรวจสอบ Actuator Health Endpoint ทุก 30 วินาที
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# ตั้งค่า JVM Options สำหรับ Container Environment
# -XX:+UseContainerSupport: ให้ JVM รู้จัก Container Limits
# -XX:MaxRAMPercentage=75.0: ใช้ RAM สูงสุด 75% ของ Container
# -XX:+UseZGC: ใช้ Z Garbage Collector (เหมาะกับ Virtual Threads)
# -XX:+ZGenerational: เปิด Generational ZGC (Java 21)
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseZGC -XX:+ZGenerational"

# Entry Point สำหรับ Start Application
# ใช้ exec form เพื่อให้ Signal Handling ทำงานถูกต้อง
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

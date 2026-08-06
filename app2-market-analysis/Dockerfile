# ============================================================
# Dockerfile — App2 Spring Boot 后端（多阶段构建）
#
# 阶段 1（builder）：Maven 编译项目
# 阶段 2（runtime）：仅 JRE + 编译产物，镜像体积更小
#
# 使用方式：
#   docker build -t app2-backend .
#   docker run -p 8002:8002 -e APP_TASK1_BASE_URL=http://housing-predictor:8000 app2-backend
# ============================================================

# ---- 构建阶段 ----
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build
COPY pom.xml .
# 先下载依赖（利用 Docker 层缓存）
RUN mvn dependency:go-offline -B -q
COPY src/ ./src/
RUN mvn package -DskipTests -B -q

# ---- 运行阶段 ----
FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8002

# 启动 Spring Boot
ENTRYPOINT ["java", "-jar", "app.jar"]

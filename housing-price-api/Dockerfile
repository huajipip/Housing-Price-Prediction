# ============================================================
# Dockerfile — 房价预测 API
#
# 单阶段构建：模型通过 `python train.py` 在 Docker 外部训练，
# 生成的构件（joblib + json）在构建镜像时复制到容器中。
#
# 使用方式：
#   1. 先训练模型：cd housing-price-api && python train.py
#   2. 构建并运行：docker compose up --build
# ============================================================

FROM python:3.12-slim

# 设置工作目录
WORKDIR /app

# 安装 Python 依赖（除非 requirements.txt 变化，否则使用缓存层）
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY app/ ./app/

# 复制预训练的模型构件（由 `python train.py` 生成）
COPY models/ ./models/

# 暴露 API 端口
EXPOSE 8000

# 通过 uvicorn 启动 FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

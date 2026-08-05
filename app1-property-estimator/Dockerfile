# ============================================================
# Dockerfile — App1 Property Value Estimator 后端
#
# 基于 Python 3.12-slim，安装 FastAPI 依赖后复制应用代码。
# 启动命令使用 uvicorn 在 8001 端口运行。
#
# 使用方式：
#   docker build -t app1-backend .
#   docker run -p 8001:8001 -e TASK1_BASE_URL=http://housing-predictor:8000 app1-backend
# ============================================================

FROM python:3.12-slim

WORKDIR /app

# 安装 Python 依赖（利用 Docker 层缓存）
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY app/ ./app/

EXPOSE 8001

# 通过 uvicorn 启动 FastAPI（监听 8001 端口）
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]

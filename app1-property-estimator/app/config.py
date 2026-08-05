"""
config.py — App1 配置模块。

从环境变量读取 Task 1 基础 URL，提供默认值用于本地开发。
Docker Compose 中通过 environment 注入实际值。
"""

import os


# Task 1 ML 模型容器的基准 URL
# - Docker 环境: http://housing-predictor:8000（通过 docker-compose 注入）
# - 本地开发: http://localhost:8000（默认值）
TASK1_BASE_URL: str = os.getenv("TASK1_BASE_URL", "http://localhost:8000")

# 请求超时（秒），防止被 Task 1 容器无响应时无限等待
TASK1_TIMEOUT: float = 10.0

# 本服务端口
APP_PORT: int = 8001

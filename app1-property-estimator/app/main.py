"""
main.py — App1 FastAPI 应用入口。

App1 是 Task 1 的薄代理层：
  - 接收前端的预测请求 → 校验输入 → 转发 Task 1 → 返回结果
  - 提供模型信息查询和健康检查

四个端点（通过 routes/ 子模块注册）：
    POST /api/app1/predict        — 单条预测
    POST /api/app1/predict/batch  — 批量预测（上限 20 条）
    GET  /api/app1/model-info     — 模型系数和性能指标
    GET  /api/app1/health         — 健康检查 + Task 1 连通性探测
"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.client import close_client, get_client
from app.routes import routers

# ---------------------------------------------------------------------------
# 日志配置
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 应用生命周期管理
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用启动/关闭时的资源管理。

    启动时：预初始化 httpx 客户端（预热连接池，避免首个请求冷启动延迟）。
    关闭时：释放 httpx 连接池。
    """
    # 启动：预热 httpx 客户端
    await get_client()
    logger.info("App1 后端已启动，代理目标: Task 1 ML 模型。")
    yield
    # 关闭：释放连接池
    await close_client()
    logger.info("App1 后端已关闭。")


# ---------------------------------------------------------------------------
# FastAPI 应用实例
# ---------------------------------------------------------------------------

app = FastAPI(
    title="App1 - Property Value Estimator API",
    description="""
    App1 后端服务（薄代理层）。

    ## 职责
    - 接收前端表单提交 → 校验输入 → 转发 Task 1 预测 → 返回结果
    - 统一错误格式：`{"error": true, "message": "...", "detail": "..."}`

    ## 端点
    - **POST /api/app1/predict** — 单条房价预测
    - **POST /api/app1/predict/batch** — 批量房价预测
    - **GET /api/app1/model-info** — 模型信息
    - **GET /api/app1/health** — 健康检查
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS 中间件 — 允许 Next.js 前端跨域访问
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js 开发服务器
        "http://portal:3000",     # Docker Compose 内部
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# 注册路由
# ---------------------------------------------------------------------------

for router in routers:
    app.include_router(router)

# ---------------------------------------------------------------------------
# 请求日志中间件
# ---------------------------------------------------------------------------


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """记录每个 HTTP 请求的方法、路径和耗时。"""
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %d (%.2f ms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


# ---------------------------------------------------------------------------
# 全局异常处理器
# ---------------------------------------------------------------------------


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """捕获所有未处理的异常，返回统一错误格式。"""
    logger.error("未处理的异常 %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "服务器内部错误，请稍后重试。",
            "detail": str(exc),
        },
    )

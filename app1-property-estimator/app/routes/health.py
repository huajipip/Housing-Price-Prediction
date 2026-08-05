"""
routes/health.py — 健康检查端点。

- GET /api/app1/health  自身健康 + Task 1 连通性检查。

返回 degraded 而非直接报错：App1 自身正常但 Task 1 不可达时，
仍应返回 200（否则容器编排会误杀 App1），通过 status 字段告知真实状态。
"""

import logging

from fastapi import APIRouter

from app.client import check_task1_health
from app.schemas import HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/app1", tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="健康检查",
    description="检查 App1 自身状态及与 Task 1 的连通性。",
)
async def health():
    """
    健康检查：
    - 自身始终响应 200
    - 同时探测 Task 1 的 /health，连通则 task1_connected=true
    - 若 Task 1 不可达，status 变为 degraded（但仍返回 200）
    """
    task1_ok = await check_task1_health()
    if task1_ok:
        return HealthResponse(status="healthy", task1_connected=True)
    else:
        logger.warning("Task 1 不可达，服务降级。")
        return HealthResponse(status="degraded", task1_connected=False)

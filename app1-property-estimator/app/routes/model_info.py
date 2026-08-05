"""
routes/model_info.py — 模型信息端点。

- GET /api/app1/model-info  转发 Task 1 的模型系数和性能指标。

薄代理：直接转发，不做加工。
"""

import logging

import httpx
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.client import get_model_info as task1_model_info

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/app1", tags=["model-info"])


@router.get(
    "/model-info",
    summary="模型信息",
    description="返回房价预测模型的系数和性能指标。数据来自 Task 1 容器。",
)
async def model_info():
    """
    转发 Task 1 的 /model-info 结果。

    返回 coefficients（特征权重）、intercept（截距）、metrics（R²/MSE/MAE/RMSE）。
    """
    try:
        info = await task1_model_info()
        return info
    except httpx.HTTPError as exc:
        logger.error("获取模型信息失败: %s", exc)
        return JSONResponse(
            status_code=502,
            content={
                "error": True,
                "message": "无法获取模型信息，预测服务可能未启动。",
                "detail": str(exc),
            },
        )

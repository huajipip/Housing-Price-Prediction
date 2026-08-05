"""
routes/predict.py — 预测相关端点。

- POST /api/app1/predict       单条预测
- POST /api/app1/predict/batch 批量预测

两个端点都是薄代理：校验输入 → 转发 Task 1 → 返回结果。
"""

import logging

import httpx
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.client import predict_batch as task1_predict_batch
from app.client import predict_single as task1_predict_single
from app.schemas import BatchRequest, HouseFeatures, PredictionResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/app1", tags=["prediction"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="单条房价预测",
    description="接收单条房源特征，返回预测价格。",
)
async def single_predict(features: HouseFeatures):
    """
    单条预测：接收 7 个房源特征，调用 Task 1 返回预测价格。

    Pydantic 自动完成输入校验，非法数据直接返回 422。
    """
    try:
        price = await task1_predict_single(features.model_dump())
        return PredictionResponse(predictions=[price])
    except httpx.HTTPError as exc:
        logger.error("Task 1 单条预测失败: %s", exc)
        return JSONResponse(
            status_code=502,
            content={
                "error": True,
                "message": "预测服务暂时不可用，请稍后重试。",
                "detail": str(exc),
            },
        )


@router.post(
    "/predict/batch",
    response_model=PredictionResponse,
    summary="批量房价预测",
    description="接收多条房源特征（上限 20 条），返回对应的预测价格列表。",
)
async def batch_predict(batch: BatchRequest):
    """
    批量预测：接收房源特征列表，调用 Task 1 批量预测。

    前端限制 20 条，Pydantic 二次校验（max_length=20）。
    """
    try:
        houses_data = [h.model_dump() for h in batch.houses]
        prices = await task1_predict_batch(houses_data)
        return PredictionResponse(predictions=prices)
    except httpx.HTTPError as exc:
        logger.error("Task 1 批量预测失败: %s", exc)
        return JSONResponse(
            status_code=502,
            content={
                "error": True,
                "message": "预测服务暂时不可用，请稍后重试。",
                "detail": str(exc),
            },
        )

"""
main.py — 房价预测 API 的 FastAPI 应用入口。

三个端点：
    POST /predict     — 单个或批量房价预测
    GET  /model-info  — 模型系数与性能指标
    GET  /health      — 服务健康检查

模型在应用启动时通过 "startup" 事件处理器一次性加载到内存中。
"""

import logging
import time
from typing import Union

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.model import HousePricePredictor, predictor as global_predictor
from app.schemas import (
    HealthResponse,
    HouseFeatures,
    ModelInfoResponse,
    PredictionResponse,
)

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
# FastAPI 应用实例
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Housing Price Prediction API",
    description="""
    Predict house prices based on property features using a Linear Regression model.

    ## Endpoints
    - **POST /predict** — Predict prices for one or multiple houses
    - **GET /model-info** — View model coefficients and performance metrics
    - **GET /health** — Check if the service is running
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# ---------------------------------------------------------------------------
# 启动事件：将模型加载到内存
# ---------------------------------------------------------------------------


@app.on_event("startup")
def load_model() -> None:
    """应用启动时将预训练的模型构件加载到内存中。"""
    global global_predictor
    global_predictor = HousePricePredictor()
    logger.info("模型已加载，可以开始预测。")


# ---------------------------------------------------------------------------
# 中间件：请求日志
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
    """捕获所有未处理的异常，返回干净的 JSON 错误响应。"""
    logger.error("未处理的异常 %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "服务器内部错误，请检查日志。"},
    )


# ---------------------------------------------------------------------------
# API 端点
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health() -> HealthResponse:
    """
    健康检查端点。

    返回服务运行状态，供 Docker healthcheck 和负载均衡器使用。
    """
    return HealthResponse(status="healthy")


@app.get("/model-info", response_model=ModelInfoResponse, tags=["Model"])
async def model_info() -> ModelInfoResponse:
    """
    返回已训练模型的系数与性能指标。

    系数代表每个特征在标准化后对预测价格的贡献权重。指标包括 R²、MSE、MAE 和 RMSE。
    """
    if global_predictor is None:
        return JSONResponse(
            status_code=503,
            content={"detail": "模型尚未加载完成，请稍后重试。"},
        )

    info = global_predictor.get_model_info()
    return ModelInfoResponse(**info)


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(
    payload: Union[HouseFeatures, list[HouseFeatures]],
) -> PredictionResponse:
    """
    预测一处或多处房产的价格。

    - **单个预测**：发送单个 HouseFeatures 对象
    - **批量预测**：发送 HouseFeatures 对象列表

    单个请求示例：
    ```json
    {
        "square_footage": 1550,
        "bedrooms": 3,
        "bathrooms": 2,
        "year_built": 1997,
        "lot_size": 6800,
        "distance_to_city_center": 4.1,
        "school_rating": 7.6
    }
    ```

    批量请求示例：
    ```json
    [
        { "square_footage": 1550, "bedrooms": 3, ... },
        { "square_footage": 2200, "bedrooms": 4, ... }
    ]
    ```
    """
    if global_predictor is None:
        return JSONResponse(
            status_code=503,
            content={"detail": "模型尚未加载完成，请稍后重试。"},
        )

    # 归一化处理：单个对象 → 单元素列表
    if isinstance(payload, HouseFeatures):
        records = [payload.model_dump()]
    else:
        records = [item.model_dump() for item in payload]

    # 执行预测
    predictions = global_predictor.predict(records)

    return PredictionResponse(predictions=predictions)

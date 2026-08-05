"""
schemas.py — App1 的 Pydantic 请求/响应模型。

注意：这里的 HouseFeatures 与 Task 1 的 schemas.py 保持完全一致的校验规则，
确保在代理层就能拦截无效数据，减少对 Task 1 的无效请求。
"""

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# 请求模型（与 Task 1 字段校验完全一致）
# ---------------------------------------------------------------------------


class HouseFeatures(BaseModel):
    """
    单条房价预测的输入特征。
    7 个字段与训练数据集列一一对应，校验规则与 Task 1 保持一致。
    """

    square_footage: float = Field(
        ...,
        ge=1,
        description="总居住面积（平方英尺）",
    )
    bedrooms: int = Field(
        ...,
        ge=1,
        le=10,
        description="卧室数量",
    )
    bathrooms: float = Field(
        ...,
        ge=0.5,
        le=10,
        description="浴室数量（支持半卫，如 1.5）",
    )
    year_built: int = Field(
        ...,
        ge=1800,
        le=2030,
        description="建造年份",
    )
    lot_size: float = Field(
        ...,
        ge=1,
        description="地块面积（平方英尺）",
    )
    distance_to_city_center: float = Field(
        ...,
        ge=0,
        description="距市中心距离（英里）",
    )
    school_rating: float = Field(
        ...,
        ge=0,
        le=10,
        description="所在学区学校评分（0–10 分制）",
    )


class BatchRequest(BaseModel):
    """批量预测的请求体：包含多条房源特征。"""

    houses: list[HouseFeatures] = Field(
        ...,
        min_length=1,
        max_length=20,
        description="房源特征列表，单次最多 20 条",
    )


# ---------------------------------------------------------------------------
# 响应模型
# ---------------------------------------------------------------------------


class PredictionResponse(BaseModel):
    """单条或批量预测的响应（统一结构）。"""

    predictions: list[float] = Field(
        ...,
        description="预测价格列表。单条预测时列表长度为 1。",
    )


class ErrorResponse(BaseModel):
    """统一错误响应格式。前端统一判断 error 字段即可。"""

    error: bool = Field(default=True, description="始终为 true，表示出错")
    message: str = Field(..., description="用户可读的错误描述")
    detail: str | None = Field(default=None, description="可选的详细错误信息")


class HealthResponse(BaseModel):
    """App1 健康检查响应，包含自身和 Task 1 的连接状态。"""

    status: str = Field(..., description='"healthy" 或 "degraded"')
    task1_connected: bool = Field(..., description="Task 1 容器是否可达")

"""
schemas.py — 房价预测 API 的 Pydantic 请求/响应模型。

采用 Pydantic v2 风格，通过 Field(description=...) 自动生成 OpenAPI/Swagger 文档。
"""

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# 请求模型
# ---------------------------------------------------------------------------


class HouseFeatures(BaseModel):
    """
    单条房价预测的输入特征。

    全部 7 个字段与训练数据集中的列一一对应。
    校验规则确保输入值在合理范围内。
    """

    square_footage: float = Field(
        ...,
        ge=1,
        description="总居住面积（平方英尺）",
        examples=[1500.0],
    )
    bedrooms: int = Field(
        ...,
        ge=1,
        le=10,
        description="卧室数量",
        examples=[3],
    )
    bathrooms: float = Field(
        ...,
        ge=0.5,
        le=10,
        description="浴室数量（支持半卫，如 1.5）",
        examples=[2.0],
    )
    year_built: int = Field(
        ...,
        ge=1800,
        le=2030,
        description="建造年份",
        examples=[1997],
    )
    lot_size: float = Field(
        ...,
        ge=1,
        description="地块面积（平方英尺）",
        examples=[6800.0],
    )
    distance_to_city_center: float = Field(
        ...,
        ge=0,
        description="距市中心距离（英里）",
        examples=[4.1],
    )
    school_rating: float = Field(
        ...,
        ge=0,
        le=10,
        description="所在学区学校评分（0–10 分制）",
        examples=[7.6],
    )


# ---------------------------------------------------------------------------
# 响应模型
# ---------------------------------------------------------------------------


class PredictionResponse(BaseModel):
    """/predict 端点的响应模型（支持单个和批量）。"""

    predictions: list[float] = Field(
        ...,
        description="预测的房价列表。单个预测 → 包含 1 个元素的列表。",
        examples=[[245000.50]],
    )


class ModelInfoResponse(BaseModel):
    """/model-info 端点的响应模型。"""

    coefficients: dict[str, float] = Field(
        ...,
        description="特征名 → 系数权重（表示重要性和影响方向）",
    )
    intercept: float = Field(
        ...,
        description="模型截距（特征贡献之前的基础价格）",
    )
    metrics: dict[str, float] = Field(
        ...,
        description="性能指标：R²、MSE、MAE、RMSE",
    )


class HealthResponse(BaseModel):
    """/health 端点的响应模型。"""

    status: str = Field(
        default="healthy",
        description="服务健康状态",
        examples=["healthy"],
    )

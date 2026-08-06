"""
model.py — 房价预测器的模型加载与推理封装。

提供 HousePricePredictor 类，功能包括：
    1. 从磁盘加载预训练的标准化器、模型和评估指标
    2. 对外暴露 predict() 方法，支持单条/批量推理
    3. 对外暴露 get_model_info() 方法，供 /model-info 端点使用

模型构件由 `python train.py` 在 Docker 外部生成。
"""

import json
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 特征列顺序 — 单一定义源（train.py 和 model.py 共享）
# 这是训练和推理之间的数据契约，严禁两边分别维护
# ---------------------------------------------------------------------------

FEATURE_COLUMNS = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]

# 模型文件路径（相对于本模块）
_MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
_SCALER_PATH = _MODELS_DIR / "scaler.joblib"
_MODEL_PATH = _MODELS_DIR / "model.joblib"
_METRICS_PATH = _MODELS_DIR / "metrics.json"
_FEATURE_STATS_PATH = _MODELS_DIR / "feature_stats.json"


# ---------------------------------------------------------------------------
# 预测器类
# ---------------------------------------------------------------------------


class HousePricePredictor:
    """
    封装了 StandardScaler + LinearRegression 的推理管道。

    使用示例：
        predictor = HousePricePredictor()
        predictions = predictor.predict([
            {"square_footage": 1500, "bedrooms": 3, ...},
            {"square_footage": 2200, "bedrooms": 4, ...},
        ])
        info = predictor.get_model_info()
    """

    def __init__(self) -> None:
        """从磁盘加载模型构件。应用启动时调用一次。"""
        self._scaler: StandardScaler = joblib.load(_SCALER_PATH)
        self._model: LinearRegression = joblib.load(_MODEL_PATH)

        with open(_METRICS_PATH, "r", encoding="utf-8") as f:
            self._metrics: dict = json.load(f)

        try:
            with open(_FEATURE_STATS_PATH, "r", encoding="utf-8") as f:
                self._feature_stats: dict = json.load(f)
        except FileNotFoundError:
            logger.warning("feature_stats.json 未找到，请重新运行 train.py")
            self._feature_stats = {}

        logger.info(
            "模型加载成功。R²=%.4f, 特征数=%d",
            self._metrics["r2"],
            len(FEATURE_COLUMNS),
        )

    def predict(self, features: list[dict[str, float]]) -> list[float]:
        """
        预测一条或多条房产记录的价格。

        参数：
            features: 字典列表，每个字典包含 7 个特征键。
                      示例：[{"square_footage": 1500, "bedrooms": 3, ...}]

        返回值：
            预测价格列表，单位与训练数据中的货币单位一致。
        """
        if not features:
            return []

        # 将字典列表按正确的列顺序转换为 DataFrame
        df = pd.DataFrame(features)

        # 确保所有必需的列都存在
        missing = set(FEATURE_COLUMNS) - set(df.columns)
        if missing:
            raise ValueError(
                f"缺少必需的特征列：{missing}。"
                f"必需的列：{FEATURE_COLUMNS}"
            )

        # 按训练时的列顺序重排（对标准化器/模型至关重要）
        df = df[FEATURE_COLUMNS]

        # 标准化 + 预测
        X_scaled = self._scaler.transform(df)
        y_pred = self._model.predict(X_scaled)

        # 保留两位小数，输出更整洁
        return np.round(y_pred, 2).tolist()

    def get_model_info(self) -> dict:
        """
        返回模型系数与性能指标。

        返回格式：
            {
                "coefficients": {"square_footage": 123.4, ...},
                "intercept": 50000.0,
                "metrics": {"r2": 0.99, "mse": ..., "mae": ..., "rmse": ...}
            }
        """
        # 构建系数映射：特征名 → 权重（保留 2 位小数）
        coefficients = {
            k: round(float(v), 2)
            for k, v in zip(FEATURE_COLUMNS, self._model.coef_.tolist())
        }

        return {
            "coefficients": coefficients,
            "intercept": round(float(self._model.intercept_), 2),
            "metrics": self._metrics,
            "feature_stats": self._feature_stats,
        }


# ---------------------------------------------------------------------------
# 模块级单例（延迟初始化；在 main.py 的 startup 事件中实例化）
# ---------------------------------------------------------------------------

predictor: HousePricePredictor | None = None

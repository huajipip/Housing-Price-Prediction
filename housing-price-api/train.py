"""
train.py — 房价预测模型的独立训练脚本。

在 Docker 外部运行此脚本以生成模型构件：
    cd housing-price-api
    python train.py

生成的构件（保存到 models/ 目录）：
    - scaler.joblib   : 已拟合的 StandardScaler，用于特征归一化
    - model.joblib    : 已训练的 LinearRegression 模型
    - metrics.json    : 性能指标（R²、MSE、MAE、RMSE）

所有特征在训练前会被标准化，以确保：
    1. 不同量纲特征的系数具有可比较性
    2. 线性模型具有更好的数值稳定性
"""

import json
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler

# ---------------------------------------------------------------------------
# 配置
# ---------------------------------------------------------------------------

# 数据集路径（相对于此脚本的位置）
DATASET_PATH = Path(__file__).resolve().parent.parent / "my-asset" / "House Price Dataset.csv"

# 模型构件保存目录
MODELS_DIR = Path(__file__).resolve().parent / "models"

# 特征列 — 从 model.py 导入，确保与推理时完全一致
from app.model import FEATURE_COLUMNS

# 目标列
TARGET_COLUMN = "price"

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
# 训练流程
# ---------------------------------------------------------------------------


def load_dataset() -> pd.DataFrame:
    """从 CSV 文件加载房价数据集。"""
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"在 {DATASET_PATH} 未找到数据集。"
            "请确保 'House Price Dataset.csv' 位于项目根目录中。"
        )

    df = pd.read_csv(DATASET_PATH)
    logger.info("已加载数据集：%d 行, %d 列", len(df), len(df.columns))
    logger.info("特征列：%s", FEATURE_COLUMNS)
    return df


def train_model(
    X: pd.DataFrame, y: pd.Series
) -> tuple[StandardScaler, LinearRegression, dict]:
    """
    训练预测管道：StandardScaler + LinearRegression。

    参数：
        X: 特征 DataFrame（形状：n_samples × 7）。
        y: 目标 Series（价格值）。

    返回：
        元组 (已拟合的标准化器, 已训练的模型, 指标字典)。
    """
    # 第 1 步：将特征缩放到均值为 0、方差为 1
    # 这一步至关重要，因为各特征量纲差异很大：
    #   square_footage 约 1000-2400，school_rating 约 6.5-9.2
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    logger.info(
        "StandardScaler 已拟合。特征均值：%s", scaler.mean_.round(2).tolist()
    )

    # 第 2 步：在标准化后的特征上训练 LinearRegression
    # 选择 LinearRegression 的原因：
    #   - 完全可解释（系数 = 特征重要性）
    #   - 简洁（非常适合这种结构良好的合成数据集）
    #   - 训练速度快（闭式解，无需超参数调优）
    model = LinearRegression()
    model.fit(X_scaled, y)
    logger.info("LinearRegression 训练完成。")

    # 第 3 步：在训练数据上预测并计算指标
    y_pred = model.predict(X_scaled)

    metrics = {
        "r2": round(r2_score(y, y_pred), 4),
        "mse": round(mean_squared_error(y, y_pred), 2),
        "mae": round(mean_absolute_error(y, y_pred), 2),
        "rmse": round(np.sqrt(mean_squared_error(y, y_pred)), 2),
    }

    logger.info("训练指标：%s", json.dumps(metrics, indent=2))

    return scaler, model, metrics


def save_artifacts(
    scaler: StandardScaler,
    model: LinearRegression,
    metrics: dict,
    feature_stats: dict,
) -> None:
    """将标准化器、模型、指标和特征统计保存到 models/ 目录。"""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # 保存标准化器
    scaler_path = MODELS_DIR / "scaler.joblib"
    joblib.dump(scaler, scaler_path)
    logger.info("已保存标准化器 → %s", scaler_path)

    # 保存模型
    model_path = MODELS_DIR / "model.joblib"
    joblib.dump(model, model_path)
    logger.info("已保存模型     → %s", model_path)

    # 以可读 JSON 格式保存指标
    metrics_path = MODELS_DIR / "metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    logger.info("已保存指标     → %s", metrics_path)

    # 保存训练数据特征统计（min/max/mean），供前端 what-if 动态设置滑块范围
    stats_path = MODELS_DIR / "feature_stats.json"
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(feature_stats, f, indent=2)
    logger.info("已保存特征统计 → %s", stats_path)


def main() -> None:
    """主入口：加载数据 → 训练 → 保存构件。"""
    logger.info("=" * 60)
    logger.info("开始模型训练...")
    logger.info("=" * 60)

    # 1. 加载数据
    df = load_dataset()

    # 2. 提取特征 (X) 和目标 (y)
    # 丢弃 'id' 列 — 它只是行索引，不是特征
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    logger.info("X 形状：%s, y 形状：%s", X.shape, y.shape)

    # 3. 训练（使用全量数据集；生产环境建议使用交叉验证）
    scaler, model, metrics = train_model(X, y)

    # 3.5 计算训练数据特征统计（min/max/mean），供前端 what-if 动态设置滑块范围
    feature_stats = {}
    for col in FEATURE_COLUMNS:
        feature_stats[col] = {
            "min": float(X[col].min()),
            "max": float(X[col].max()),
            "mean": float(X[col].mean()),
        }
    logger.info("特征统计：%s", json.dumps(feature_stats, indent=2))

    # 4. 保存构件供 FastAPI 服务加载使用
    save_artifacts(scaler, model, metrics, feature_stats)

    # 5. 打印系数以供检查
    logger.info("=" * 60)
    logger.info("特征系数（标准化后）：")
    for name, coef in zip(FEATURE_COLUMNS, model.coef_):
        logger.info("  %-28s → %+.4f", name, coef)
    logger.info("  %-28s → %+.4f", "截距", model.intercept_)
    logger.info("=" * 60)
    logger.info("训练完成！模型构件已保存到 models/ 目录")
    logger.info("下一步：docker compose up --build")


if __name__ == "__main__":
    main()

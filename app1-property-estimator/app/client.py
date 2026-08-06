"""
client.py — Task 1 HTTP 客户端封装。

使用 httpx.AsyncClient 进行异步 HTTP 调用，与 FastAPI 的 async 事件循环兼容。
所有 Task 1 的交互都通过这个模块，方便统一管理超时、错误处理和日志。
"""

import logging

import httpx

from app.config import TASK1_BASE_URL, TASK1_TIMEOUT

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 单例 httpx AsyncClient（应用生命周期内复用连接池）
# ---------------------------------------------------------------------------

_client: httpx.AsyncClient | None = None


async def get_client() -> httpx.AsyncClient:
    """获取或创建 httpx AsyncClient 实例。延迟初始化，在 lifespan 中调用。"""
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            base_url=TASK1_BASE_URL,
            timeout=httpx.Timeout(TASK1_TIMEOUT),
        )
        logger.info("httpx 客户端已初始化，base_url=%s", TASK1_BASE_URL)
    return _client


async def close_client() -> None:
    """关闭 httpx 客户端，释放连接池。在应用关闭时调用。"""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None
        logger.info("httpx 客户端已关闭。")


# ---------------------------------------------------------------------------
# Task 1 API 调用封装
# ---------------------------------------------------------------------------


async def predict_single(features: dict) -> float:
    """
    调用 Task 1 POST /predict 进行单条预测。

    Args:
        features: 包含 7 个字段的字典。

    Returns:
        预测价格（float）。

    Raises:
        httpx.HTTPError: Task 1 调用失败时抛出。
    """
    client = await get_client()
    response = await client.post("/predict", json=features)
    response.raise_for_status()
    data = response.json()
    predictions = data.get("predictions", [])
    if not predictions:
        raise ValueError("Task 1 returned empty predictions list")
    return predictions[0]


async def predict_batch(features_list: list[dict]) -> list[float]:
    """
    调用 Task 1 POST /predict 进行批量预测。

    Args:
        features_list: 包含多条房源特征字典的列表。

    Returns:
        预测价格列表。

    Raises:
        httpx.HTTPError: Task 1 调用失败时抛出。
    """
    client = await get_client()
    response = await client.post("/predict", json=features_list)
    response.raise_for_status()
    data = response.json()
    predictions = data.get("predictions", [])
    if len(predictions) != len(features_list):
        logger.warning(
            "Task 1 返回 %d 条预测，但请求了 %d 条",
            len(predictions), len(features_list),
        )
    return predictions


async def get_model_info() -> dict:
    """
    调用 Task 1 GET /model-info 获取模型信息。

    Returns:
        包含 coefficients, intercept, metrics 的字典。

    Raises:
        httpx.HTTPError: Task 1 调用失败时抛出。
    """
    client = await get_client()
    response = await client.get("/model-info")
    response.raise_for_status()
    return response.json()


async def check_task1_health() -> bool:
    """
    检查 Task 1 容器是否可达。

    Returns:
        True 表示 Task 1 正常响应，False 表示不可达。
    """
    try:
        client = await get_client()
        response = await client.get("/health")
        return response.status_code == 200
    except httpx.HTTPError:
        return False

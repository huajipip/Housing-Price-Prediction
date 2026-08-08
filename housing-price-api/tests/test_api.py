"""
test_api.py — 房价预测 API 的接口契约测试。

测试策略：使用 FastAPI 官方 TestClient 直接调用 HTTP 端点，
并通过 lifespan 加载真实模型（models/ 下的 joblib 产物），
验证"真实请求 → 真实路由 → 真实模型"的整条链路。

覆盖范围：
    1. /health              — 健康检查契约
    2. /predict 单个        — 单个预测契约
    3. /predict 批量        — 批量预测契约
    4. /predict 字段缺失    — Pydantic 校验（422）
    5. /predict 数值越界    — Pydantic ge/le 校验（422）
    6. /predict 超批量上限  — 业务规则（422）
    7. /model-info          — 模型元数据契约

运行方式（在 housing-price-api/ 目录下）：
    pip install -r requirements-dev.txt
    pytest -q
"""

import math

# 一组合法的输入特征，与训练数据集字段一一对应
VALID_FEATURES = {
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6,
}


def test_health_returns_ok(client):
    """/health 应始终返回 200 和 healthy 状态。"""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "healthy"}


def test_predict_single_house(client):
    """单个对象请求应返回含 1 个元素的预测列表，且价格为正的有限数。"""
    resp = client.post("/predict", json=VALID_FEATURES)
    assert resp.status_code == 200

    data = resp.json()
    assert len(data["predictions"]) == 1

    price = data["predictions"][0]
    assert math.isfinite(price)
    assert price > 0


def test_predict_batch_of_houses(client):
    """列表请求应返回与输入条数一致的预测结果。"""
    batch = [dict(VALID_FEATURES) for _ in range(3)]
    resp = client.post("/predict", json=batch)
    assert resp.status_code == 200
    assert len(resp.json()["predictions"]) == 3


def test_predict_rejects_missing_field(client):
    """缺少必需特征时，Pydantic 应返回 422。"""
    invalid = dict(VALID_FEATURES)
    del invalid["school_rating"]
    resp = client.post("/predict", json=invalid)
    assert resp.status_code == 422


def test_predict_rejects_out_of_range_bedrooms(client):
    """bedrooms=0 超出 ge=1 约束时返回 422（展示 Pydantic 字段校验）。"""
    invalid = dict(VALID_FEATURES, bedrooms=0)
    resp = client.post("/predict", json=invalid)
    assert resp.status_code == 422


def test_predict_rejects_over_batch_limit(client):
    """超过 100 条的批量请求应被业务规则拒绝（422）。"""
    oversized = [dict(VALID_FEATURES) for _ in range(101)]
    resp = client.post("/predict", json=oversized)
    assert resp.status_code == 422
    assert "上限" in resp.json()["detail"]


def test_model_info_returns_coefficients(client):
    """model-info 应返回系数、截距、指标和特征统计，且覆盖全部 7 个特征。"""
    resp = client.get("/model-info")
    assert resp.status_code == 200

    data = resp.json()
    expected_features = {
        "square_footage",
        "bedrooms",
        "bathrooms",
        "year_built",
        "lot_size",
        "distance_to_city_center",
        "school_rating",
    }
    assert set(data["coefficients"].keys()) == expected_features
    assert isinstance(data["intercept"], float)
    assert "r2" in data["metrics"]
    assert set(data["feature_stats"].keys()) == expected_features

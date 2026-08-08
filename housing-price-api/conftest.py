"""
conftest.py — pytest 根配置。

1. 本文件位于项目根目录（housing-price-api/），pytest 会据此把根目录
   加入 sys.path，使测试文件可以 `from app.main import app`。
2. 提供 session 级别的 TestClient fixture：所有测试复用同一次模型加载，
   避免每个测试用例都重新从磁盘加载模型文件。

运行方式（在 housing-price-api/ 目录下）：
    pip install -r requirements-dev.txt
    pytest -q
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client():
    """返回一个已触发 lifespan（真实模型已加载）的测试客户端。

    使用 `with` 进入会触发 FastAPI 的 lifespan，从而加载真实的
    models/*.joblib 模型构件——测试跑的就是生产路径。
    """
    with TestClient(app) as c:
        yield c

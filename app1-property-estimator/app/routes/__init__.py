"""
routes/__init__.py — 路由模块注册。

将各功能路由子模块的 APIRouter 集中注册到这里，
由 main.py 统一挂载到 FastAPI 应用上。
"""

from app.routes.health import router as health_router
from app.routes.model_info import router as model_info_router
from app.routes.predict import router as predict_router

# 暴露给 main.py 使用的所有路由列表
routers = [health_router, model_info_router, predict_router]

__all__ = ["routers"]
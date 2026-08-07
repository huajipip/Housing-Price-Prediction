# 全栈房价预测门户（Interview Fullstack Project）

一个用于技术面试演示的多应用统一门户：Next.js 门户 + 两个独立后端（Python FastAPI / Java Spring Boot），共同接入 Task 1 的房价预测 ML 模型。

## 架构

```
┌──────────────────────────────────────────────────────┐
│                 浏览器 (Browser)                        │
└─────────────────────────┬────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│        Next.js 统一门户 (App Router, 端口 3000)         │
│   共享布局 | 导航 | 设计系统 | 加载/错误边界              │
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │ App1 房源估值器   │  │ App2 市场分析            │  │
│  │ (FastAPI 后端)    │  │ (Spring Boot 后端)       │  │
│  └────────┬─────────┘  └───────────┬──────────────┘  │
└───────────┼────────────────────────┼────────────────┘
            │ 8001                   │ 8002
            ▼                        ▼
┌──────────────────────────────────────────────────────┐
│        Task 1: 房价预测 ML 模型 (FastAPI, 8000)        │
│          /predict | /model-info | /health             │
└──────────────────────────────────────────────────────┘
```

## 子项目

| 目录 | 职责 | 技术栈 | 端口 |
|------|------|--------|------|
| `housing-price-api/` | Task 1：房价预测 ML 模型 API | Python 3.12 + FastAPI + Scikit-learn（LinearRegression） | 8000 |
| `app1-property-estimator/` | App1：房源估值器（薄代理层） | Python 3.12 + FastAPI | 8001 |
| `app2-market-analysis/` | App2：房产市场分析 | Java 21 + Spring Boot 3.4.4 | 8002 |
| `portal/` | 统一门户 | Next.js 16 (App Router) + Tailwind CSS + RSC | 3000 |

## 一键启动

```bash
docker compose up --build
```

启动后访问：
- 门户入口：http://localhost:3000
- Task 1 Swagger：http://localhost:8000/docs
- App1 文档：http://localhost:8001/docs
- App2 健康：http://localhost:8002/api/app2/health

## 核心功能

**Task 1 — 房价预测模型**
- `/predict`：单条 + 批量预测（LinearRegression + StandardScaler，R²≈0.99）
- `/model-info`：模型系数、性能指标、特征统计
- `/health`：健康检查

**App1 — 房源估值器**（Python 后端）
- 单条预测表单（7 特征字段 + 客户端/后端双重校验）
- 批量对比（表格 + CSV 上传 + 最高/最低高亮 + 排序）
- 历史记录（localStorage + 一键回填）

**App2 — 市场分析**（Java 后端）
- 交互式仪表盘（统计卡片 + 直方图 + 散点图 + 区间筛选）
- What-If 分析（滑块实时模拟 + 多特征曲线叠加 + 中位数重置）
- 数据导出（筛选 CSV + PDF 报告，Caffeine 缓存优化）

## 文档

- `REQUIREMENTS-AUDIT.md` — 需求对照审计 + 修复记录
- `ISSUES.md` — 遗留问题清单
- `my-asset/Task2-Requirements.md` — 需求详解

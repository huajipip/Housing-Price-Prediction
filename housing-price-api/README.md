# Housing Price Prediction API

基于 FastAPI 的微服务，使用线性回归模型根据房产特征预测房价。

---

## 快速开始

### 前置条件

- Python 3.12+
- Docker（可选，用于容器化部署）

### 1. 训练模型

```bash
cd housing-price-api
pip install -r requirements.txt
python train.py
```

此命令将在 `models/` 目录下生成模型构件：
- `scaler.joblib` — StandardScaler 标准化器，用于特征归一化
- `model.joblib` — 已训练的 LinearRegression 线性回归模型
- `metrics.json` — 性能指标（R²、MSE、MAE、RMSE）

### 2. 启动 API

**方式 A — 本地开发**

```bash
uvicorn app.main:app --reload --port 8000
```

**方式 B — Docker（类生产环境）**

```bash
docker compose up --build
```

### 3. 探索 API

打开 **http://localhost:8000/docs** 查看交互式 Swagger UI 文档。

---

## API 端点

| 方法 | 路径 | 说明 |
|--------|------|-------------|
| `POST` | `/predict` | 预测房价 — 支持单个和批量 |
| `GET` | `/model-info` | 模型系数与性能指标 |
| `GET` | `/health` | 健康检查（返回 `{"status": "healthy"}`） |

### `/predict` — 单个预测

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6
  }'
```

响应：
```json
{ "predictions": [250879.73] }
```

### `/predict` — 批量预测

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '[
    {"square_footage": 1550, "bedrooms": 3, "bathrooms": 2, "year_built": 1997, "lot_size": 6800, "distance_to_city_center": 4.1, "school_rating": 7.6},
    {"square_footage": 2200, "bedrooms": 4, "bathrooms": 2.5, "year_built": 2008, "lot_size": 9600, "distance_to_city_center": 7.0, "school_rating": 8.8}
  ]'
```

响应：
```json
{ "predictions": [250879.73, 364551.64] }
```

### `/model-info`

```bash
curl http://localhost:8000/model-info
```

### `/health`

```bash
curl http://localhost:8000/health
```

---

## 特征说明

| 特征 | 类型 | 说明 |
|---------|------|-------------|
| `square_footage` | float | 总居住面积（平方英尺） |
| `bedrooms` | int | 卧室数量 |
| `bathrooms` | float | 浴室数量（支持 1.5、2.5 等半卫） |
| `year_built` | int | 建造年份 |
| `lot_size` | float | 地块面积（平方英尺） |
| `distance_to_city_center` | float | 距市中心距离（英里） |
| `school_rating` | float | 所在学区学校评分（0–10 分制） |

---

## 模型详情

- **算法**：线性回归（scikit-learn）
- **预处理**：StandardScaler（零均值、单位方差）
- **训练数据**：50 条合成房产记录
- **R²**：0.9911
- **RMSE**：$7,510.99

---

## 项目结构

```
housing-price-api/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI 应用（含 3 个端点）
│   ├── model.py         # 模型加载器 + 预测器类
│   └── schemas.py       # Pydantic 请求/响应模型
├── models/
│   ├── scaler.joblib    # 已拟合的 StandardScaler
│   ├── model.joblib     # 已训练的 LinearRegression
│   └── metrics.json     # 性能指标
├── train.py             # 独立训练脚本
├── requirements.txt     # Python 依赖
├── Dockerfile           # 容器镜像定义
├── docker-compose.yml   # Docker Compose 编排文件
└── README.md            # 本文件
```

---

## 设计决策

1. **在 Docker 外部训练** — 模型构件通过 `python train.py` 生成后复制到镜像中。这样能让 Dockerfile 保持简洁（单阶段构建），使模型透明可审查，并支持快速迭代（修改参数 → 重新训练 → 重启容器）。

2. **线性回归** — 选择它的原因是完全可解释性。每个系数直接反映该特征对预测价格的贡献，无黑盒行为 — 非常适合面试展示。

3. **StandardScaler 标准化** — 特征量纲差异很大（例如 `square_footage` 约 1000–2400，而 `school_rating` 约 6–10）。标准化确保系数可比较，且模型训练具有数值稳定性。

4. **单个 + 批量统一端点** — `/predict` 端点通过 Union 类型同时接受单个对象和对象列表，内部自动归一化处理。减少了 API 表面积，同时保持了灵活性。

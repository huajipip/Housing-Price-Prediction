# Housing Price Prediction API

A FastAPI-based microservice that predicts house prices using a Linear Regression model trained on property features.

---

## Quick Start

### Prerequisites

- Python 3.12+
- Docker (optional, for containerized deployment)

### 1. Train the Model

```bash
cd housing-price-api
pip install -r requirements.txt
python train.py
```

This generates model artifacts in `models/`:
- `scaler.joblib` — StandardScaler for feature normalization
- `model.joblib` — Trained LinearRegression model
- `metrics.json` — Performance metrics (R², MSE, MAE, RMSE)

### 2. Run the API

**Option A — Local (development)**

```bash
uvicorn app.main:app --reload --port 8000
```

**Option B — Docker (production-like)**

```bash
docker compose up --build
```

### 3. Explore the API

Open **http://localhost:8000/docs** for interactive Swagger UI documentation.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/predict` | Predict house price(s) — supports single & batch |
| `GET` | `/model-info` | Model coefficients & performance metrics |
| `GET` | `/health` | Health check (returns `{"status": "healthy"}`) |

### `/predict` — Single Prediction

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

Response:
```json
{ "predictions": [250879.73] }
```

### `/predict` — Batch Prediction

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '[
    {"square_footage": 1550, "bedrooms": 3, "bathrooms": 2, "year_built": 1997, "lot_size": 6800, "distance_to_city_center": 4.1, "school_rating": 7.6},
    {"square_footage": 2200, "bedrooms": 4, "bathrooms": 2.5, "year_built": 2008, "lot_size": 9600, "distance_to_city_center": 7.0, "school_rating": 8.8}
  ]'
```

Response:
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

## Feature Descriptions

| Feature | Type | Description |
|---------|------|-------------|
| `square_footage` | float | Total living area (sq ft) |
| `bedrooms` | int | Number of bedrooms |
| `bathrooms` | float | Number of bathrooms (supports 1.5, 2.5, etc.) |
| `year_built` | int | Year of construction |
| `lot_size` | float | Lot size (sq ft) |
| `distance_to_city_center` | float | Distance to city center (miles) |
| `school_rating` | float | Local school rating (0–10) |

---

## Model Details

- **Algorithm**: Linear Regression (scikit-learn)
- **Preprocessing**: StandardScaler (zero mean, unit variance)
- **Training data**: 50 synthetic house records
- **R²**: 0.9911
- **RMSE**: $7,510.99

---

## Project Structure

```
housing-price-api/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app with 3 endpoints
│   ├── model.py         # Model loader + predictor class
│   └── schemas.py       # Pydantic request/response models
├── models/
│   ├── scaler.joblib    # Fitted StandardScaler
│   ├── model.joblib     # Trained LinearRegression
│   └── metrics.json     # Performance metrics
├── train.py             # Standalone training script
├── requirements.txt     # Python dependencies
├── Dockerfile           # Container image definition
├── docker-compose.yml   # Docker Compose orchestration
└── README.md            # This file
```

---

## Design Decisions

1. **Training outside Docker** — Model artifacts are generated with `python train.py` and copied into the image. This keeps the Dockerfile simple (single-stage), makes the model transparent and inspectable, and enables fast iteration (change params → retrain → restart container).

2. **Linear Regression** — Chosen for full interpretability. Each coefficient directly represents a feature's contribution to the predicted price. No black-box behavior — ideal for an interview demonstration.

3. **StandardScaler** — Features span vastly different ranges (e.g., `square_footage` ~1000–2400 vs `school_rating` ~6–10). Standardization ensures coefficients are comparable and the model trains with numerical stability.

4. **Single + Batch via Union** — The `/predict` endpoint accepts both a single object and a list of objects, normalizing the input internally. Reduces API surface while maintaining flexibility.

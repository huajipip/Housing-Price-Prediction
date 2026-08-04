"""
main.py — FastAPI application entry point for the Housing Price API.

Three endpoints:
    POST /predict     — Single or batch house price prediction
    GET  /model-info  — Model coefficients and performance metrics
    GET  /health      — Service health check

The model is loaded once at startup via the "startup" event handler.
"""

import logging
import time
from typing import Union

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.model import HousePricePredictor, predictor as global_predictor
from app.schemas import (
    HealthResponse,
    HouseFeatures,
    ModelInfoResponse,
    PredictionResponse,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Housing Price Prediction API",
    description="""
    Predict house prices based on property features using a Linear Regression model.

    ## Endpoints
    - **POST /predict** — Predict prices for one or multiple houses
    - **GET /model-info** — View model coefficients and performance metrics
    - **GET /health** — Check if the service is running
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# ---------------------------------------------------------------------------
# Startup: load model into memory
# ---------------------------------------------------------------------------


@app.on_event("startup")
def load_model() -> None:
    """Load the pre-trained model artifacts into memory on app startup."""
    global global_predictor
    global_predictor = HousePricePredictor()
    logger.info("Model loaded and ready for predictions.")


# ---------------------------------------------------------------------------
# Middleware: request logging
# ---------------------------------------------------------------------------


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log each HTTP request with method, path, and duration."""
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %d (%.2f ms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch any unhandled exceptions and return a clean JSON error."""
    logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please check the logs."},
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health() -> HealthResponse:
    """
    Health check endpoint.

    Returns the service status. Used by Docker healthcheck and load balancers.
    """
    return HealthResponse(status="healthy")


@app.get("/model-info", response_model=ModelInfoResponse, tags=["Model"])
async def model_info() -> ModelInfoResponse:
    """
    Return the trained model's coefficients and performance metrics.

    Coefficients represent the weight each feature contributes to the
    predicted price (on standardized features). Metrics include R², MSE,
    MAE, and RMSE.
    """
    if global_predictor is None:
        return JSONResponse(
            status_code=503,
            content={"detail": "Model not loaded yet. Please retry shortly."},
        )

    info = global_predictor.get_model_info()
    return ModelInfoResponse(**info)


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(
    payload: Union[HouseFeatures, list[HouseFeatures]],
) -> PredictionResponse:
    """
    Predict house prices for one or more properties.

    - **Single prediction**: Send a single HouseFeatures object
    - **Batch prediction**: Send a list of HouseFeatures objects

    Example single request:
    ```json
    {
        "square_footage": 1550,
        "bedrooms": 3,
        "bathrooms": 2,
        "year_built": 1997,
        "lot_size": 6800,
        "distance_to_city_center": 4.1,
        "school_rating": 7.6
    }
    ```

    Example batch request:
    ```json
    [
        { "square_footage": 1550, "bedrooms": 3, ... },
        { "square_footage": 2200, "bedrooms": 4, ... }
    ]
    ```
    """
    if global_predictor is None:
        return JSONResponse(
            status_code=503,
            content={"detail": "Model not loaded yet. Please retry shortly."},
        )

    # Normalize: single object → list of one
    if isinstance(payload, HouseFeatures):
        records = [payload.model_dump()]
    else:
        records = [item.model_dump() for item in payload]

    # Predict
    predictions = global_predictor.predict(records)

    return PredictionResponse(predictions=predictions)

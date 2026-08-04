"""
schemas.py — Pydantic request/response models for the Housing Price API.

Uses Pydantic v2 style with Field(description=...) for auto-generated
OpenAPI/Swagger documentation.
"""

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------


class HouseFeatures(BaseModel):
    """
    Input features for a single house price prediction.

    All 7 fields correspond exactly to the columns in the training dataset.
    Validation ensures reasonable value ranges.
    """

    square_footage: float = Field(
        ...,
        ge=1,
        description="Total living area in square feet",
        examples=[1500.0],
    )
    bedrooms: int = Field(
        ...,
        ge=1,
        le=10,
        description="Number of bedrooms",
        examples=[3],
    )
    bathrooms: float = Field(
        ...,
        ge=0.5,
        le=10,
        description="Number of bathrooms (supports half-baths like 1.5)",
        examples=[2.0],
    )
    year_built: int = Field(
        ...,
        ge=1800,
        le=2030,
        description="Year the house was built",
        examples=[1997],
    )
    lot_size: float = Field(
        ...,
        ge=1,
        description="Lot size in square feet",
        examples=[6800.0],
    )
    distance_to_city_center: float = Field(
        ...,
        ge=0,
        description="Distance to city center in miles",
        examples=[4.1],
    )
    school_rating: float = Field(
        ...,
        ge=0,
        le=10,
        description="Local school rating (0–10 scale)",
        examples=[7.6],
    )


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------


class PredictionResponse(BaseModel):
    """Response for the /predict endpoint (single or batch)."""

    predictions: list[float] = Field(
        ...,
        description="Predicted house prices. Single prediction → list of 1 element.",
        examples=[[245000.50]],
    )


class ModelInfoResponse(BaseModel):
    """Response for the /model-info endpoint."""

    coefficients: dict[str, float] = Field(
        ...,
        description="Feature name → coefficient weight (importance and direction)",
    )
    intercept: float = Field(
        ...,
        description="Model intercept (base price before feature contributions)",
    )
    metrics: dict[str, float] = Field(
        ...,
        description="Performance metrics: R², MSE, MAE, RMSE",
    )


class HealthResponse(BaseModel):
    """Response for the /health endpoint."""

    status: str = Field(
        default="healthy",
        description="Service health status",
        examples=["healthy"],
    )

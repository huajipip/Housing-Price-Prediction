"""
model.py — Model loading and inference wrapper for the House Price Predictor.

Provides a HousePricePredictor class that:
    1. Loads pre-trained scaler, model, and metrics from disk
    2. Exposes predict() for single/batch inference
    3. Exposes get_model_info() for the /model-info endpoint

The model artifacts are generated OUTSIDE Docker by `python train.py`.
"""

import json
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Feature column order — must match train.py EXACTLY
# This is the contract between train.py and model.py
# ---------------------------------------------------------------------------

FEATURE_COLUMNS = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]

# Paths relative to this module
_MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
_SCALER_PATH = _MODELS_DIR / "scaler.joblib"
_MODEL_PATH = _MODELS_DIR / "model.joblib"
_METRICS_PATH = _MODELS_DIR / "metrics.json"


# ---------------------------------------------------------------------------
# Predictor
# ---------------------------------------------------------------------------


class HousePricePredictor:
    """
    Wrapper around the trained StandardScaler + LinearRegression pipeline.

    Usage:
        predictor = HousePricePredictor()
        predictions = predictor.predict([
            {"square_footage": 1500, "bedrooms": 3, ...},
            {"square_footage": 2200, "bedrooms": 4, ...},
        ])
        info = predictor.get_model_info()
    """

    def __init__(self) -> None:
        """Load model artifacts from disk. Called once at app startup."""
        self._scaler: StandardScaler = joblib.load(_SCALER_PATH)
        self._model: LinearRegression = joblib.load(_MODEL_PATH)

        with open(_METRICS_PATH, "r", encoding="utf-8") as f:
            self._metrics: dict = json.load(f)

        logger.info(
            "Model loaded successfully. R²=%.4f, Features=%d",
            self._metrics["r2"],
            len(FEATURE_COLUMNS),
        )

    def predict(self, features: list[dict[str, float]]) -> list[float]:
        """
        Predict house prices for one or more property records.

        Args:
            features: List of dicts, each with the 7 feature keys.
                      Example: [{"square_footage": 1500, "bedrooms": 3, ...}]

        Returns:
            List of predicted prices in the same currency unit as training data.
        """
        if not features:
            return []

        # Convert list of dicts → DataFrame with the correct column order
        df = pd.DataFrame(features)

        # Ensure all required columns are present
        missing = set(FEATURE_COLUMNS) - set(df.columns)
        if missing:
            raise ValueError(
                f"Missing required feature columns: {missing}. "
                f"Required: {FEATURE_COLUMNS}"
            )

        # Reorder columns to match training order (critical for scaler/model)
        df = df[FEATURE_COLUMNS]

        # Standardize + predict
        X_scaled = self._scaler.transform(df)
        y_pred = self._model.predict(X_scaled)

        # Round to 2 decimal places for cleaner output
        return np.round(y_pred, 2).tolist()

    def get_model_info(self) -> dict:
        """
        Return model coefficients and performance metrics.

        Returns:
            {
                "coefficients": {"square_footage": 123.4, ...},
                "intercept": 50000.0,
                "metrics": {"r2": 0.99, "mse": ..., "mae": ..., "rmse": ...}
            }
        """
        # Build coefficient map: feature_name → weight
        coefficients = dict(zip(FEATURE_COLUMNS, self._model.coef_.tolist()))

        return {
            "coefficients": coefficients,
            "intercept": round(float(self._model.intercept_), 2),
            "metrics": self._metrics,
        }


# ---------------------------------------------------------------------------
# Module-level singleton (lazy init; instantiated in main.py startup event)
# ---------------------------------------------------------------------------

predictor: HousePricePredictor | None = None

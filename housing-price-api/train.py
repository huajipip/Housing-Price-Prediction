"""
train.py — Standalone training script for the House Price Prediction model.

Run this script OUTSIDE Docker to generate model artifacts:
    cd housing-price-api
    python train.py

Artifacts produced (saved to models/):
    - scaler.joblib   : Fitted StandardScaler for feature normalization
    - model.joblib    : Trained LinearRegression model
    - metrics.json    : Performance metrics (R², MSE, MAE, RMSE)

All features are standardized before training to ensure:
    1. Coefficients are comparable across different feature scales
    2. Better numerical stability for the linear model
"""

import json
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Path to the dataset (relative to this script's location)
DATASET_PATH = Path(__file__).resolve().parent.parent / "my-asset" / "House Price Dataset.csv"

# Directory for saving model artifacts
MODELS_DIR = Path(__file__).resolve().parent / "models"

# Feature columns (must match the dataset column names exactly)
FEATURE_COLUMNS = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]

# Target column
TARGET_COLUMN = "price"

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------


def load_dataset() -> pd.DataFrame:
    """Load the housing dataset from CSV."""
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at {DATASET_PATH}. "
            "Ensure 'House Price Dataset.csv' is in the project root."
        )

    df = pd.read_csv(DATASET_PATH)
    logger.info("Loaded dataset: %d rows, %d columns", len(df), len(df.columns))
    logger.info("Feature columns: %s", FEATURE_COLUMNS)
    return df


def train_model(
    X: pd.DataFrame, y: pd.Series
) -> tuple[StandardScaler, LinearRegression, dict]:
    """
    Train the prediction pipeline: StandardScaler + LinearRegression.

    Args:
        X: Feature DataFrame (shape: n_samples × 7).
        y: Target Series (price values).

    Returns:
        Tuple of (fitted scaler, fitted model, metrics dict).
    """
    # Step 1: Scale features to zero mean / unit variance
    # This is critical because features span vastly different ranges:
    #   square_footage: ~1000-2400, school_rating: ~6.5-9.2
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    logger.info(
        "StandardScaler fitted. Feature means: %s", scaler.mean_.round(2).tolist()
    )

    # Step 2: Train LinearRegression on scaled features
    # LinearRegression chosen for:
    #   - Full interpretability (coefficients = feature importance)
    #   - Simplicity (good fit for this well-structured synthetic dataset)
    #   - Fast training (closed-form solution, no hyperparameter tuning needed)
    model = LinearRegression()
    model.fit(X_scaled, y)
    logger.info("LinearRegression trained successfully.")

    # Step 3: Predict on training data and compute metrics
    y_pred = model.predict(X_scaled)

    metrics = {
        "r2": round(r2_score(y, y_pred), 4),
        "mse": round(mean_squared_error(y, y_pred), 2),
        "mae": round(mean_absolute_error(y, y_pred), 2),
        "rmse": round(np.sqrt(mean_squared_error(y, y_pred)), 2),
    }

    logger.info("Training metrics: %s", json.dumps(metrics, indent=2))

    return scaler, model, metrics


def save_artifacts(scaler: StandardScaler, model: LinearRegression, metrics: dict) -> None:
    """Save scaler, model, and metrics to the models/ directory."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # Save scaler
    scaler_path = MODELS_DIR / "scaler.joblib"
    joblib.dump(scaler, scaler_path)
    logger.info("Saved scaler → %s", scaler_path)

    # Save model
    model_path = MODELS_DIR / "model.joblib"
    joblib.dump(model, model_path)
    logger.info("Saved model  → %s", model_path)

    # Save metrics as human-readable JSON
    metrics_path = MODELS_DIR / "metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    logger.info("Saved metrics → %s", metrics_path)


def main() -> None:
    """Main entry point: load data → train → save artifacts."""
    logger.info("=" * 60)
    logger.info("Starting model training...")
    logger.info("=" * 60)

    # 1. Load data
    df = load_dataset()

    # 2. Extract features (X) and target (y)
    # Drop 'id' column — it's just a row index, not a feature
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    logger.info("X shape: %s, y shape: %s", X.shape, y.shape)

    # 3. Train (full dataset; for production consider cross-validation)
    scaler, model, metrics = train_model(X, y)

    # 4. Save artifacts for the FastAPI service to load
    save_artifacts(scaler, model, metrics)

    # 5. Print coefficients for inspection
    logger.info("=" * 60)
    logger.info("Feature Coefficients (scaled):")
    for name, coef in zip(FEATURE_COLUMNS, model.coef_):
        logger.info("  %-28s → %+.4f", name, coef)
    logger.info("  %-28s → %+.4f", "Intercept", model.intercept_)
    logger.info("=" * 60)
    logger.info("Training complete! Model artifacts saved to models/")
    logger.info("Next step: docker compose up --build")


if __name__ == "__main__":
    main()

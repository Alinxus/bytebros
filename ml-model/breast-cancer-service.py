"""
Breast Cancer Prediction ML Service
Uses Random Forest model trained on Wisconsin Breast Cancer Dataset
"""
import os
from flask import Flask, request, jsonify
import joblib
import numpy as np
import sys

app = Flask(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "breast_cancer_model.joblib")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "breast_cancer_scaler.joblib")

FEATURE_NAMES = [
    "radius_mean", "texture_mean", "perimeter_mean", "area_mean",
    "smoothness_mean", "compactness_mean", "concavity_mean", "concave_points_mean",
    "symmetry_mean", "fractal_dimension_mean",
    "radius_se", "texture_se", "perimeter_se", "area_se",
    "smoothness_se", "compactness_se", "concavity_se", "concave_points_se",
    "symmetry_se", "fractal_dimension_se",
    "radius_worst", "texture_worst", "perimeter_worst", "area_worst",
    "smoothness_worst", "compactness_worst", "concavity_worst", "concave_points_worst",
    "symmetry_worst", "fractal_dimension_worst"
]

print("Loading breast cancer model...")
MODEL_AVAILABLE = True
model = None
scaler = None
try:
    # Compatibility alias for models saved with numpy 2.x
    sys.modules.setdefault("numpy._core", np.core)
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    print("Model loaded successfully!")
except Exception as e:
    MODEL_AVAILABLE = False
    print(f"[BREAST SERVICE] Model load failed: {e}")

def predict_breast_cancer(features):
    """Predict breast cancer from 30 features"""
    if not MODEL_AVAILABLE or model is None or scaler is None:
        raise RuntimeError("Model unavailable - verify numpy/joblib compatibility and model files.")
    if len(features) != 30:
        raise ValueError(f"Expected 30 features, got {len(features)}")
    
    features_array = np.array(features).reshape(1, -1)
    features_scaled = scaler.transform(features_array)
    prediction = model.predict(features_scaled)[0]
    probability = model.predict_proba(features_scaled)[0]
    
    return {
        "prediction": "malignant" if prediction == 1 else "benign",
        "confidence": float(max(probability)),
        "probabilities": {
            "benign": float(probability[0]),
            "malignant": float(probability[1])
        },
        "riskLevel": "high" if prediction == 1 else "low"
    }

@app.route("/health")
def health():
    return jsonify({"status": "healthy", "model": "breast-cancer-rf", "modelAvailable": MODEL_AVAILABLE})

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    
    if not data or "features" not in data:
        return jsonify({"error": "features array required"}), 400
    
    features = data["features"]
    
    try:
        if not MODEL_AVAILABLE:
            return jsonify({"error": "Model unavailable on this instance"}), 503
        result = predict_breast_cancer(features)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/predict-from-image", methods=["POST"])
def predict_from_image():
    """Extract features from image and predict"""
    data = request.get_json()
    
    if not data or "imageBase64" not in data:
        return jsonify({"error": "imageBase64 required"}), 400
    
    return jsonify({
        "message": "Image feature extraction not implemented - use /predict with extracted features",
        "featuresNeeded": FEATURE_NAMES
    })

if __name__ == "__main__":
    print("Starting Breast Cancer Prediction Service on port 5001...")
    app.run(host="0.0.0.0", port=5001, debug=False)

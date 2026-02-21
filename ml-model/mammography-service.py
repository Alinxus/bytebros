"""
Breast X-ray / Mammography Analysis Service
Analyzes breast X-ray images for cancer detection
"""
import os
from flask import Flask, request, jsonify
import joblib
import numpy as np
from PIL import Image
import io
import base64

app = Flask(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "breast_cancer_model.joblib")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "breast_cancer_scaler.joblib")

print("Loading model...")
model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
print("Model loaded!")

def extract_features_from_image(image):
    """Extract simple statistical features from mammography image"""
    img = image.convert('L')  # Grayscale
    img = img.resize((100, 100))
    arr = np.array(img)
    
    features = []
    
    # Basic statistics
    features.append(np.mean(arr) / 255.0 * 30)  # radius_mean proxy
    features.append(np.std(arr) / 255.0 * 30)   # texture_mean proxy
    features.append(np.percentile(arr, 90) / 255.0 * 100)  # perimeter proxy
    features.append(np.sum(arr > 128) / arr.size * 1000)  # area proxy
    
    # More features from different regions
    h, w = arr.shape
    for region in [
        arr[:h//2, :w//2],  # top-left
        arr[:h//2, w//2:],  # top-right
        arr[h//2:, :w//2],  # bottom-left
        arr[h//2:, w//2:],  # bottom-right
        arr[h//3:2*h//3, w//3:2*w//3],  # center
    ]:
        features.append(np.mean(region) / 255.0 * 30)
        features.append(np.std(region) / 255.0 * 30)
        features.append(np.percentile(region, 75) / 255.0 * 30)
        features.append(np.percentile(region, 25) / 255.0 * 30)
    
    # Edge features
    edges = np.abs(np.diff(arr, axis=0)).mean() + np.abs(np.diff(arr, axis=1)).mean()
    features.append(edges / 255.0 * 10)
    
    # Fill remaining features to get 30
    while len(features) < 30:
        features.append(features[len(features) % 10])
    
    return features[:30]

@app.route("/health")
def health():
    return jsonify({"status": "healthy", "model": "mammography-analyzer"})

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    
    if not data or "image" not in data:
        return jsonify({"error": "image (base64) required"}), 400
    
    try:
        image_data = data["image"]
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes))
        
        features = extract_features_from_image(img)
        features_scaled = scaler.transform([features])
        
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0]
        
        result = {
            "prediction": "malignant" if prediction == 1 else "benign",
            "confidence": float(max(probability)),
            "probabilities": {
                "benign": float(probability[0]),
                "malignant": float(probability[1])
            },
            "riskLevel": "high" if prediction == 1 else "low",
            "analysisMethod": "statistical-features",
            "note": "This is a preliminary screening. Please consult a radiologist for proper diagnosis."
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    print("Starting Mammography Analysis Service on port 5002...")
    app.run(host="0.0.0.0", port=5002, debug=False)

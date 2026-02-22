"""
Cavista ML Service - Chest X-ray Analysis
Uses torchxrayvision with DenseNet121 pretrained on NIH dataset
"""
import io
import base64
import json
import os
import numpy as np
from flask import Flask, request, jsonify
import torch
import torchxrayvision as xrv
import torchvision.transforms as T
from PIL import Image
import warnings
warnings.filterwarnings('ignore')
try:
    import joblib
except Exception:
    joblib = None

app = Flask(__name__)

# Load models at startup
print("Loading models...")
models = {
    'densenet121': xrv.models.DenseNet(weights='densenet121-res224-all'),
}
models['densenet121'].eval()

# Mammography RF model (optional)
MAMMO_MODEL = None
MAMMO_SCALER = None
try:
    if joblib:
        mammo_model_path = os.path.join(os.path.dirname(__file__), "breast_cancer_model.joblib")
        mammo_scaler_path = os.path.join(os.path.dirname(__file__), "breast_cancer_scaler.joblib")
        if os.path.exists(mammo_model_path) and os.path.exists(mammo_scaler_path):
            MAMMO_MODEL = joblib.load(mammo_model_path)
            MAMMO_SCALER = joblib.load(mammo_scaler_path)
            print("[MAMMOGRAPHY] RF model loaded")
except Exception as e:
    print(f"[MAMMOGRAPHY] Failed to load RF model: {e}")

# Define pathologies we can detect
PATHOLOGIES = [
    'Atelectasis',
    'Consolidation',
    'Infiltration',
    'Pneumothorax',
    'Edema',
    'Emphysema',
    'Fibrosis',
    'Effusion',
    'Pneumonia',
    'Pleural_Thickening',
    'Cardiomegaly',
    'Lung Lesion',
    'Fracture',
    'Lung Opacity',
    'Support Devices'
]

print(f"Models loaded successfully!")
print(f"Available pathologies: {PATHOLOGIES}")

def process_image(image_data, target_size=224):
    """Process base64 or URL image to tensor"""
    try:
        if isinstance(image_data, str):
            # Check if base64
            if ',' in image_data:
                # Remove data URL prefix
                image_data = image_data.split(',')[1]
            
            # Decode base64
            img_bytes = base64.b64decode(image_data)
            img = Image.open(io.BytesIO(img_bytes)).convert('L')  # Grayscale
        else:
            img = Image.open(io.BytesIO(image_data)).convert('L')
        
        # Resize
        img = img.resize((target_size, target_size), Image.Resampling.LANCZOS)
        
        # Convert to numpy array (0-255)
        import numpy as np
        img_np = np.array(img).astype(np.float32)
        
        # Scale to [0, 1] range
        img_np = img_np / 255.0
        
        # Keep as 1 channel (xrv models expect 1 channel)
        img_np = img_np.reshape(1, target_size, target_size)
        
        # Apply xrv normalization - use proper bound
        # xrv expects values in [-1024, 1024] for real X-rays, but we'll use [0,1]
        # with the proper xrv normalization
        img_np = xrv.utils.normalize(img_np, maxval=1.0)
        
        # Convert to tensor
        img_tensor = torch.from_numpy(img_np).float()
        img_tensor = img_tensor.unsqueeze(0)  # Add batch dimension
        
        return img_tensor
    except Exception as e:
        raise ValueError(f"Failed to process image: {str(e)}")

def analyze_with_model(img_tensor, model_name='densenet121'):
    """Run inference on the image"""
    model = models[model_name]
    
    with torch.no_grad():
        output = model(img_tensor)
    
    # Get the actual number of classes from model output
    num_classes = output.shape[1]
    print(f"[DEBUG] Model output classes: {num_classes}")
    
    # Get probabilities
    probs = torch.sigmoid(output).squeeze().numpy()
    
    # xrv pathologies - these are the standard 18 pathologies
    xrv_pathologies = [
        'Atelectasis', 'Consolidation', 'Infiltration', 'Pneumothorax', 'Edema',
        'Emphysema', 'Fibrosis', 'Effusion', 'Pneumonia', 'Pleural_Thickening',
        'Cardiomegaly', 'Lung Lesion', 'Fracture', 'Lung Opacity', 'Support Devices',
        'Nodule', 'Mass', 'Hernia'
    ]
    
    # Build results - only for available outputs
    results = []
    for i in range(min(len(probs), len(xrv_pathologies))):
        prob = float(probs[i])
        pathology = xrv_pathologies[i]
        results.append({
            'pathology': pathology,
            'probability': round(prob * 100, 2),
            'risk_level': 'high' if prob > 0.7 else 'medium' if prob > 0.4 else 'low'
        })
    
    # Sort by probability
    results.sort(key=lambda x: x['probability'], reverse=True)
    
    # Get top findings - show results above 10% probability
    findings = [r for r in results if r['probability'] > 10]

    # Weighted risk scoring (more clinically plausible than raw counts)
    pathology_weights = {
        "Nodule": 1.4,
        "Mass": 1.6,
        "Lung Lesion": 1.5,
        "Consolidation": 1.2,
        "Lung Opacity": 1.1,
        "Pneumonia": 1.1,
        "Effusion": 1.0,
        "Cardiomegaly": 0.9,
        "Atelectasis": 0.8,
        "Fibrosis": 0.8,
        "Emphysema": 0.7,
        "Pleural_Thickening": 0.6,
        "Infiltration": 0.6,
        "Fracture": 0.4,
        "Support Devices": 0.2,
        "Pneumothorax": 1.3,
        "Edema": 0.9,
        "Hernia": 0.5,
    }

    weighted = 0.0
    for r in results:
        w = pathology_weights.get(r["pathology"], 0.6)
        weighted += (r["probability"] / 100.0) * w

    risk_score = max(0.0, min(1.0, weighted / 2.5))

    # Calibrated confidence (heuristic sigmoid scaling)
    raw_confidence = max([r['probability'] for r in results]) / 100
    calibrated_confidence = 1 / (1 + np.exp(-6 * (raw_confidence - 0.5)))
    calibrated_confidence = float(max(0.05, min(0.95, calibrated_confidence)))

    if risk_score >= 0.6:
        overall_risk = 'high'
        recommendation = 'Immediate medical consultation recommended'
    elif risk_score >= 0.35:
        overall_risk = 'medium'
        recommendation = 'Follow-up with specialist recommended'
    else:
        overall_risk = 'low'
        recommendation = 'No significant abnormalities detected'

    return {
        'model': model_name,
        'overall_risk': overall_risk,
        'risk_score': round(risk_score * 100, 1),
        'recommendation': recommendation,
        'findings': findings,
        'all_pathologies': results,
        'has_abnormality': len(findings) > 0,
        'confidence': raw_confidence,
        'calibrated_confidence': calibrated_confidence
    }

def assess_image_quality(img_tensor):
    """Basic image quality checks to guard against low-quality inputs."""
    try:
        img = img_tensor.squeeze().numpy()
        img = (img - img.min()) / (img.max() - img.min() + 1e-8)
        mean_intensity = float(np.mean(img))
        std_intensity = float(np.std(img))
        # Blur estimate via Laplacian variance
        lap = np.var(np.diff(img, axis=0)) + np.var(np.diff(img, axis=1))
        blur_score = float(lap)

        issues = []
        if mean_intensity < 0.15 or mean_intensity > 0.85:
            issues.append("exposure")
        if std_intensity < 0.08:
            issues.append("low_contrast")
        if blur_score < 0.0005:
            issues.append("blurry")

        quality = "good" if len(issues) == 0 else "poor"
        return {
            "quality": quality,
            "issues": issues,
            "mean_intensity": round(mean_intensity, 3),
            "std_intensity": round(std_intensity, 3),
            "blur_score": round(blur_score, 6),
        }
    except Exception as e:
        return {
            "quality": "unknown",
            "issues": ["quality_check_failed"],
            "error": str(e),
        }

def extract_mammo_features(image):
    """Extract simple statistical features from mammography image"""
    img = image.convert('L')
    img = img.resize((100, 100))
    arr = np.array(img)

    features = []
    features.append(np.mean(arr) / 255.0 * 30)
    features.append(np.std(arr) / 255.0 * 30)
    features.append(np.percentile(arr, 90) / 255.0 * 100)
    features.append(np.sum(arr > 128) / arr.size * 1000)

    h, w = arr.shape
    for region in [
        arr[:h//2, :w//2],
        arr[:h//2, w//2:],
        arr[h//2:, :w//2],
        arr[h//2:, w//2:],
        arr[h//3:2*h//3, w//3:2*w//3],
    ]:
        features.append(np.mean(region) / 255.0 * 30)
        features.append(np.std(region) / 255.0 * 30)
        features.append(np.percentile(region, 75) / 255.0 * 30)
        features.append(np.percentile(region, 25) / 255.0 * 30)

    edges = np.abs(np.diff(arr, axis=0)).mean() + np.abs(np.diff(arr, axis=1)).mean()
    features.append(edges / 255.0 * 10)

    while len(features) < 30:
        features.append(features[len(features) % 10])

    return features[:30]

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'model': 'densenet121'})

@app.route('/mammography/analyze', methods=['POST'])
def mammography_analyze():
    """Analyze mammography/breast X-ray using RF model; fallback to DenseNet121"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'error': 'image (base64) required'}), 400
        
        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes))

        quality_tensor = process_image(image_data, target_size=224)
        quality = assess_image_quality(quality_tensor)

        if MAMMO_MODEL and MAMMO_SCALER:
            print("[MAMMOGRAPHY] Processing image with RF model")
            features = extract_mammo_features(img)
            features_scaled = MAMMO_SCALER.transform([features])
            prediction = MAMMO_MODEL.predict(features_scaled)[0]
            probability = MAMMO_MODEL.predict_proba(features_scaled)[0]

            raw_confidence = float(max(probability))
            calibrated_confidence = 1 / (1 + np.exp(-6 * (raw_confidence - 0.5)))
            calibrated_confidence = float(max(0.05, min(0.95, calibrated_confidence)))

            return jsonify({
                'success': True,
                'prediction': 'malignant' if prediction == 1 else 'benign',
                'confidence': raw_confidence,
                'calibratedConfidence': calibrated_confidence,
                'riskScore': round(raw_confidence * 100, 1),
                'quality': quality,
                'probabilities': {
                    'benign': float(probability[0]),
                    'malignant': float(probability[1])
                },
                'riskLevel': 'high' if prediction == 1 else 'low',
                'analysisMethod': 'breast-cancer-random-forest',
                'note': 'Preliminary screening result. Please consult a radiologist.'
            })

        print("[MAMMOGRAPHY] RF model unavailable, falling back to DenseNet121")
        img_tensor = process_image(image_data, target_size=224)
        results = analyze_with_model(img_tensor, 'densenet121')
        
        print(f"[MAMMOGRAPHY] Result: {results}")
        
        return jsonify({
            'success': True,
            'analysis': results,
            'prediction': 'malignant' if results.get('has_abnormality') else 'benign',
            'confidence': results.get('confidence', 0.85),
            'calibratedConfidence': results.get('calibrated_confidence', results.get('confidence', 0.85)),
            'riskScore': results.get('risk_score', round(results.get('confidence', 0.85) * 100, 1)),
            'quality': quality,
            'probabilities': {
                'benign': 1 - results.get('confidence', 0.85),
                'malignant': results.get('confidence', 0.85)
            },
            'riskLevel': results.get('overall_risk', 'low'),
            'analysisMethod': 'densenet121',
            'note': 'AI analysis complete. Please consult a radiologist.'
        })
    except Exception as e:
        import traceback
        print(f"[MAMMOGRAPHY ERROR] {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze chest X-ray image"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        image_data = data.get('image')
        if not image_data:
            return jsonify({'error': 'No image provided'}), 400
        
        print(f"[CHEST X-RAY] Processing image...")
        
        # Process image
        img_tensor = process_image(image_data)
        print(f"[CHEST X-RAY] Image processed, running model...")

        quality = assess_image_quality(img_tensor)
        if quality["quality"] == "poor":
            print(f"[CHEST X-RAY] Low quality image detected: {quality}")
        
        # Run analysis
        results = analyze_with_model(img_tensor)
        
        print(f"[CHEST X-RAY] Result: {results}")
        
        return jsonify({
            'success': True,
            'analysis': results,
            'quality': quality,
            'disclaimer': 'This is an AI-assisted screening tool, not a medical diagnosis. Consult a healthcare professional for medical advice.'
        })
        
    except Exception as e:
        import traceback
        print(f"[CHEST X-RAY ERROR] Analyze failed: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/batch', methods=['POST'])
def batch_analyze():
    """Analyze multiple images"""
    try:
        data = request.get_json()
        images = data.get('images', [])
        
        results = []
        for img in images:
            try:
                img_tensor = process_image(img)
                analysis = analyze_with_model(img_tensor)
                results.append(analysis)
            except Exception as e:
                results.append({'error': str(e)})
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("Starting Cavista ML Service on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=False)

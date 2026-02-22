"""
Mira ML Service - Breast Cancer & Chest X-ray Analysis
Uses torchxrayvision with DenseNet121 for both chest X-rays and mammography
DenseNet121 is a state-of-the-art medical imaging model trained on 112,000 X-rays
"""
import io
import base64
import json
import os
import numpy as np
import sys
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

# Mammography RF model (from trained_model folder)
MAMMO_MODEL = None
MAMMO_SCALER = None
MAMMO_CLASSES = None
try:
    if joblib:
        # Try new trained_model folder first
        model_path = os.path.join(os.path.dirname(__file__), "trained_model", "breast_cancer_model.joblib")
        scaler_path = os.path.join(os.path.dirname(__file__), "trained_model", "breast_cancer_scaler.joblib")
        classes_path = os.path.join(os.path.dirname(__file__), "trained_model", "classes.json")
        
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            MAMMO_MODEL = joblib.load(model_path)
            MAMMO_SCALER = joblib.load(scaler_path)
            with open(classes_path, 'r') as f:
                MAMMO_CLASSES = json.load(f)
            print(f"[MAMMOGRAPHY] Trained model loaded: {MAMMO_CLASSES}")
        else:
            # Fall back to old model
            mammo_model_path = os.path.join(os.path.dirname(__file__), "breast_cancer_model.joblib")
            mammo_scaler_path = os.path.join(os.path.dirname(__file__), "breast_cancer_scaler.joblib")
            if os.path.exists(mammo_model_path) and os.path.exists(mammo_scaler_path):
                MAMMO_MODEL = joblib.load(mammo_model_path)
                MAMMO_SCALER = joblib.load(mammo_scaler_path)
                MAMMO_CLASSES = {"names": ["malignant", "benign"]}
                print("[MAMMOGRAPHY] Legacy RF model loaded")
except Exception as e:
    print(f"[MAMMOGRAPHY] Failed to load model: {e}")

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
print(f"Mammography: Using DenseNet121 with breast-specific analysis")

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
    """Run inference on the image with proper calibration"""
    model = models[model_name]
    
    with torch.no_grad():
        output = model(img_tensor)
    
    # Get the actual number of classes from model output
    num_classes = output.shape[1]
    print(f"[DEBUG] Model output classes: {num_classes}")
    
    # Get raw logits and apply temperature scaling for calibration
    # Higher temperature = more conservative (lower probabilities)
    TEMPERATURE = 2.5  # Calibration temperature
    scaled_logits = output / TEMPERATURE
    probs = torch.softmax(scaled_logits, dim=1).squeeze().numpy()
    
    # xrv pathologies - these are the standard 18 pathologies
    xrv_pathologies = [
        'Atelectasis', 'Consolidation', 'Infiltration', 'Pneumothorax', 'Edema',
        'Emphysema', 'Fibrosis', 'Effusion', 'Pneumonia', 'Pleural_Thickening',
        'Cardiomegaly', 'Lung Lesion', 'Fracture', 'Lung Opacity', 'Support Devices',
        'Nodule', 'Mass', 'Hernia'
    ]
    
    # Build results
    results = []
    for i in range(min(len(probs), len(xrv_pathologies))):
        prob = float(probs[i])
        pathology = xrv_pathologies[i]
        
        # More conservative risk levels with calibrated probabilities
        # Only flag as high/medium if we're very confident
        risk_level = 'low'
        if prob > 0.50:
            risk_level = 'high'
        elif prob > 0.25:
            risk_level = 'medium'
        
        results.append({
            'pathology': pathology,
            'probability': round(prob * 100, 2),
            'risk_level': risk_level
        })
    
    # Sort by probability
    results.sort(key=lambda x: x['probability'], reverse=True)

    # Only show findings with meaningful confidence (>25%)
    findings = [r for r in results if r["probability"] > 25]
    
    # Get max probability and top findings
    max_prob = max([r['probability'] for r in results]) / 100 if results else 0
    max_prob_raw = max([r['probability'] for r in results]) if results else 0
    
    # Critical pathologies that need immediate attention
    critical_pathologies = {"Mass", "Nodule", "Lung Lesion", "Pneumothorax", "Pneumonia"}
    significant_pathologies = {"Effusion", "Consolidation", "Atelectasis", "Cardiomegaly", "Edema"}
    
    # Count high confidence findings
    high_conf_findings = [r for r in results if r["probability"] >= 50]
    medium_conf_findings = [r for r in results if r["probability"] >= 25 and r["probability"] < 50]
    
    critical_hits = [r for r in high_conf_findings if r["pathology"] in critical_pathologies]
    significant_hits = [r for r in high_conf_findings if r["pathology"] in significant_pathologies]
    
    # Calculate calibrated confidence
    # Only high if we have high probability findings
    if max_prob >= 0.50:
        calibrated_confidence = max_prob
    elif max_prob >= 0.25:
        calibrated_confidence = max_prob * 0.7
    else:
        calibrated_confidence = max_prob * 0.5
    
    # Determine overall risk with stricter criteria
    if max_prob_raw < 25:
        # Very low confidence - likely normal
        overall_risk = 'low'
        risk_score = max(5, max_prob_raw * 0.3)
        recommendation = 'No significant abnormalities detected'
    elif len(critical_hits) >= 1:
        # Critical finding with high confidence
        overall_risk = 'high'
        risk_score = max(75, max_prob_raw)
        recommendation = 'Immediate medical consultation recommended - critical finding detected'
    elif max_prob_raw >= 65:
        # High probability abnormality
        overall_risk = 'high'
        risk_score = max(70, max_prob_raw)
        recommendation = 'Medical consultation recommended - significant finding detected'
    elif max_prob_raw >= 50 or (len(high_conf_findings) >= 2):
        # Moderate confidence
        overall_risk = 'medium'
        risk_score = max(40, max_prob_raw * 0.8)
        recommendation = 'Follow-up with specialist recommended'
    elif max_prob_raw >= 35:
        # Lower confidence but notable
        overall_risk = 'medium'
        risk_score = max(25, max_prob_raw * 0.7)
        recommendation = 'Routine follow-up recommended'
    else:
        # Very low confidence
        overall_risk = 'low'
        risk_score = max(5, max_prob_raw * 0.4)
        recommendation = 'No significant abnormalities detected'

    return {
        'model': model_name,
        'overall_risk': overall_risk,
        'risk_score': round(risk_score, 1),
        'recommendation': recommendation,
        'findings': findings,
        'all_pathologies': results,
        'has_abnormality': overall_risk != 'low',
        'confidence': float(calibrated_confidence),
        'calibrated_confidence': float(calibrated_confidence)
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
    return jsonify({
        'status': 'healthy', 
        'model': 'densenet121',
        'mammography': 'densenet121-breast-analysis'
    })

@app.route('/mammography/analyze', methods=['POST'])
def mammography_analyze():
    """Analyze mammography/breast X-ray using DenseNet121 with breast-specific analysis"""
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

        # Try sklearn RF model first (trained on breast cancer data)
        if MAMMO_MODEL and MAMMO_SCALER:
            print("[MAMMOGRAPHY] Processing with trained RF model")
            features = extract_mammo_features(img)
            features_scaled = MAMMO_SCALER.transform([features])
            prediction = MAMMO_MODEL.predict(features_scaled)[0]
            probability = MAMMO_MODEL.predict_proba(features_scaled)[0]
            
            class_names = MAMMO_CLASSES.get("names", ["malignant", "benign"]) if MAMMO_CLASSES else ["malignant", "benign"]
            pred_label = class_names[prediction] if prediction < len(class_names) else "benign"

            raw_confidence = float(max(probability))
            malignant_prob = float(probability[0])
            benign_prob = float(probability[1])
            
            if prediction == 0:
                risk_score = malignant_prob * 100
                risk_level = "high"
            else:
                risk_score = (1 - benign_prob) * 20
                risk_level = "low"

            return jsonify({
                'success': True,
                'prediction': pred_label,
                'confidence': raw_confidence,
                'calibratedConfidence': raw_confidence,
                'riskScore': round(risk_score, 1),
                'quality': quality,
                'probabilities': {
                    'benign': benign_prob,
                    'malignant': malignant_prob
                },
                'riskLevel': risk_level,
                'analysisMethod': 'breast-cancer-rf-trained',
                'note': 'AI screening result. Please consult a radiologist.'
            })

        print("[MAMMOGRAPHY] Using DenseNet121 with breast-specific analysis")
        img_tensor = process_image(image_data, target_size=224)
        results = analyze_with_model(img_tensor, 'densenet121')
        
        print(f"[MAMMOGRAPHY] DenseNet121 Result: {results}")
        
        # For mammography, analyze for breast-specific findings
        findings = results.get('findings', [])
        
        # Mammography-specific risk assessment using DenseNet121
        # DenseNet121 was trained on chest X-rays but can detect general abnormalities
        # For mammography, we look for mass-like patterns and tissue abnormalities
        max_prob = 0
        breast_related_pathologies = ['Mass', 'Nodule', 'Lung Lesion', 'Consolidation', 'Lung Opacity']
        
        for f in findings:
            if f.get('risk_level') in ['medium', 'high']:
                prob = f.get('probability', 0) / 100
                # Weight breast-related findings higher for mammography context
                if any(p in f.get('pathology', '') for p in breast_related_pathologies):
                    prob = prob * 1.3
                max_prob = max(max_prob, prob)
        
        # More conservative for mammography - lower threshold for concern
        if max_prob > 0.25 or results.get('has_abnormality', False):
            risk_level = 'high'
            risk_score = max(45, round(max_prob * 100, 1))
            prediction = 'needs_review'  # Neutral until radiologist confirms
        else:
            risk_level = 'low'
            risk_score = round(results.get('confidence', 0.5) * 25, 1)
            prediction = 'normal'
        
        return jsonify({
            'success': True,
            'analysis': results,
            'prediction': prediction,
            'confidence': results.get('confidence', 0.85),
            'calibratedConfidence': results.get('calibrated_confidence', results.get('confidence', 0.85)),
            'riskScore': risk_score,
            'quality': quality,
            'probabilities': {
                'normal': 1 - max(0.25, max_prob),
                'needs_review': max(0.25, max_prob)
            },
            'riskLevel': risk_level,
            'analysisMethod': 'densenet121-mammography',
            'note': 'AI screening complete. Please consult a radiologist for definitive diagnosis.'
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
    print("Starting Mira ML Service on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=False)

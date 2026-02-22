"""
Cavista ML Service - Chest X-ray Analysis
Uses torchxrayvision with DenseNet121 pretrained on NIH dataset
"""
import io
import base64
import json
from flask import Flask, request, jsonify
import torch
import torchxrayvision as xrv
import torchvision.transforms as T
from PIL import Image
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)

# Load models at startup
print("Loading models...")
models = {
    'densenet121': xrv.models.DenseNet(weights='densenet121-res224-all'),
}
models['densenet121'].eval()

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
        
        # Convert to numpy array and normalize properly for xrv
        import numpy as np
        img_np = np.array(img).astype(np.float32) / 255.0
        
        # Apply xrv normalization
        img_np = xrv.utils.normalize(img_np, 255)
        
        # Convert to 3-channel by repeating (xrv models expect 3-channel)
        if len(img_np.shape) == 2:
            img_np = np.stack([img_np] * 3, axis=0)
        else:
            img_np = img_np.transpose(2, 0, 1)
        
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
        
    # Get probabilities
    probs = torch.sigmoid(output).squeeze().numpy()
    
    # Build results
    results = []
    for i, pathology in enumerate(PATHOLOGIES):
        prob = float(probs[i])
        results.append({
            'pathology': pathology,
            'probability': round(prob * 100, 2),
            'risk_level': 'high' if prob > 0.7 else 'medium' if prob > 0.4 else 'low'
        })
    
    # Sort by probability
    results.sort(key=lambda x: x['probability'], reverse=True)
    
    # Get top findings - only show high confidence results
    findings = [r for r in results if r['probability'] > 50]
    
    # Overall assessment
    high_risk = [r for r in results if r['risk_level'] == 'high']
    medium_risk = [r for r in results if r['risk_level'] == 'medium']
    
    if len(high_risk) >= 2:
        overall_risk = 'high'
        recommendation = 'Immediate medical consultation recommended'
    elif len(high_risk) >= 1:
        overall_risk = 'high'
        recommendation = 'Follow-up with specialist recommended'
    elif len(medium_risk) >= 2:
        overall_risk = 'medium'
        recommendation = 'Routine follow-up recommended'
    else:
        overall_risk = 'low'
        recommendation = 'No significant abnormalities detected'
    
    return {
        'model': model_name,
        'overall_risk': overall_risk,
        'recommendation': recommendation,
        'findings': findings,
        'all_pathologies': results,
        'has_abnormality': len(findings) > 0,
        'confidence': max([r['probability'] for r in results]) / 100
    }

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'model': 'densenet121'})

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
        
        # Process image
        img_tensor = process_image(image_data)
        
        # Run analysis
        results = analyze_with_model(img_tensor)
        
        return jsonify({
            'success': True,
            'analysis': results,
            'disclaimer': 'This is an AI-assisted screening tool, not a medical diagnosis. Consult a healthcare professional for medical advice.'
        })
        
    except Exception as e:
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

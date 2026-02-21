# TCIA Sample Downloads

Since TCIA downloads can be slow, here are quick ways to get sample medical images:

## Option 1: Direct Download from GitHub

```bash
# COVID-19 Chest X-rays
curl -L -o covid-xray1.jpg "https://raw.githubusercontent.com/ieee8023/covid-chestxray-dataset/master/images/01E392EE-69F9-4E33-BFCE-E5C968654078.jpeg"

# More COVID images
curl -L -o covid-xray2.jpg "https://raw.githubusercontent.com/ieee8023/covid-chestxray-dataset/master/images/0137B053-9B2B-42E3-96ED-62E87CF20B96.jpeg"
```

## Option 2: Kaggle Datasets (requires account)

1. **RSNA Pneumonia Detection**: https://www.kaggle.com/datasets/coder14/rsna-pneumonia-detection-challenge
2. **Breast Cancer Wisconsin**: https://www.kaggle.com/datasets/merishnasuwal/breast-cancer-wisconsin-diagnostic-dataset
3. **Chest X-Ray (NIH)**: https://www.kaggle.com/datasets/nih-chest-xrays/data

## Option 3: Direct Sample URLs

### Chest X-rays (Normal):
```bash
curl -L -o normal-chest.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Chest_X-ray_showing_bilateral_pneumothorax_-_20140106_224448_uploaded_by_Mikael_Haggstrom.jpg/640px-Chest_X-ray_showing_bilateral_pneumothorax_-_20140106_224448_uploaded_by_Mikael_Haggstrom.jpg"
```

### Mammography Samples:
```bash
# CBIS-DDSM samples (from Google Drive - requires manual download)
# https://drive.google.com/drive/folders/1h4hVfLQd3EtD4s7X3a9cVvPqY3xXq3W
```

## Python Script Usage

```bash
# List available collections
python download_tcia_samples.py --list

# Download COVID-19 X-rays (3 samples)
python download_tcia_samples.py --collection covid-19 --num 3

# Download breast mammography (5 samples)  
python download_tcia_samples.py --collection cbis-ddsm --num 5

# Download lung CT (3 samples)
python download_tcia_samples.py --collection lidc-idri --num 3 --modality CT
```

## Alternative: Generate Synthetic Test Data

For testing without real medical images:

```python
from PIL import Image
import numpy as np
import base64

def create_test_mammography():
    """Create synthetic mammography-like image"""
    img = np.random.randint(0, 256, (500, 300), dtype=np.uint8)
    img = Image.fromarray(img, 'L')
    return img

def create_test_chest_xray():
    """Create synthetic chest X-ray-like image"""
    img = np.random.randint(0, 200, (400, 400), dtype=np.uint8)
    # Add some structure
    for i in range(100, 300):
        for j in range(100, 300):
            if ((i-200)**2 + (j-200)**2) ** 0.5 < 80:
                img[i, j] = 150
    img = Image.fromarray(img, 'L')
    return img

# Save as base64
def image_to_base64(img):
    import io
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    return base64.b64encode(buffer.getvalue()).decode()
```

## Quick Test Images Already in Project

You already have:
- `breast-xray-1.jpg` - Breast X-ray
- `covid-xray.jpg` - COVID-19 chest X-ray

## Next Steps

1. Sign up at https://www.kaggle.com for larger datasets
2. Apply for TCIA access at https://cancerimagingarchive.net
3. Use the script above to programmatically download

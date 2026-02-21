"""
TCIA Data Downloader for Cavista
Downloads sample medical images from TCIA (The Cancer Imaging Archive)
for testing the early detection API.

Usage:
    python download_tcia_samples.py --collection BREAST-DIAGNOSIS --num 5
"""

import os
import argparse
from tciaclient.core import TCIAClient

OUTPUT_DIR = "tcia_samples"

COLLECTIONS = {
    "breast-diagnosis": {
        "name": "BREAST-DIAGNOSIS",
        "description": "Breast cancer diagnosis images",
        "modality": "MG"  # Mammography
    },
    "cbis-ddsm": {
        "name": "CBIS-DDSM",
        "description": "Curated Breast Imaging Subset of Digital Database for Screening Mammography",
        "modality": "MG"
    },
    "lidc-idri": {
        "name": "LIDC-IDRI",
        "description": "Lung Image Database Consortium",
        "modality": "CT"
    },
    "tcga-brca": {
        "name": "TCGA-BRCA",
        "description": "TCGA Breast Invasive Carcinoma",
        "modality": "MR"  # MRI
    },
    "cmmd": {
        "name": "CMMD",
        "description": "Chinese Mammography Database",
        "modality": "MG"
    },
    "nsclc-radiomics": {
        "name": "NSCLC-Radiomics",
        "description": "Non-Small Cell Lung Cancer Radiomics",
        "modality": "CT"
    },
    "covid-19": {
        "name": "COVID-19-AR",
        "description": "COVID-19 Chest X-ray",
        "modality": "XR"  # X-ray
    },
    "ispy2": {
        "name": "ISPY2",
        "description": "Breast MRI from I-SPY 2 Trial",
        "modality": "MR"
    }
}

def download_samples(collection_key, num_samples=5, modality=None):
    """Download sample images from TCIA"""
    
    if collection_key not in COLLECTIONS:
        print(f"Unknown collection: {collection_key}")
        print(f"Available: {', '.join(COLLECTIONS.keys())}")
        return
    
    collection = COLLECTIONS[collection_key]
    collection_name = collection["name"]
    modality = modality or collection["modality"]
    
    print(f"\n{'='*60}")
    print(f"Downloading from: {collection_name}")
    print(f"Modality: {modality}")
    print(f"Target: {num_samples} samples")
    print(f"{'='*60}\n")
    
    tc = TCIAClient()
    
    output_path = os.path.join(OUTPUT_DIR, collection_key)
    os.makedirs(output_path, exist_ok=True)
    
    try:
        print(f"Getting series for {collection_name}...")
        series = tc.get_series(collection=collection_name, modality=modality)
        
        if not series:
            print(f"No series found for {collection_name} with modality {modality}")
            return
        
        print(f"Found {len(series)} series")
        
        downloaded = 0
        for i, s in enumerate(series[:num_samples]):
            series_uid = s.get("SeriesInstanceUID", "")
            if not series_uid:
                continue
                
            print(f"\nDownloading {i+1}/{num_samples}: {series_uid[:20]}...")
            
            try:
                filename = f"{collection_key}_{i+1:03d}.zip"
                tc.get_image(
                    seriesInstanceUid=series_uid,
                    downloadPath=output_path,
                    zipFileName=filename
                )
                downloaded += 1
                print(f"  Saved: {filename}")
            except Exception as e:
                print(f"  Error: {e}")
        
        print(f"\n{'='*60}")
        print(f"Downloaded {downloaded} samples to: {output_path}")
        print(f"{'='*60}")
        
    except Exception as e:
        print(f"Error: {e}")

def list_collections():
    """List available TCIA collections"""
    print("\nAvailable TCIA Collections for Cavista Testing:")
    print("=" * 60)
    for key, info in COLLECTIONS.items():
        print(f"\n{key}:")
        print(f"  Name: {info['name']}")
        print(f"  Modality: {info['modality']}")
        print(f"  Description: {info['description']}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download TCIA samples for testing")
    parser.add_argument("--collection", "-c", help="Collection key (e.g., breast-diagnosis)")
    parser.add_argument("--num", "-n", type=int, default=5, help="Number of samples to download")
    parser.add_argument("--modality", "-m", help="Modality (MG, CT, MR, XR)")
    parser.add_argument("--list", "-l", action="store_true", help="List available collections")
    
    args = parser.parse_args()
    
    if args.list:
        list_collections()
    elif args.collection:
        download_samples(args.collection, args.num, args.modality)
    else:
        parser.print_help()
        print("\nExample usage:")
        print("  python download_tcia_samples.py --list")
        print("  python download_tcia_samples.py --collection breast-diagnosis --num 3")
        print("  python download_tcia_samples.py --collection lidc-idri --num 5 --modality CT")

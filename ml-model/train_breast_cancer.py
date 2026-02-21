"""
Train Breast Cancer Model
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load data
df = pd.read_csv("data_cancer.csv")
print("Dataset shape:", df.shape)

# Drop unnecessary columns (id and empty column)
df = df.drop(['id', 'Unnamed: 32'], axis=1)

# Encode diagnosis (M=1, B=0)
df['diagnosis'] = df['diagnosis'].map({'M': 1, 'B': 0})

# Features and target
X = df.iloc[:, 1:].values  # 30 features (skip diagnosis)
Y = df.iloc[:, 0].values

print(f"Features shape: {X.shape}")
print(f"Target distribution: Benign={sum(Y==0)}, Malignant={sum(Y==1)}")

# Split
X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)

# Scale
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Train
model = RandomForestClassifier(n_estimators=100, random_state=42, criterion="entropy")
model.fit(X_train, Y_train)

# Evaluate
accuracy = model.score(X_test, Y_test)
print(f"Test accuracy: {accuracy:.4f}")

# Save
joblib.dump(model, "breast_cancer_model.joblib")
joblib.dump(scaler, "breast_cancer_scaler.joblib")
print("Model saved!")

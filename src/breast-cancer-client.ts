const BREAST_CANCER_SERVICE_URL = process.env.BREAST_CANCER_SERVICE_URL || "http://localhost:5001";

interface BreastCancerResult {
  prediction: "benign" | "malignant";
  confidence: number;
  probabilities: {
    benign: number;
    malignant: number;
  };
  riskLevel: "low" | "high";
}

export async function predictBreastCancer(features: number[]): Promise<BreastCancerResult> {
  try {
    const response = await fetch(`${BREAST_CANCER_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features }),
    });

    if (!response.ok) {
      throw new Error(`Breast cancer service returned ${response.status}`);
    }

    return await response.json() as BreastCancerResult;
  } catch (error) {
    console.error("[Breast Cancer Service] Error:", error);
    throw error;
  }
}

export async function checkBreastCancerServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BREAST_CANCER_SERVICE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export const BREAST_CANCER_FEATURES = [
  "radius_mean", "texture_mean", "perimeter_mean", "area_mean",
  "smoothness_mean", "compactness_mean", "concavity_mean", "concave_points_mean",
  "symmetry_mean", "fractal_dimension_mean",
  "radius_se", "texture_se", "perimeter_se", "area_se",
  "smoothness_se", "compactness_se", "concavity_se", "concave_points_se",
  "symmetry_se", "fractal_dimension_se",
  "radius_worst", "texture_worst", "perimeter_worst", "area_worst",
  "smoothness_worst", "compactness_worst", "concavity_worst", "concave_points_worst",
  "symmetry_worst", "fractal_dimension_worst"
];

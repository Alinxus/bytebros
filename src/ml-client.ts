const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5000";

interface MLAnalysisResult {
  success: boolean;
  analysis?: {
    model: string;
    overall_risk: "low" | "medium" | "high";
    recommendation: string;
    risk_score?: number;
    findings: Array<{
      pathology: string;
      probability: number;
      risk_level: string;
    }>;
    all_pathologies: Array<{
      pathology: string;
      probability: number;
      risk_level: string;
    }>;
    has_abnormality: boolean;
    confidence: number;
    calibrated_confidence?: number;
  };
  quality?: {
    quality: "good" | "poor" | "unknown";
    issues: string[];
    mean_intensity?: number;
    std_intensity?: number;
    blur_score?: number;
  };
  error?: string;
}

export async function analyzeWithML(imageData: Buffer | string): Promise<MLAnalysisResult> {
  try {
    const base64Image = typeof imageData === "string" 
      ? imageData 
      : imageData.toString("base64");

    const response = await fetch(`${ML_SERVICE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
      }),
    });

    if (!response.ok) {
      throw new Error(`ML service returned ${response.status}`);
    }

    const result = await response.json() as MLAnalysisResult;
    return result;
  } catch (error) {
    console.error("[ML Service] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function checkMLServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

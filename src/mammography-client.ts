const MAMMOGRAPHY_SERVICE_URL = process.env.MAMMOGRAPHY_SERVICE_URL || "http://localhost:5000";

interface MammographyResult {
  prediction: "benign" | "malignant";
  confidence: number;
  calibratedConfidence?: number;
  riskScore?: number;
  quality?: {
    quality: "good" | "poor" | "unknown";
    issues: string[];
  };
  probabilities: {
    benign: number;
    malignant: number;
  };
  riskLevel: "low" | "high";
  analysisMethod: string;
  note: string;
}

export async function analyzeMammography(imageBase64: string): Promise<MammographyResult> {
  try {
    const response = await fetch(`${MAMMOGRAPHY_SERVICE_URL}/mammography/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 }),
    });

    if (!response.ok) {
      throw new Error(`Mammography service returned ${response.status}`);
    }

    return await response.json() as MammographyResult;
  } catch (error) {
    console.error("[Mammography Service] Error:", error);
    throw error;
  }
}

export async function checkMammographyServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MAMMOGRAPHY_SERVICE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

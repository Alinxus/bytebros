const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5000";
export async function analyzeWithML(imageData) {
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
        const result = await response.json();
        return result;
    }
    catch (error) {
        console.error("[ML Service] Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
export async function checkMLServiceHealth() {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/health`);
        return response.ok;
    }
    catch {
        return false;
    }
}

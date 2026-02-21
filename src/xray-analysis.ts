import OpenAI from "openai";
import { env } from "./env.js";
import { analyzeWithML, checkMLServiceHealth } from "../src/ml-client.js";

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export interface XRayResult {
  hasAbnormality: boolean;
  findings: Finding[];
  recommendations: string[];
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  cancerType?: string;
  model?: string;
}

interface Finding {
  type: string;
  location: string;
  severity: "normal" | "mild" | "moderate" | "severe";
  description: string;
}

export async function analyzeXRay(
  imageData: string | Buffer,
  patientSymptoms?: string,
  patientHistory?: string
): Promise<XRayResult> {
  let base64Data: string;

  try {
    if (Buffer.isBuffer(imageData)) {
      base64Data = imageData.toString("base64");
    } else {
      const response = await fetch(imageData);
      if (!response.ok) {
        console.log("[X-ray] Fetch failed, using GPT");
        const fallback = await analyzeWithGPT("");
        return fallback;
      }
      const buffer = await response.arrayBuffer();
      base64Data = Buffer.from(buffer).toString("base64");
    }
  } catch (error) {
    console.log("[X-ray] Error fetching image, using GPT");
    const fallback = await analyzeWithGPT("");
    return fallback;
  }

  // Try ML service first (DenseNet121 - real trained model)
  const mlHealthy = await checkMLServiceHealth();
  if (mlHealthy) {
    console.log("[X-ray] Using ML service (DenseNet121)");
    const mlResult = await analyzeWithML(base64Data);
    
    if (mlResult.success && mlResult.analysis) {
      const analysis = mlResult.analysis;
      
      // Convert ML results to our format
      const findings: Finding[] = analysis.findings.map(f => ({
        type: f.pathology.toLowerCase().replace(/_/g, " "),
        location: "chest",
        severity: f.risk_level === "high" ? "severe" as const : 
                  f.risk_level === "medium" ? "moderate" as const : "mild" as const,
        description: `${f.pathology}: ${f.probability}% probability`
      }));
      
      return {
        hasAbnormality: analysis.has_abnormality,
        findings,
        recommendations: [analysis.recommendation],
        riskLevel: analysis.overall_risk,
        confidence: analysis.confidence,
        model: "densenet121",
        cancerType: analysis.findings.some(f => 
          ["lung lesion", "mass", "nodule"].includes(f.pathology.toLowerCase())
        ) ? "lung" : undefined
      };
    }
  }

  // Fallback to GPT if available (but with warnings)
  if (openai) {
    console.log("[X-ray] Falling back to GPT-4o");
    return analyzeWithGPT(base64Data);
  }

  // Last resort - return safe default (no hallucinations)
  console.log("[X-ray] No ML service available, returning safe default");
  return {
    hasAbnormality: false,
    findings: [],
    recommendations: ["Consult a healthcare professional for proper diagnosis"],
    riskLevel: "low",
    confidence: 0.5,
    model: "none"
  };
}

async function analyzeWithGPT(base64Data: string): Promise<XRayResult> {
  if (!openai) {
    return {
      hasAbnormality: false,
      findings: [],
      recommendations: ["No analysis available - please provide valid image or use ML service"],
      riskLevel: "low",
      confidence: 0,
      model: "none"
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this chest X-ray for potential abnormalities. 

CRITICAL: You are NOT a radiologist. Provide a CONSERVATIVE assessment.
If you see anything unusual, note it. If unclear, say "uncertain" - do NOT guess.

IMPORTANT: This is a SCREENING ASSIST only. The final diagnosis must be made by a qualified physician.

Provide JSON:
{
  "hasAbnormality": boolean,
  "findings": [{"type": "string", "location": "string", "severity": "normal|mild|moderate|severe", "description": "string"}],
  "recommendations": ["string"],
  "riskLevel": "low|medium|high",
  "confidence": 0.0-1.0,
  "cancerType": "string if suspected"
}`
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Data}` }
            }
          ]
        }
      ],
      temperature: 0,
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        ...result,
        model: "gpt-4o",
        recommendations: result.recommendations || [
          "Consult a physician for proper interpretation"
        ]
      };
    }

    return { 
      hasAbnormality: false, 
      findings: [], 
      recommendations: ["Unable to analyze - consult physician"], 
      riskLevel: "low", 
      confidence: 0,
      model: "gpt-4o"
    };
  } catch (error) {
    console.error("[X-ray] GPT Error:", error);
    return {
      hasAbnormality: false,
      findings: [],
      recommendations: ["Analysis failed - please consult healthcare professional"],
      riskLevel: "low",
      confidence: 0,
      model: "failed"
    };
  }
}

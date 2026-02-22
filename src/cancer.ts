import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "./db/prisma.js";
import { analyzeXRay } from "./xray-analysis.js";
import { predictCancer, predictFromXRay, type PatientFeatures, type RiskFactors, type LongitudinalData } from "./prediction-engine.js";
import { calculateCancerRisk, type PatientRiskFactors, type XRayAnalysisResult, type LongitudinalScan } from "./cancer-risk-models.js";
import { predictBreastCancer, checkBreastCancerServiceHealth, BREAST_CANCER_FEATURES } from "./breast-cancer-client.js";
import { analyzeMammography, checkMammographyServiceHealth } from "./mammography-client.js";
import crypto from "crypto";

const cancer = new Hono();

const applyQualityPenalty = (confidence: number, quality?: { quality: string; issues?: string[] }) => {
  if (!quality || quality.quality !== "poor") return confidence;
  return Math.max(0, Math.min(1, confidence * 0.7));
};

const hashString = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

const createAuditLog = async (params: {
  userId?: string;
  apiKeyId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  requestBody?: any;
  responseBody?: any;
  errorMessage?: string;
}) => {
  try {
    const audit = await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        apiKeyId: params.apiKeyId || null,
        endpoint: params.endpoint,
        method: params.method,
        statusCode: params.statusCode,
        requestBody: params.requestBody || undefined,
        responseBody: params.responseBody || undefined,
        errorMessage: params.errorMessage || undefined,
      },
    });
    return audit.id;
  } catch (err) {
    console.log("[Audit] Failed to write audit log", err);
    return null;
  }
};

async function authenticate(c: any) {
  const apiKey = c.req.header("x-api-key");
  if (!apiKey) return null;

  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
  
  const key = await prisma.apiKey.findFirst({
    where: { keyHash, isActive: true },
  });

  return key ? { userId: key.userId, apiKeyId: key.id } : null;
}

cancer.use("*", async (c, next) => {
  const auth = await authenticate(c);
  if (!auth) {
    return c.json({ error: "Unauthorized - provide x-api-key header" }, 401);
  }
  (c as any).set("userId", auth.userId);
  (c as any).set("apiKeyId", auth.apiKeyId);
  await next();
});

const predictionSchema = z.object({
  features: z.any(),
  
  riskFactors: z.object({
    age: z.number().optional(),
    gender: z.enum(["male", "female"]).optional(),
    familyHistory: z.boolean().optional(),
    geneticMarkers: z.array(z.string()).optional(),
    lifestyle: z.object({
      smoking: z.enum(["current", "former", "never"]).optional(),
      alcohol: z.enum(["heavy", "moderate", "none"]).optional(),
      obesity: z.enum(["obese", "overweight", "normal"]).optional(),
      exercise: z.enum(["none", "moderate", "active"]).optional(),
    }).optional(),
    reproductiveHistory: z.object({
      neverBreastfed: z.boolean().optional(),
      noPregnancy: z.boolean().optional(),
      firstChildAfter30: z.boolean().optional(),
      earlyMenarche: z.boolean().optional(),
      lateMenopause: z.boolean().optional(),
    }).optional(),
    previousConditions: z.object({
      atypicalHyperplasia: z.boolean().optional(),
      LCIS: z.boolean().optional(),
      previousCancer: z.boolean().optional(),
      radiationExposure: z.boolean().optional(),
    }).optional(),
  }).optional(),
  
  longitudinalData: z.object({
    previousPredictions: z.array(z.object({
      date: z.string(),
      riskScore: z.number(),
    })).optional(),
    previousXRays: z.array(z.any()).optional(),
  }).optional(),
  
  imageUrl: z.string().url().optional(),
  imageBase64: z.string().optional(),
});

cancer.post(
  "/predict",
  zValidator("json", predictionSchema),
  async (c) => {
    const body = c.req.valid("json");

    let diagnosisResult = null;
    let xrayResult = null;

    if (body.features && Object.keys(body.features).length > 0) {
      diagnosisResult = await predictCancer(
        body.features as PatientFeatures,
        body.riskFactors as RiskFactors | undefined,
        body.longitudinalData as LongitudinalData | undefined
      );
    }

    if (body.imageUrl || body.imageBase64) {
      try {
        xrayResult = await analyzeXRay(
          body.imageUrl || Buffer.from(body.imageBase64!, "base64")
        );
      } catch (err) {
        console.error("[X-ray] Error:", err);
      }
    }

    let combined = null;
    if (diagnosisResult && xrayResult) {
      const mlScore = diagnosisResult.currentDiagnosis.riskScore;
      const xrayScore = xrayResult.riskLevel === "high" ? 80 : xrayResult.riskLevel === "medium" ? 50 : 20;
      const combinedScore = (mlScore * 0.5 + xrayScore * 0.5);
      
      combined = {
        prediction: combinedScore > 50 ? "malignant" : "benign",
        confidence: Math.round((diagnosisResult.currentDiagnosis.confidence * 0.5 + (xrayResult.confidence || 0.7) * 0.5) * 100) / 100,
        riskScore: Math.round(combinedScore),
        recommendation: combinedScore > 70 
          ? "High risk - immediate biopsy recommended"
          : combinedScore > 50 
          ? "Moderate risk - follow-up in 3 months"
          : "Low risk - continue annual screening",
      };
    }

    return c.json({
      timestamp: new Date().toISOString(),
      diagnosis: diagnosisResult?.currentDiagnosis || null,
      riskAssessment: diagnosisResult?.riskAssessment || null,
      xrayAnalysis: xrayResult ? {
        hasAbnormality: xrayResult.hasAbnormality,
        riskLevel: xrayResult.riskLevel,
        findings: xrayResult.findings,
      } : null,
      combined,
      longitudinalAnalysis: diagnosisResult?.longitudinalAnalysis || null,
    });
  }
);

cancer.post(
  "/risk-assessment",
  zValidator("json", z.object({
    age: z.number().min(0).max(120),
    gender: z.enum(["male", "female"]),
    familyHistory: z.boolean().optional(),
    geneticMarkers: z.array(z.string()).optional(),
    lifestyle: z.object({
      smoking: z.enum(["current", "former", "never"]).optional(),
      alcohol: z.enum(["heavy", "moderate", "none"]).optional(),
      obesity: z.enum(["obese", "overweight", "normal"]).optional(),
      exercise: z.enum(["none", "moderate", "active"]).optional(),
    }).optional(),
    previousConditions: z.object({
      atypicalHyperplasia: z.boolean().optional(),
      LCIS: z.boolean().optional(),
      previousCancer: z.boolean().optional(),
      radiationExposure: z.boolean().optional(),
    }).optional(),
  })),
  async (c) => {
    const body = c.req.valid("json");

    const result = await predictCancer({}, {
      ...body,
      age: body.age,
      gender: body.gender,
    } as RiskFactors);

    return c.json({
      timestamp: new Date().toISOString(),
      riskAssessment: result.riskAssessment,
    });
  }
);

cancer.post(
  "/longitudinal",
  zValidator("json", z.object({
    currentFeatures: z.any(),
    previousScans: z.array(z.object({
      date: z.string(),
      features: z.any(),
      result: z.enum(["benign", "malignant"]).optional(),
    })),
  })),
  async (c) => {
    const body = c.req.valid("json");

    const result = await predictCancer(
      body.currentFeatures as PatientFeatures,
      {},
      { previousPredictions: body.previousScans?.map(s => ({ date: s.date, riskScore: s.result === "malignant" ? 80 : 30 })) } as LongitudinalData
    );

    return c.json({
      timestamp: new Date().toISOString(),
      ...result.currentDiagnosis,
      ...result.riskAssessment,
      longitudinalAnalysis: result.longitudinalAnalysis,
    });
  }
);

cancer.post(
  "/xray",
  zValidator("json", z.object({
    imageUrl: z.string().url().optional(),
    imageBase64: z.string().optional(),
    patientData: z.object({
      age: z.number().optional(),
      gender: z.enum(["male", "female"]).optional(),
      familyHistory: z.boolean().optional(),
    }).optional(),
  })),
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.get("userId");
    const apiKeyId = c.get("apiKeyId");
    const apiKeyId = c.get("apiKeyId");

    if (!body.imageUrl && !body.imageBase64) {
      return c.json({ error: "imageUrl or imageBase64 required" }, 400);
    }

    const result = await analyzeXRay(
      body.imageUrl || Buffer.from(body.imageBase64!, "base64")
    );

    let riskAssessment = null;
    if (body.patientData) {
      const prediction = await predictCancer({}, {
        age: body.patientData.age,
        gender: body.patientData.gender,
        familyHistory: body.patientData.familyHistory,
      } as RiskFactors);
      riskAssessment = prediction.riskAssessment;
    }

    const responseBody = {
      analysis: result,
      riskScore: result.riskScore,
      quality: result.quality,
      adjustedConfidence: applyQualityPenalty(result.confidence, result.quality),
      riskAssessment,
      recommendation: result.riskLevel === "high"
        ? "High risk - immediate medical consultation recommended"
        : result.riskLevel === "medium"
        ? "Abnormal findings - follow-up recommended"
        : "No significant abnormalities - continue routine screening",
    };

    const requestMeta = {
      imageHash: body.imageBase64
        ? hashString(body.imageBase64.slice(0, 256))
        : body.imageUrl
        ? hashString(body.imageUrl)
        : undefined,
      imageBytes: body.imageBase64 ? body.imageBase64.length : undefined,
      patientData: body.patientData || undefined,
    };

    const auditId = await createAuditLog({
      userId,
      apiKeyId,
      endpoint: "/screening/xray",
      method: "POST",
      statusCode: 200,
      requestBody: requestMeta,
      responseBody: {
        riskLevel: result.riskLevel,
        riskScore: result.riskScore,
        adjustedConfidence: responseBody.adjustedConfidence,
        quality: result.quality,
        model: result.model,
      },
    });

    return c.json({
      ...responseBody,
      auditId,
    });
  }
);

cancer.post(
  "/xray-history",
  zValidator("json", z.object({
    currentImageUrl: z.string().url().optional(),
    currentImageBase64: z.string().optional(),
    previousImages: z.array(z.object({
      date: z.string(),
      imageUrl: z.string().url().optional(),
      imageBase64: z.string().optional(),
      result: z.object({
        hasAbnormality: z.boolean(),
        riskLevel: z.enum(["low", "medium", "high"]),
        confidence: z.number().optional(),
        findings: z.array(z.string()).optional(),
      }).optional(),
    })).optional(),
    riskFactors: z.object({
      age: z.number().optional(),
      gender: z.enum(["male", "female"]).optional(),
      familyHistory: z.boolean().optional(),
      geneticMarkers: z.array(z.string()).optional(),
    }).optional(),
  })),
  async (c) => {
    const body = c.req.valid("json");

    let currentAnalysis = null;
    if (body.currentImageUrl || body.currentImageBase64) {
      try {
        currentAnalysis = await analyzeXRay(
          body.currentImageUrl || Buffer.from(body.currentImageBase64!, "base64")
        );
      } catch (err) {
        console.error("[X-ray] Error:", err);
      }
    }

    const previousAnalyses = [];
    if (body.previousImages) {
      for (const img of body.previousImages) {
        if (img.result) {
            previousAnalyses.push({
              date: img.date,
              hasAbnormality: img.result.hasAbnormality,
              riskLevel: img.result.riskLevel,
              confidence: img.result.confidence || 0.7,
              findings: img.result.findings || [],
            });
          } else if (img.imageUrl || img.imageBase64) {
            try {
              const analysis = await analyzeXRay(
                img.imageUrl || Buffer.from(img.imageBase64!, "base64")
              );
              previousAnalyses.push({
                date: img.date,
                hasAbnormality: analysis.hasAbnormality,
                riskLevel: analysis.riskLevel,
                confidence: analysis.confidence || 0.7,
                findings: analysis.findings.map(f => f.description),
              });
            } catch {}
        }
      }
    }

    const result = predictFromXRay({
      currentXRay: currentAnalysis ? {
        date: new Date().toISOString().split("T")[0],
        hasAbnormality: currentAnalysis.hasAbnormality,
        riskLevel: currentAnalysis.riskLevel,
        confidence: currentAnalysis.confidence,
        findings: currentAnalysis.findings.map(f => f.description),
      } : undefined,
      previousXRays: previousAnalyses,
      riskFactors: body.riskFactors as RiskFactors | undefined,
    });

    return c.json({
      timestamp: new Date().toISOString(),
      currentXray: currentAnalysis ? {
        hasAbnormality: currentAnalysis.hasAbnormality,
        riskLevel: currentAnalysis.riskLevel,
        findings: currentAnalysis.findings,
      } : null,
      longitudinalAnalysis: result.longitudinalAnalysis,
      diagnosis: result.currentDiagnosis,
      riskAssessment: result.riskAssessment,
      recommendation: result.riskAssessment.riskLevel === "very_high" || result.riskAssessment.riskLevel === "high"
        ? "Immediate medical consultation recommended based on X-ray trends"
        : result.riskAssessment.riskLevel === "medium"
        ? "Follow-up imaging recommended"
        : "Continue routine screening",
    });
  }
);

cancer.get("/statistics/:type", async (c) => {
  const type = c.req.param("type");

  const stats: Record<string, any> = {
    breast: { 
      incidence: 2.3, 
      mortality: 0.7, 
      survival: 90,
      riskFactors: ["Family history", "BRCA genes", "Hormones", "Obesity"],
      fiveYearSurvival: { localized: 99, regional: 85, distant: 30 },
    },
    lung: { 
      incidence: 2.2, 
      mortality: 1.8, 
      survival: 22,
      riskFactors: ["Smoking", "Air pollution", "Radon", "Asbestos"],
      fiveYearSurvival: { localized: 60, regional: 33, distant: 8 },
    },
    colorectal: { 
      incidence: 1.9, 
      mortality: 0.9, 
      survival: 64,
      riskFactors: ["Diet", "Obesity", "IBD", "Family history"],
      fiveYearSurvival: { localized: 90, regional: 71, distant: 15 },
    },
    prostate: { 
      incidence: 1.4, 
      mortality: 0.4, 
      survival: 98,
      riskFactors: ["Age", "Family history", "Race"],
      fiveYearSurvival: { localized: 100, regional: 100, distant: 34 },
    },
  };

  return c.json(stats[type] || { error: "Unknown cancer type" }, stats[type] ? 200 : 404);
});

cancer.get("/guidelines/:type", async (c) => {
  const type = c.req.param("type");

  const guidelines: Record<string, any> = {
    breast: { 
      treatments: ["Surgery", "Chemotherapy", "Radiation", "Hormone therapy", "Targeted therapy", "Immunotherapy"],
      clinicalTrials: 3200,
      screening: { recommendation: "Annual mammogram age 40+", highRisk: "Annual MRI + mammogram" }
    },
    lung: { 
      treatments: ["Surgery", "Radiation", "Chemotherapy", "Immunotherapy", "Targeted therapy"],
      clinicalTrials: 2500,
      screening: { recommendation: "Annual low-dose CT for smokers 50-80" }
    },
    colorectal: { 
      treatments: ["Surgery", "Chemotherapy", "Radiation", "Targeted therapy"],
      clinicalTrials: 1800,
      screening: { recommendation: "Colonoscopy every 10 years age 45+" }
    },
  };

  return c.json(guidelines[type] || { error: "Unknown cancer type" }, guidelines[type] ? 200 : 404);
});

cancer.get("/model-card", async (c) => {
  return c.json({
    timestamp: new Date().toISOString(),
    models: [
      {
        name: "DenseNet121 (torchxrayvision)",
        task: "Chest X-ray multi-label classification",
        training: "NIH ChestX-ray14 (pretrained)",
        outputs: ["Atelectasis", "Consolidation", "Infiltration", "Pneumothorax", "Edema", "Emphysema", "Fibrosis", "Effusion", "Pneumonia", "Pleural_Thickening", "Cardiomegaly", "Lung Lesion", "Fracture", "Lung Opacity", "Support Devices", "Nodule", "Mass", "Hernia"],
        limitations: [
          "Screening assistance only",
          "Performance depends on image quality",
          "Not a replacement for radiologist interpretation"
        ],
        qualityChecks: ["exposure", "low_contrast", "blurry"]
      },
      {
        name: "DenseNet121 (transfer learning)",
        task: "Mammography screening (prototype)",
        training: "Pretrained on chest X-ray dataset; used as proxy for demo",
        limitations: [
          "Prototype-level mammography analysis",
          "Requires clinical validation",
          "Not diagnostic"
        ],
        qualityChecks: ["exposure", "low_contrast", "blurry"]
      }
    ],
    disclaimer: "Model cards are for transparency and educational use. This system is not a medical device."
  });
});

cancer.post(
  "/consensus",
  zValidator("json", z.object({
    xray: z.object({
      riskScore: z.number().optional(),
      riskLevel: z.enum(["low", "medium", "high"]).optional(),
      confidence: z.number().optional(),
      quality: z.object({
        quality: z.enum(["good", "poor", "unknown"]).optional(),
        issues: z.array(z.string()).optional(),
      }).optional(),
    }).optional(),
    mammography: z.object({
      riskScore: z.number().optional(),
      riskLevel: z.enum(["low", "medium", "high"]).optional(),
      confidence: z.number().optional(),
      quality: z.object({
        quality: z.enum(["good", "poor", "unknown"]).optional(),
        issues: z.array(z.string()).optional(),
      }).optional(),
    }).optional(),
    riskAssessment: z.object({
      overallRisk: z.number().optional(),
      riskLevel: z.enum(["low", "medium", "high", "very_high"]).optional(),
    }).optional(),
    longitudinal: z.object({
      trend: z.enum(["improving", "stable", "concerning"]).optional(),
      changePercent: z.number().optional(),
    }).optional(),
  })),
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.get("userId");
    const apiKeyId = c.get("apiKeyId");

    const toScore = (riskLevel?: string) => {
      if (riskLevel === "high" || riskLevel === "very_high") return 80;
      if (riskLevel === "medium") return 50;
      return 20;
    };

    const inputs: Array<{ label: string; score: number; weight: number }> = [];
    const addInput = (label: string, score: number, weight: number) => {
      inputs.push({ label, score, weight });
    };

    if (body.xray) {
      const score = body.xray.riskScore ?? toScore(body.xray.riskLevel);
      const conf = body.xray.confidence ?? 0.7;
      const weight = body.xray.quality?.quality === "poor" ? 0.4 : Math.min(1, Math.max(0.4, conf));
      addInput("X-ray", score, weight);
    }

    if (body.mammography) {
      const score = body.mammography.riskScore ?? toScore(body.mammography.riskLevel);
      const conf = body.mammography.confidence ?? 0.7;
      const weight = body.mammography.quality?.quality === "poor" ? 0.4 : Math.min(1, Math.max(0.4, conf));
      addInput("Mammography", score, weight);
    }

    if (body.riskAssessment) {
      const score = body.riskAssessment.overallRisk ?? toScore(body.riskAssessment.riskLevel);
      addInput("Risk Profile", score, 0.9);
    }

    if (body.longitudinal) {
      const trendScore = body.longitudinal.trend === "concerning" ? 70
        : body.longitudinal.trend === "improving" ? 30
        : 45;
      addInput("Longitudinal Trend", trendScore, 0.6);
    }

    const totalWeight = inputs.reduce((acc, i) => acc + i.weight, 0) || 1;
    const score = Math.round(inputs.reduce((acc, i) => acc + i.score * i.weight, 0) / totalWeight);
    const riskLevel = score >= 70 ? "high" : score >= 40 ? "medium" : "low";

    const agreement = inputs.length > 0
      ? Math.round((inputs.filter(i => (i.score >= 70 ? "high" : i.score >= 40 ? "medium" : "low") === riskLevel).length / inputs.length) * 100)
      : 0;

    const recommendation = riskLevel === "high"
      ? "Immediate follow-up recommended based on consensus risk"
      : riskLevel === "medium"
      ? "Follow-up recommended; monitor changes"
      : "Continue routine screening schedule";

    const responseBody = {
      score,
      riskLevel,
      agreement,
      inputs,
      recommendation,
    };

    const auditId = await createAuditLog({
      userId,
      apiKeyId,
      endpoint: "/screening/consensus",
      method: "POST",
      statusCode: 200,
      requestBody: body,
      responseBody,
    });

    return c.json({ ...responseBody, auditId });
  }
);

cancer.get("/audit/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  const audit = await prisma.auditLog.findFirst({
    where: { id, userId },
  });

  if (!audit) {
    return c.json({ error: "Audit record not found" }, 404);
  }

  return c.json({
    id: audit.id,
    endpoint: audit.endpoint,
    method: audit.method,
    statusCode: audit.statusCode,
    requestBody: audit.requestBody,
    responseBody: audit.responseBody,
    errorMessage: audit.errorMessage,
    createdAt: audit.createdAt,
  });
});

cancer.post(
  "/risk-predict",
  zValidator("json", z.object({
    patient: z.object({
      age: z.number().min(18).max(100),
      gender: z.enum(["male", "female"]),
      familyHistory: z.boolean().optional(),
      geneticMarkers: z.array(z.string()).optional(),
      lifestyle: z.object({
        smoking: z.enum(["current", "former", "never"]).optional(),
        alcohol: z.enum(["heavy", "moderate", "none"]).optional(),
        obesity: z.enum(["obese", "overweight", "normal"]).optional(),
      }).optional(),
      previousConditions: z.object({
        atypicalHyperplasia: z.boolean().optional(),
        LCIS: z.boolean().optional(),
        previousCancer: z.boolean().optional(),
        radiationExposure: z.boolean().optional(),
      }).optional(),
    }),
    xrayAnalysis: z.object({
      hasAbnormality: z.boolean(),
      findings: z.array(z.object({
        pathology: z.string(),
        probability: z.number(),
        risk_level: z.string(),
      })),
      overall_risk: z.enum(["low", "medium", "high"]),
      confidence: z.number(),
    }).optional(),
    longitudinalScans: z.array(z.object({
      date: z.string(),
      analysis: z.object({
        hasAbnormality: z.boolean(),
        findings: z.array(z.object({
          pathology: z.string(),
          probability: z.number(),
          risk_level: z.string(),
        })),
        overall_risk: z.enum(["low", "medium", "high"]),
        confidence: z.number(),
      }),
    })).optional(),
  })),
  async (c) => {
    const body = c.req.valid("json");

    const result = calculateCancerRisk(
      body.patient as PatientRiskFactors,
      body.xrayAnalysis as XRayAnalysisResult | undefined,
      body.longitudinalScans as LongitudinalScan[] | undefined
    );

    return c.json({
      timestamp: new Date().toISOString(),
      riskAssessment: result,
      disclaimer: "This is a risk assessment tool based on population data, not a medical diagnosis. Consult a healthcare professional for medical advice."
    });
  }
);

cancer.post(
  "/breast-cancer-predict",
  zValidator("json", z.object({
    features: z.array(z.number()),
    patientData: z.object({
      age: z.number().optional(),
      familyHistory: z.boolean().optional(),
      geneticMarkers: z.array(z.string()).optional(),
    }).optional(),
  })),
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.get("userId");

    const mlHealthy = await checkBreastCancerServiceHealth();
    if (!mlHealthy) {
      return c.json({ error: "Breast cancer service unavailable. Make sure ML service runs on port 5001." }, 503);
    }

    try {
      const result = await predictBreastCancer(body.features);

      try {
        await prisma.prediction.create({
          data: {
            userId,
            type: "breast_cancer",
            input: JSON.stringify({ features: body.features, patientData: body.patientData }),
            result: result.prediction,
            confidence: result.confidence,
            riskLevel: result.riskLevel,
          },
        });
      } catch (e) {
        console.log("[DB] Warning: Failed to save", e);
      }

      return c.json({
        timestamp: new Date().toISOString(),
        prediction: result,
        disclaimer: "This is a screening assist tool, not a medical diagnosis.",
      });
    } catch (err) {
      return c.json({ error: "Prediction failed" }, 500);
    }
  }
);

cancer.post(
  "/mammography",
  zValidator("json", z.object({
    imageBase64: z.string().optional(),
    imageUrl: z.string().url().optional(),
    patientData: z.object({
      age: z.number().optional(),
      familyHistory: z.boolean().optional(),
      previousScreenings: z.array(z.object({
        date: z.string(),
        result: z.enum(["normal", "abnormal"]).optional(),
      })).optional(),
    }).optional(),
  })),
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.get("userId");

    if (!body.imageBase64 && !body.imageUrl) {
      return c.json({ error: "imageBase64 or imageUrl required" }, 400);
    }

    try {
      const result = await analyzeMammography(body.imageBase64 || body.imageUrl!);
      const baseConfidence = result.calibratedConfidence ?? result.confidence;
      const adjustedConfidence = applyQualityPenalty(baseConfidence, result.quality);

      try {
        await prisma.xrayAnalysis.create({
          data: {
            userId,
            imageType: "mammography",
            hasAbnormality: result.prediction === "malignant",
            riskLevel: result.riskLevel,
            confidence: adjustedConfidence,
            findings: JSON.stringify(result),
          },
        });
      } catch (e) {
        console.log("[DB] Warning: Failed to save", e);
      }

      const responseBody = {
        timestamp: new Date().toISOString(),
        analysis: result,
        riskScore: result.riskScore,
        quality: result.quality,
        adjustedConfidence,
        patientData: body.patientData,
        disclaimer: "This is a screening assist tool, not a medical diagnosis. Consult a radiologist.",
      };

      const requestMeta = {
        imageHash: body.imageBase64
          ? hashString(body.imageBase64.slice(0, 256))
          : body.imageUrl
          ? hashString(body.imageUrl)
          : undefined,
        imageBytes: body.imageBase64 ? body.imageBase64.length : undefined,
        patientData: body.patientData || undefined,
      };

      const auditId = await createAuditLog({
        userId,
        apiKeyId,
        endpoint: "/screening/mammography",
        method: "POST",
        statusCode: 200,
        requestBody: requestMeta,
        responseBody: {
          riskLevel: result.riskLevel,
          riskScore: result.riskScore,
          adjustedConfidence,
          quality: result.quality,
          model: result.analysisMethod,
        },
      });

      return c.json({
        ...responseBody,
        auditId,
      });
    } catch (err) {
      return c.json({ error: "Analysis failed" }, 500);
    }
  }
);

cancer.post(
  "/analyze",
  zValidator("json", z.object({
    imageBase64: z.string().optional(),
    imageUrl: z.string().url().optional(),
    scanType: z.enum(["chest", "breast", "mammography"]).optional(),
    patientData: z.object({
      age: z.number().min(1).max(120).optional(),
      gender: z.enum(["male", "female"]).optional(),
      familyHistory: z.boolean().optional(),
      symptoms: z.array(z.string()).optional(),
    }).optional(),
  })),
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.get("userId");

    const imageData = body.imageBase64 || body.imageUrl;
    if (!imageData) {
      return c.json({ error: "imageBase64 or imageUrl required" }, 400);
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      scanType: body.scanType || "chest",
      status: "completed",
      summary: {},
      details: {},
      recommendations: [],
      nextSteps: [],
    };

    try {
      if (body.scanType === "breast" || body.scanType === "mammography") {
        const mlHealthy = await checkMammographyServiceHealth();
        if (mlHealthy) {
          const analysis = await analyzeMammography(imageData);
          
          results.summary = {
            result: analysis.prediction === "malignant" ? "Abnormal" : "Normal",
            riskLevel: analysis.riskLevel,
            confidence: Math.round(analysis.confidence * 100) + "%",
            severity: analysis.prediction === "malignant" ? "high" : "low",
          };

          results.details = {
            prediction: analysis.prediction,
            probability: {
              benign: Math.round(analysis.probabilities.benign * 100) + "%",
              malignant: Math.round(analysis.probabilities.malignant * 100) + "%",
            },
            analysisMethod: analysis.analysisMethod,
          };

          results.recommendations = analysis.prediction === "malignant" 
            ? ["Schedule follow-up with specialist", "Consider biopsy", "Regular monitoring recommended"]
            : ["Continue routine screening", "Annual mammogram recommended"];

          results.nextSteps = analysis.prediction === "malignant"
            ? ["Contact your healthcare provider within 1 week", "Bring this report to your doctor"]
            : ["Continue self-examination", "Schedule next screening in 1 year"];
        }
      } else {
        const mlHealthy = await fetch("http://localhost:5000/health").then(r => r.ok).catch(() => false);
        
        if (mlHealthy) {
          const analysis = await analyzeXRay(imageData);
          
          const findingsList = analysis.findings?.map((f: any) => ({
            condition: f.type,
            probability: f.description,
            severity: f.severity,
          })) || [];

          results.summary = {
            result: analysis.hasAbnormality ? "Abnormal" : "Normal",
            riskLevel: analysis.riskLevel,
            confidence: Math.round((analysis.confidence || 0.5) * 100) + "%",
            severity: analysis.riskLevel === "high" ? "high" : analysis.riskLevel === "medium" ? "medium" : "low",
          };

          results.details = {
            findings: findingsList,
            modelUsed: analysis.model || "densenet121",
            conditionsDetected: findingsList.length,
          };

          results.recommendations = analysis.riskLevel === "high"
            ? ["Urgent: Schedule appointment immediately", "Consider chest CT scan", "Consult pulmonologist"]
            : analysis.riskLevel === "medium"
            ? ["Follow-up within 2-4 weeks", "Monitor symptoms", "Consider additional testing"]
            : ["Continue routine screening", "No immediate action needed"];

          results.nextSteps = analysis.riskLevel === "high"
            ? ["Visit emergency or schedule ASAP", "Show this report to doctor"]
            : ["Schedule routine checkup", "Monitor any symptoms"];
        }
      }

      if (body.patientData) {
        const riskFactors: string[] = [];
        if (body.patientData.age && body.patientData.age > 50) riskFactors.push("Age > 50");
        if (body.patientData.familyHistory) riskFactors.push("Family history of cancer");
        
        if (riskFactors.length > 0) {
          results.riskFactors = riskFactors;
        }
      }

      results.disclaimer = "This is an AI-assisted screening, not a medical diagnosis. Always consult healthcare professionals.";
      results.urgentWarning = results.summary.riskLevel === "high" 
        ? "HIGH RISK DETECTED - Please consult a healthcare professional immediately" 
        : null;

      return c.json(results);

    } catch (err) {
      return c.json({ 
        error: "Analysis failed",
        message: "Unable to process the image. Please try again or consult a healthcare professional.",
        status: "failed" 
      }, 500);
    }
  }
);

cancer.post(
  "/longitudinal-track",
  zValidator("json", z.object({
    currentImageBase64: z.string().optional(),
    currentImageUrl: z.string().url().optional(),
    previousScans: z.array(z.object({
      date: z.string(),
      result: z.string(),
      riskLevel: z.enum(["low", "medium", "high"]),
      confidence: z.number().optional(),
    })),
  })),
  async (c) => {
    const body = c.req.valid("json");

    let currentAnalysis = null;
    if (body.currentImageBase64 || body.currentImageUrl) {
      const mlHealthy = await checkMammographyServiceHealth();
      if (mlHealthy) {
        currentAnalysis = await analyzeMammography(body.currentImageBase64 || body.currentImageUrl!);
      }
    }

    const scans = [...body.previousScans];
    if (currentAnalysis) {
      scans.push({
        date: new Date().toISOString(),
        result: currentAnalysis.prediction,
        riskLevel: currentAnalysis.riskLevel,
        confidence: currentAnalysis.confidence,
      });
    }

    let trend = "stable";
    const changes: string[] = [];
    
    if (scans.length >= 2) {
      const recent = scans[scans.length - 1];
      const previous = scans[scans.length - 2];
      
      if (previous.riskLevel === "low" && recent.riskLevel === "medium") {
        trend = "concerning";
        changes.push("Risk level increased from low to medium");
      } else if (previous.riskLevel === "low" && recent.riskLevel === "high") {
        trend = "concerning";
        changes.push("Risk level increased from low to high - urgent follow-up recommended");
      } else if (previous.riskLevel === "medium" && recent.riskLevel === "high") {
        trend = "concerning";
        changes.push("Risk level increased from medium to high - urgent follow-up recommended");
      } else if (previous.riskLevel === "high" && recent.riskLevel === "low") {
        trend = "improving";
        changes.push("Risk level decreased significantly");
      } else if (recent.confidence && previous.confidence) {
        if (recent.confidence > previous.confidence + 0.2) {
          trend = "concerning";
          changes.push("Prediction confidence increased significantly");
        } else if (recent.confidence < previous.confidence - 0.2) {
          trend = "improving";
          changes.push("Prediction confidence decreased");
        }
      }
    }

    return c.json({
      timestamp: new Date().toISOString(),
      currentAnalysis,
      previousScans: body.previousScans,
      longitudinalAnalysis: {
        trend,
        changes,
        totalScans: scans.length,
        recommendation: trend === "concerning" 
          ? "Changes detected - schedule follow-up with healthcare provider"
          : trend === "improving"
          ? "Positive trend - continue regular screenings"
          : "No significant changes - continue routine screening"
      },
      disclaimer: "This is a screening assist tool, not a medical diagnosis.",
    });
  }
);

cancer.post(
  "/risk-assessment",
  zValidator("json", z.object({
    patientData: z.object({
      age: z.number().min(18).max(100),
      gender: z.enum(["male", "female"]),
      familyHistory: z.boolean().optional(),
      geneticMarkers: z.array(z.string()).optional(),
      lifestyle: z.object({
        smoking: z.enum(["current", "former", "never"]).optional(),
        alcohol: z.enum(["heavy", "moderate", "none"]).optional(),
        obesity: z.enum(["obese", "overweight", "normal"]).optional(),
      }).optional(),
      previousConditions: z.object({
        atypicalHyperplasia: z.boolean().optional(),
        LCIS: z.boolean().optional(),
        previousCancer: z.boolean().optional(),
      }).optional(),
    }),
    imagingResult: z.object({
      hasAbnormality: z.boolean(),
      riskLevel: z.enum(["low", "medium", "high"]).optional(),
      confidence: z.number().optional(),
    }).optional(),
  })),
  async (c) => {
    const body = c.req.valid("json");
    const { patientData, imagingResult } = body;

    let overallRisk = 0;
    const riskFactors: string[] = [];

    if (patientData.age > 65) {
      overallRisk += 20;
      riskFactors.push("Age > 65 (+20)");
    } else if (patientData.age > 50) {
      overallRisk += 10;
      riskFactors.push("Age 50-65 (+10)");
    }

    if (patientData.familyHistory) {
      overallRisk += 25;
      riskFactors.push("Family history (+25)");
    }

    if (patientData.geneticMarkers) {
      for (const marker of patientData.geneticMarkers) {
        const m = marker.toUpperCase();
        if (m.includes("BRCA")) {
          overallRisk += 40;
          riskFactors.push(`${marker} (+40)`);
        }
      }
    }

    if (patientData.lifestyle?.smoking === "current") {
      overallRisk += 20;
      riskFactors.push("Current smoker (+20)");
    }

    if (patientData.lifestyle?.obesity === "obese") {
      overallRisk += 15;
      riskFactors.push("Obesity (+15)");
    }

    if (patientData.previousConditions?.previousCancer) {
      overallRisk += 30;
      riskFactors.push("Previous cancer (+30)");
    }

    if (imagingResult?.hasAbnormality) {
      overallRisk += 30;
      riskFactors.push("Imaging abnormality (+30)");
    }

    const riskLevel = overallRisk >= 60 ? "high" : overallRisk >= 30 ? "medium" : "low";

    return c.json({
      timestamp: new Date().toISOString(),
      riskAssessment: {
        overallRisk: Math.min(overallRisk, 100),
        riskLevel,
        factors: riskFactors,
        recommendations: riskLevel === "high" 
          ? ["Schedule immediate follow-up", "Consider biopsy", "Genetic counseling recommended"]
          : riskLevel === "medium"
          ? ["Schedule follow-up within 3 months", "Consider additional imaging"]
          : ["Continue routine screening", "Annual checkup recommended"]
      },
      disclaimer: "This is a risk assessment tool, not a medical diagnosis.",
    });
  }
);

cancer.post(
  "/triage",
  zValidator("json", z.object({
    symptoms: z.array(z.string()).optional(),
    patientData: z.object({
      age: z.number().min(18),
      gender: z.enum(["male", "female"]),
      riskFactors: z.array(z.string()).optional(),
    }).optional(),
  })),
  async (c) => {
    const body = c.req.valid("json");
    const { symptoms, patientData } = body;

    let urgency = "routine";
    const reasons: string[] = [];

    const urgentSymptoms = ["chest pain", "coughing blood", "severe weight loss", "difficulty breathing"];
    if (symptoms) {
      for (const s of symptoms) {
        if (urgentSymptoms.some(us => s.toLowerCase().includes(us))) {
          urgency = "urgent";
          reasons.push(`Symptom: ${s} requires urgent attention`);
        }
      }
    }

    if (patientData?.age && patientData.age > 60) {
      if (urgency !== "urgent") {
        urgency = "soon";
      }
      reasons.push("Age > 60 - increased vigilance recommended");
    }

    const recommendations = {
      urgent: [
        "Seek immediate medical attention",
        "Visit emergency department",
        "Do not delay treatment"
      ],
      soon: [
        "Schedule appointment within 1-2 weeks",
        "Consider imaging screening",
        "Consult with primary physician"
      ],
      routine: [
        "Schedule routine screening",
        "Annual checkup recommended",
        "Maintain healthy lifestyle"
      ]
    };

    return c.json({
      timestamp: new Date().toISOString(),
      triage: {
        urgency,
        reasons,
        recommendations: recommendations[urgency],
        nextSteps: urgency === "urgent" 
          ? "Go to nearest hospital or call emergency services"
          : "Contact your healthcare provider to schedule an appointment"
      },
      disclaimer: "This is a triage tool, not a medical diagnosis. Always consult healthcare professionals.",
    });
  }
);

cancer.post(
  "/second-opinion",
  zValidator("json", z.object({
    physicianFindings: z.string(),
    imageBase64: z.string().optional(),
    imageUrl: z.string().url().optional(),
    patientData: z.object({
      age: z.number().optional(),
      gender: z.enum(["male", "female"]).optional(),
    }).optional(),
  })),
  async (c) => {
    const body = c.req.valid("json");

    let aiAnalysis = null;
    if (body.imageBase64 || body.imageUrl) {
      const mlHealthy = await checkMammographyServiceHealth();
      if (mlHealthy) {
        aiAnalysis = await analyzeMammography(body.imageBase64 || body.imageUrl!);
      }
    }

    const concerns: string[] = [];
    const agreements: string[] = [];

    if (aiAnalysis) {
      if (body.physicianFindings.toLowerCase().includes("normal") && aiAnalysis.prediction === "malignant") {
        concerns.push("AI detected abnormality that physician did not note");
      } else if (body.physicianFindings.toLowerCase().includes("abnormal") && aiAnalysis.prediction === "benign") {
        concerns.push("AI did not detect abnormality noted by physician");
      } else {
        agreements.push("AI and physician findings are consistent");
      }

      if (aiAnalysis.confidence > 0.8) {
        concerns.push("High AI confidence - consider follow-up");
      }
    }

    return c.json({
      timestamp: new Date().toISOString(),
      secondOpinion: {
        physicianFindings: body.physicianFindings,
        aiAnalysis,
        concerns,
        agreements,
        summary: concerns.length > 0 
          ? "Potential discrepancies found - follow-up recommended"
          : "Findings are consistent - continue as recommended",
        recommendation: concerns.length > 0 
          ? "Discuss AI findings with your physician"
          : "No action required - continue routine care"
      },
      disclaimer: "This is a second opinion tool, not a medical diagnosis.",
    });
  }
);

cancer.get("/history", async (c) => {
  const userId = c.get("userId");

  let predictions: any[] = [];
  let analyses: any[] = [];

  try {
    predictions = await prisma.prediction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch (e) {
    console.log("[DB] No predictions");
  }

  try {
    analyses = await prisma.xRayAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch (e) {
    console.log("[DB] No xray analyses");
  }

  return c.json({
    timestamp: new Date().toISOString(),
    history: {
      predictions: predictions.map(p => ({
        id: p.id,
        type: p.prediction,
        result: p.prediction,
        date: p.createdAt,
      })),
      xrayAnalyses: analyses.map(a => ({
        id: a.id,
        imageType: a.imageType,
        hasAbnormality: a.hasAbnormality,
        riskLevel: a.riskLevel,
        date: a.createdAt,
      })),
    },
  });
});

export default cancer;

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "./db/prisma.js";
import { analyzeXRay } from "./xray-analysis.js";
import { predictCancer, predictFromXRay, type PatientFeatures, type RiskFactors, type LongitudinalData } from "./prediction-engine.js";
import { calculateCancerRisk, type PatientRiskFactors, type XRayAnalysisResult, type LongitudinalScan } from "./cancer-risk-models.js";

const cancer = new Hono();

async function authenticate(c: any) {
  const apiKey = c.req.header("x-api-key");
  if (!apiKey) return null;

  const keyHash = await import("crypto").then(crypto => 
    crypto.createHash("sha256").update(apiKey).digest("hex")
  );
  
  const key = await prisma.apiKey.findFirst({
    where: { keyHash, isActive: true },
  });

  return key?.userId || null;
}

cancer.use("*", async (c, next) => {
  const userId = await authenticate(c);
  if (!userId) {
    return c.json({ error: "Unauthorized - provide x-api-key header" }, 401);
  }
  (c as any).set("userId", userId);
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

    return c.json({
      analysis: result,
      riskAssessment,
      recommendation: result.riskLevel === "high"
        ? "High risk - immediate medical consultation recommended"
        : result.riskLevel === "medium"
        ? "Abnormal findings - follow-up recommended"
        : "No significant abnormalities - continue routine screening",
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

export default cancer;

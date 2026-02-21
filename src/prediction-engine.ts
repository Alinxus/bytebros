import { predictWithModels, initializeModels, type EnsemblePrediction } from "./ml-training.js";

export const FEATURE_NAMES = [
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

export const MEAN_VALUES: Record<string, { benign: number; malignant: number }> = {
  radius_mean: { benign: 12.19, malignant: 17.61 },
  texture_mean: { benign: 17.91, malignant: 21.60 },
  perimeter_mean: { benign: 78.08, malignant: 104.70 },
  area_mean: { benign: 462.79, malignant: 976.59 },
  smoothness_mean: { benign: 0.092, malignant: 0.103 },
  compactness_mean: { benign: 0.085, malignant: 0.143 },
  concavity_mean: { benign: 0.046, malignant: 0.149 },
  concave_points_mean: { benign: 0.032, malignant: 0.095 },
  symmetry_mean: { benign: 0.174, malignant: 0.198 },
  fractal_dimension_mean: { benign: 0.063, malignant: 0.066 },
  radius_se: { benign: 0.36, malignant: 0.84 },
  texture_se: { benign: 1.10, malignant: 1.58 },
  perimeter_se: { benign: 2.39, malignant: 6.40 },
  area_se: { benign: 18.10, malignant: 68.88 },
  smoothness_se: { benign: 0.006, malignant: 0.008 },
  compactness_se: { benign: 0.016, malignant: 0.038 },
  concavity_se: { benign: 0.017, malignant: 0.063 },
  concave_points_se: { benign: 0.010, malignant: 0.029 },
  symmetry_se: { benign: 0.018, malignant: 0.026 },
  fractal_dimension_se: { benign: 0.003, malignant: 0.004 },
  radius_worst: { benign: 15.04, malignant: 25.22 },
  texture_worst: { benign: 23.94, malignant: 29.97 },
  perimeter_worst: { benign: 98.60, malignant: 153.20 },
  area_worst: { benign: 686.62, malignant: 1419.75 },
  smoothness_worst: { benign: 0.135, malignant: 0.178 },
  compactness_worst: { benign: 0.266, malignant: 0.608 },
  concavity_worst: { benign: 0.254, malignant: 0.686 },
  concave_points_worst: { benign: 0.136, malignant: 0.312 },
  symmetry_worst: { benign: 0.271, malignant: 0.359 },
  fractal_dimension_worst: { benign: 0.090, malignant: 0.118 },
};

export const FEATURE_WEIGHTS: Record<string, number> = {
  radius_mean: 0.08, texture_mean: 0.05, perimeter_mean: 0.07, area_mean: 0.08,
  smoothness_mean: 0.02, compactness_mean: 0.03, concavity_mean: 0.05, concave_points_mean: 0.06,
  symmetry_mean: 0.01, fractal_dimension_mean: 0.01,
  radius_se: 0.02, texture_se: 0.01, perimeter_se: 0.02, area_se: 0.02,
  smoothness_se: 0.01, compactness_se: 0.01, concavity_se: 0.02, concave_points_se: 0.02,
  symmetry_se: 0.01, fractal_dimension_se: 0.01,
  radius_worst: 0.04, texture_worst: 0.03, perimeter_worst: 0.04, area_worst: 0.04,
  smoothness_worst: 0.02, compactness_worst: 0.02, concavity_worst: 0.03, concave_points_worst: 0.03,
  symmetry_worst: 0.01, fractal_dimension_worst: 0.01,
};

export const CANCER_RISK_FACTORS = {
  age: { threshold: 50, riskIncrease: 15, highThreshold: 65, highRiskIncrease: 20 },
  familyHistory: { riskIncrease: 25, highRiskIncrease: 40 },
  geneticMarkers: {
    BRCA1: { riskIncrease: 70, description: "BRCA1 mutation - 70% lifetime risk" },
    BRCA2: { riskIncrease: 70, description: "BRCA2 mutation - 70% lifetime risk" },
    TP53: { riskIncrease: 50, description: "Li-Fraumeni syndrome" },
    PALB2: { riskIncrease: 35, description: "PALB2 mutation" },
    CHEK2: { riskIncrease: 25, description: "CHEK2 mutation" },
    ATM: { riskIncrease: 20, description: "ATM gene mutation" },
  },
  lifestyle: {
    smoking: { current: 25, former: 10, never: 0 },
    alcohol: { heavy: 15, moderate: 5, none: 0 },
    obesity: { obese: 20, overweight: 10, normal: 0 },
    exercise: { none: 10, moderate: 0, active: -10 },
  },
  reproductive: {
    neverBreastfed: 5,
    noPregnancy: 10,
    firstChildAfter30: 8,
    earlyMenarche: 5,
    lateMenopause: 5,
  },
  previousConditions: {
    atypicalHyperplasia: 30,
    LCIS: 25,
    previousCancer: 50,
    radiationExposure: 20,
  },
};

export interface PatientFeatures {
  radius_mean?: number;
  texture_mean?: number;
  perimeter_mean?: number;
  area_mean?: number;
  smoothness_mean?: number;
  compactness_mean?: number;
  concavity_mean?: number;
  concave_points_mean?: number;
  symmetry_mean?: number;
  fractal_dimension_mean?: number;
  radius_se?: number;
  texture_se?: number;
  perimeter_se?: number;
  area_se?: number;
  smoothness_se?: number;
  compactness_se?: number;
  concavity_se?: number;
  concave_points_se?: number;
  symmetry_se?: number;
  fractal_dimension_se?: number;
  radius_worst?: number;
  texture_worst?: number;
  perimeter_worst?: number;
  area_worst?: number;
  smoothness_worst?: number;
  compactness_worst?: number;
  concavity_worst?: number;
  concave_points_worst?: number;
  symmetry_worst?: number;
  fractal_dimension_worst?: number;
}

export interface RiskFactors {
  age?: number;
  gender?: "male" | "female";
  familyHistory?: boolean;
  geneticMarkers?: string[];
  lifestyle?: {
    smoking?: "current" | "former" | "never";
    alcohol?: "heavy" | "moderate" | "none";
    obesity?: "obese" | "overweight" | "normal";
    exercise?: "none" | "moderate" | "active";
  };
  reproductiveHistory?: {
    neverBreastfed?: boolean;
    noPregnancy?: boolean;
    firstChildAfter30?: boolean;
    earlyMenarche?: boolean;
    lateMenopause?: boolean;
  };
  previousConditions?: {
    atypicalHyperplasia?: boolean;
    LCIS?: boolean;
    previousCancer?: boolean;
    radiationExposure?: boolean;
  };
}

export interface XRayAnalysis {
  date: string;
  hasAbnormality: boolean;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  findings?: string[];
  cancerType?: string;
}

export interface XRayPredictionInput {
  currentXRay?: XRayAnalysis;
  previousXRays?: XRayAnalysis[];
  riskFactors?: RiskFactors;
}

export interface PredictionResult {
  currentDiagnosis: {
    prediction: "benign" | "malignant";
    confidence: number;
    riskScore: number;
    features: string[];
  };
  mlModels?: {
    ensemble: EnsemblePrediction;
    modelsUsed: string[];
  };
  riskAssessment: {
    fiveYearRisk: number;
    tenYearRisk: number;
    lifetimeRisk: number;
    riskLevel: "low" | "medium" | "high" | "very_high";
    factors: RiskFactor[];
    recommendations: string[];
  };
  longitudinalAnalysis?: {
    trend: "improving" | "stable" | "concerning";
    changes: string[];
    rateOfChange: number;
  };
}

export interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface LongitudinalData {
  previousXRays?: XRayAnalysis[];
  previousPredictions?: Array<{ date: string; riskScore: number }>;
}

function featuresToArray(features: PatientFeatures): number[] {
  return FEATURE_NAMES.map(name => features[name as keyof PatientFeatures] ?? 0);
}

export async function predictCancer(
  features: PatientFeatures,
  riskFactors?: RiskFactors,
  longitudinalData?: LongitudinalData
): Promise<PredictionResult> {
  await initializeModels();
  
  const featuresArray = featuresToArray(features);
  const mlResult: EnsemblePrediction = predictWithModels(featuresArray);
  
  let malignancyScore = 0;
  let totalWeight = 0;
  const featureFindings: string[] = [];

  for (const [feature, value] of Object.entries(features)) {
    const mean = MEAN_VALUES[feature];
    const weight = FEATURE_WEIGHTS[feature] || 0;

    if (mean && value !== undefined) {
      totalWeight += weight;
      const ratio = value / mean.benign;

      if (ratio > 1) {
        const severity = Math.min((ratio - 1) * weight * 30, weight * 100);
        malignancyScore += severity;
        
        if (severity > 15) {
          featureFindings.push(`${feature}: ${value.toFixed(2)} (${((ratio - 1) * 100).toFixed(0)}% above normal)`);
        }
      } else if (ratio < 0.8) {
        malignancyScore -= weight * 5;
      }
    }
  }

  const legacyScore = totalWeight > 0 ? (malignancyScore / totalWeight) * 100 : 0;
  const diagnosisScore = mlResult.prediction === "malignant" 
    ? mlResult.confidence * 100 
    : (1 - mlResult.confidence) * 100;

  const currentDiagnosis = {
    prediction: mlResult.prediction,
    confidence: mlResult.confidence,
    riskScore: Math.round(diagnosisScore),
    features: featureFindings.slice(0, 5),
  };

  let riskScore = diagnosisScore * 0.3;
  const riskFactorsList: RiskFactor[] = [];

  if (riskFactors) {
    if (riskFactors.age) {
      if (riskFactors.age > 65) {
        riskScore += CANCER_RISK_FACTORS.age.highRiskIncrease;
        riskFactorsList.push({ factor: "Age > 65", impact: CANCER_RISK_FACTORS.age.highRiskIncrease, description: "Age is a significant risk factor" });
      } else if (riskFactors.age > 50) {
        riskScore += CANCER_RISK_FACTORS.age.riskIncrease;
        riskFactorsList.push({ factor: "Age > 50", impact: CANCER_RISK_FACTORS.age.riskIncrease, description: "Risk increases with age" });
      }
    }

    if (riskFactors.familyHistory) {
      riskScore += CANCER_RISK_FACTORS.familyHistory.riskIncrease;
      riskFactorsList.push({ factor: "Family History", impact: CANCER_RISK_FACTORS.familyHistory.riskIncrease, description: "First-degree relative with cancer" });
    }

    if (riskFactors.geneticMarkers) {
      for (const marker of riskFactors.geneticMarkers) {
        const geneRisk = (CANCER_RISK_FACTORS.geneticMarkers as Record<string, { riskIncrease: number; description: string }>)[marker.toUpperCase()];
        if (geneRisk) {
          riskScore += geneRisk.riskIncrease;
          riskFactorsList.push({ factor: marker, impact: geneRisk.riskIncrease, description: geneRisk.description });
        }
      }
    }

    if (riskFactors.lifestyle) {
      const { smoking, alcohol, obesity, exercise } = riskFactors.lifestyle;
      
      if (smoking) {
        riskScore += CANCER_RISK_FACTORS.lifestyle.smoking[smoking];
        if (smoking === "current") {
          riskFactorsList.push({ factor: "Current Smoker", impact: CANCER_RISK_FACTORS.lifestyle.smoking.current, description: "Smoking significantly increases risk" });
        }
      }
      
      if (alcohol) {
        riskScore += CANCER_RISK_FACTORS.lifestyle.alcohol[alcohol];
        if (alcohol === "heavy") {
          riskFactorsList.push({ factor: "Heavy Alcohol Use", impact: CANCER_RISK_FACTORS.lifestyle.alcohol.heavy, description: "Excessive alcohol consumption" });
        }
      }
      
      if (obesity) {
        riskScore += CANCER_RISK_FACTORS.lifestyle.obesity[obesity];
        if (obesity === "obese") {
          riskFactorsList.push({ factor: "Obesity", impact: CANCER_RISK_FACTORS.lifestyle.obesity.obese, description: "Obesity is linked to higher cancer risk" });
        }
      }
    }

    if (riskFactors.previousConditions) {
      const { atypicalHyperplasia, LCIS, previousCancer, radiationExposure } = riskFactors.previousConditions;
      
      if (atypicalHyperplasia) {
        riskScore += CANCER_RISK_FACTORS.previousConditions.atypicalHyperplasia;
        riskFactorsList.push({ factor: "Atypical Hyperplasia", impact: CANCER_RISK_FACTORS.previousConditions.atypicalHyperplasia, description: "Pre-cancerous condition" });
      }
      if (LCIS) {
        riskScore += CANCER_RISK_FACTORS.previousConditions.LCIS;
        riskFactorsList.push({ factor: "LCIS", impact: CANCER_RISK_FACTORS.previousConditions.LCIS, description: "Lobular carcinoma in situ" });
      }
      if (previousCancer) {
        riskScore += CANCER_RISK_FACTORS.previousConditions.previousCancer;
        riskFactorsList.push({ factor: "Previous Cancer", impact: CANCER_RISK_FACTORS.previousConditions.previousCancer, description: "History of cancer increases risk" });
      }
      if (radiationExposure) {
        riskScore += CANCER_RISK_FACTORS.previousConditions.radiationExposure;
        riskFactorsList.push({ factor: "Radiation Exposure", impact: CANCER_RISK_FACTORS.previousConditions.radiationExposure, description: "Previous radiation treatment" });
      }
    }
  }

  let longitudinalAnalysis;
  if (longitudinalData && longitudinalData.previousPredictions && longitudinalData.previousPredictions.length > 0) {
    const previousScores = longitudinalData.previousPredictions.map(p => p.riskScore / 100);

    const latestScore = previousScores[previousScores.length - 1];
    const firstScore = previousScores[0];
    const changeRate = firstScore !== 0 ? ((latestScore - firstScore) / firstScore) * 100 : 0;
    
    let trend: "improving" | "stable" | "concerning";
    if (changeRate < -5) trend = "improving";
    else if (changeRate > 10) trend = "concerning";
    else trend = "stable";

    riskScore += Math.abs(changeRate) * 0.5;
    
    longitudinalAnalysis = {
      trend,
      changes: changeRate > 0 ? [`${changeRate.toFixed(1)}% increase in abnormality markers`] : [`${Math.abs(changeRate).toFixed(1)}% decrease in abnormality markers`],
      rateOfChange: Math.round(changeRate),
    };

    if (trend === "concerning") {
      riskFactorsList.push({ factor: "Worsening Trend", impact: 20, description: "Scans show increasing abnormality over time" });
    }
  }

  const finalRiskScore = Math.min(Math.max(riskScore, 0), 100);
  
  const riskLevel = finalRiskScore >= 60 ? "very_high" as const 
    : finalRiskScore >= 40 ? "high" as const 
    : finalRiskScore >= 20 ? "medium" as const 
    : "low" as const;

  const recommendations = [];
  
  if (riskLevel === "very_high" || riskLevel === "high") {
    recommendations.push("Immediate consultation with oncologist recommended");
    recommendations.push("Consider biopsy");
    recommendations.push("Regular monitoring every 3-6 months");
  } else if (riskLevel === "medium") {
    recommendations.push("Annual mammogram/ultrasound");
    recommendations.push("Discuss risk reduction options with doctor");
  } else {
    recommendations.push("Continue regular screening");
    recommendations.push("Maintain healthy lifestyle");
  }

  if (riskFactors?.geneticMarkers?.length) {
    recommendations.push("Consider genetic counseling");
  }

  return {
    currentDiagnosis,
    mlModels: {
      ensemble: mlResult,
      modelsUsed: ["logistic_regression", "random_forest", "svm"],
    },
    riskAssessment: {
      fiveYearRisk: Math.round(finalRiskScore * 0.3),
      tenYearRisk: Math.round(finalRiskScore * 0.5),
      lifetimeRisk: Math.round(finalRiskScore),
      riskLevel,
      factors: riskFactorsList,
      recommendations,
    },
    longitudinalAnalysis,
  };
}

export function predictFromXRay(input: XRayPredictionInput): PredictionResult {
  const { currentXRay, previousXRays, riskFactors } = input;
  
  let diagnosisScore = 0;
  const xrayFindings: string[] = [];
  
  if (currentXRay) {
    if (currentXRay.riskLevel === "high") {
      diagnosisScore += 70;
      xrayFindings.push("Current X-ray shows high-risk abnormalities");
    } else if (currentXRay.riskLevel === "medium") {
      diagnosisScore += 40;
      xrayFindings.push("Current X-ray shows moderate-risk findings");
    } else {
      diagnosisScore += 10;
      xrayFindings.push("Current X-ray appears normal");
    }
  }

  let longitudinalAnalysis: any = null;
  if (previousXRays && previousXRays.length > 1) {
    const sorted = [...previousXRays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let worseningCount = 0;
    const changes: string[] = [];
    
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      
      const yearsDiff = (new Date(curr.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24 * 365);
      
      if (curr.riskLevel === "high" && prev.riskLevel !== "high") {
        worseningCount++;
        changes.push(`Risk escalated to HIGH by ${curr.date}`);
      } else if (curr.riskLevel === "medium" && prev.riskLevel === "low") {
        worseningCount++;
        changes.push(`Risk increased to MEDIUM by ${curr.date}`);
      }
      
      if (yearsDiff > 0) {
        diagnosisScore += worseningCount * 15;
      }
    }

    const totalYears = (new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    let trend: "improving" | "stable" | "concerning" = "stable";
    if (worseningCount >= sorted.length / 2) {
      trend = "concerning";
      diagnosisScore += 30;
      changes.push("Consistent worsening pattern detected");
    } else if (sorted[0].riskLevel === "high" && sorted[sorted.length - 1].riskLevel === "low") {
      trend = "improving";
      diagnosisScore -= 20;
    }

    longitudinalAnalysis = {
      trend,
      changes,
      rateOfChange: worseningCount,
      yearsTracked: Math.round(totalYears * 10) / 10,
      totalScans: sorted.length,
    };
  }

  const currentDiagnosis = {
    prediction: diagnosisScore > 50 ? "malignant" as const : "benign" as const,
    confidence: Math.min(Math.abs(diagnosisScore - 50) / 50 + 0.6, 0.95),
    riskScore: Math.round(diagnosisScore),
    features: xrayFindings,
  };

  let riskScore = diagnosisScore * 0.4;
  const riskFactorsList: RiskFactor[] = [];

  if (riskFactors) {
    if (riskFactors.age) {
      if (riskFactors.age > 50) {
        riskScore += 15;
        riskFactorsList.push({ factor: "Age > 50", impact: 15, description: "Age increases cancer risk" });
      }
    }

    if (riskFactors.familyHistory) {
      riskScore += 25;
      riskFactorsList.push({ factor: "Family History", impact: 25, description: "First-degree relative with cancer" });
    }

    if (riskFactors.geneticMarkers) {
      for (const marker of riskFactors.geneticMarkers) {
        const geneRisk = (CANCER_RISK_FACTORS.geneticMarkers as Record<string, { riskIncrease: number; description: string }>)[marker.toUpperCase()];
        if (geneRisk) {
          riskScore += geneRisk.riskIncrease;
          riskFactorsList.push({ factor: marker, impact: geneRisk.riskIncrease, description: geneRisk.description });
        }
      }
    }
  }

  if (longitudinalAnalysis?.trend === "concerning") {
    riskScore += 25;
    riskFactorsList.push({ factor: "Worsening X-ray Trend", impact: 25, description: "X-rays show progressive abnormalities over time" });
  }

  const finalRiskScore = Math.min(Math.max(riskScore, 0), 100);
  
  const riskLevel = finalRiskScore >= 60 ? "very_high" as const 
    : finalRiskScore >= 40 ? "high" as const 
    : finalRiskScore >= 20 ? "medium" as const 
    : "low" as const;

  const recommendations = [];
  
  if (riskLevel === "very_high" || riskLevel === "high") {
    recommendations.push("Immediate consultation with oncologist");
    recommendations.push("Additional diagnostic imaging (CT/MRI)");
    recommendations.push("Consider biopsy");
    recommendations.push("Frequent monitoring every 3-6 months");
  } else if (riskLevel === "medium") {
    recommendations.push("Annual follow-up imaging");
    recommendations.push("Discuss with primary care physician");
  } else {
    recommendations.push("Continue routine screening");
  }

  return {
    currentDiagnosis,
    riskAssessment: {
      fiveYearRisk: Math.round(finalRiskScore * 0.4),
      tenYearRisk: Math.round(finalRiskScore * 0.6),
      lifetimeRisk: Math.round(finalRiskScore),
      riskLevel,
      factors: riskFactorsList,
      recommendations,
    },
    longitudinalAnalysis,
  };
}

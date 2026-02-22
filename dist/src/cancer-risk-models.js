/**
 * Cavista Cancer Risk Prediction Model
 * Combines: X-ray analysis + Patient features + Longitudinal data
 * Output: 5-year, 10-year, lifetime cancer risk
 */
const BASELINE_RISK = {
    male: 0.04,
    female: 0.13,
};
const RISK_MODIFIERS = {
    age: {
        under40: 0.5,
        "40_50": 0.8,
        "50_60": 1.0,
        "60_70": 1.5,
        over70: 2.0,
    },
    familyHistory: {
        true: 2.0,
        false: 1.0,
    },
    geneticMarkers: {
        BRCA1: 5.0,
        BRCA2: 5.0,
        TP53: 4.0,
        PALB2: 3.5,
        CHEK2: 2.5,
        ATM: 2.0,
    },
    smoking: {
        never: 1.0,
        former: 1.5,
        current: 3.0,
    },
    alcohol: {
        none: 1.0,
        moderate: 1.2,
        heavy: 1.8,
    },
    obesity: {
        normal: 1.0,
        overweight: 1.3,
        obese: 1.8,
    },
    previousConditions: {
        atypicalHyperplasia: 3.0,
        LCIS: 2.5,
        previousCancer: 3.0,
        radiationExposure: 2.0,
    },
    xrayFindings: {
        nodule: 2.5,
        mass: 3.0,
        opacity: 2.0,
        consolidation: 1.5,
        effusion: 1.3,
        cardiomegaly: 1.5,
        atelectasis: 1.2,
        fibrosis: 2.0,
        emphysema: 1.5,
    },
};
function calculatePatientBaseRisk(factors) {
    let risk = BASELINE_RISK[factors.gender];
    const contributions = [];
    const ageKey = factors.age < 40 ? "under40" :
        factors.age < 50 ? "40_50" :
            factors.age < 60 ? "50_60" :
                factors.age < 70 ? "60_70" : "over70";
    const ageMod = RISK_MODIFIERS.age[ageKey];
    risk *= ageMod;
    contributions.push({ factor: "Age", contribution: ageMod, description: `Age ${factors.age} risk modifier` });
    if (factors.familyHistory) {
        risk *= RISK_MODIFIERS.familyHistory.true;
        contributions.push({ factor: "Family History", contribution: 2.0, description: "First-degree relative with cancer" });
    }
    if (factors.geneticMarkers) {
        for (const marker of factors.geneticMarkers) {
            const mod = RISK_MODIFIERS.geneticMarkers[marker.toUpperCase()] || 1;
            risk *= mod;
            contributions.push({ factor: `Genetic: ${marker}`, contribution: mod, description: `${marker} mutation` });
        }
    }
    if (factors.lifestyle) {
        if (factors.lifestyle.smoking) {
            const mod = RISK_MODIFIERS.smoking[factors.lifestyle.smoking];
            risk *= mod;
            contributions.push({ factor: "Smoking", contribution: mod, description: `${factors.lifestyle.smoking} smoker` });
        }
        if (factors.lifestyle.alcohol) {
            const mod = RISK_MODIFIERS.alcohol[factors.lifestyle.alcohol];
            risk *= mod;
            contributions.push({ factor: "Alcohol", contribution: mod, description: `${factors.lifestyle.alcohol} alcohol use` });
        }
        if (factors.lifestyle.obesity) {
            const mod = RISK_MODIFIERS.obesity[factors.lifestyle.obesity];
            risk *= mod;
            contributions.push({ factor: "Obesity", contribution: mod, description: `${factors.lifestyle.obesity} BMI` });
        }
    }
    if (factors.previousConditions) {
        if (factors.previousConditions.atypicalHyperplasia) {
            risk *= RISK_MODIFIERS.previousConditions.atypicalHyperplasia;
            contributions.push({ factor: "Atypical Hyperplasia", contribution: 3.0, description: "Pre-cancerous condition" });
        }
        if (factors.previousConditions.LCIS) {
            risk *= RISK_MODIFIERS.previousConditions.LCIS;
            contributions.push({ factor: "LCIS", contribution: 2.5, description: "Lobular carcinoma in situ" });
        }
        if (factors.previousConditions.previousCancer) {
            risk *= RISK_MODIFIERS.previousConditions.previousCancer;
            contributions.push({ factor: "Previous Cancer", contribution: 3.0, description: "History of cancer" });
        }
        if (factors.previousConditions.radiationExposure) {
            risk *= RISK_MODIFIERS.previousConditions.radiationExposure;
            contributions.push({ factor: "Radiation Exposure", contribution: 2.0, description: "Previous radiation treatment" });
        }
    }
    return { risk: Math.min(risk, 0.95), contributions };
}
function calculateXRayRisk(analysis) {
    let risk = 0.1;
    const findings = [];
    if (!analysis.hasAbnormality) {
        return { risk: 0.05, findings: [] };
    }
    for (const finding of analysis.findings) {
        const findingKey = finding.pathology.toLowerCase().replace(/[^a-z]/g, "");
        let mod = 1.0;
        for (const [key, value] of Object.entries(RISK_MODIFIERS.xrayFindings)) {
            if (findingKey.includes(key)) {
                mod = value;
                break;
            }
        }
        const prob = finding.probability / 100;
        risk += prob * mod * 0.3;
        findings.push(`${finding.pathology}: ${finding.probability}% (${finding.risk_level})`);
    }
    if (analysis.overall_risk === "high") {
        risk *= 1.5;
    }
    else if (analysis.overall_risk === "medium") {
        risk *= 1.2;
    }
    return { risk: Math.min(risk, 0.95), findings };
}
function calculateLongitudinalRisk(scans) {
    if (scans.length < 2) {
        return { trajectory: "unknown", trendScore: 0, progressionRate: 0 };
    }
    const sorted = scans.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const scores = [];
    for (const scan of sorted) {
        let score = 0;
        if (scan.analysis.hasAbnormality) {
            score += 0.3;
            for (const finding of scan.analysis.findings) {
                score += (finding.probability / 100) * 0.5;
            }
        }
        if (scan.analysis.overall_risk === "high")
            score += 0.3;
        else if (scan.analysis.overall_risk === "medium")
            score += 0.15;
        scores.push(score);
    }
    if (scores.length < 2) {
        return { trajectory: "unknown", trendScore: 0, progressionRate: 0 };
    }
    let progressionRate = 0;
    for (let i = 1; i < scores.length; i++) {
        progressionRate += (scores[i] - scores[i - 1]);
    }
    progressionRate /= (scores.length - 1);
    let trajectory;
    if (progressionRate > 0.1)
        trajectory = "increasing";
    else if (progressionRate < -0.1)
        trajectory = "decreasing";
    else
        trajectory = "stable";
    return { trajectory, trendScore: progressionRate, progressionRate };
}
export function calculateCancerRisk(patientFactors, xrayAnalysis, longitudinalScans) {
    const { risk: patientRisk, contributions } = calculatePatientBaseRisk(patientFactors);
    let totalRisk = patientRisk;
    const allContributions = [...contributions];
    if (xrayAnalysis) {
        const { risk: xrayRisk, findings } = calculateXRayRisk(xrayAnalysis);
        totalRisk = 1 - (1 - totalRisk) * (1 - xrayRisk * 0.7);
        if (findings.length > 0) {
            allContributions.push({
                factor: "X-ray Findings",
                contribution: xrayRisk / patientRisk,
                description: findings.join("; ")
            });
        }
    }
    let trajectory = "unknown";
    let progressionRate = 0;
    if (longitudinalScans && longitudinalScans.length >= 2) {
        const longitudinal = calculateLongitudinalRisk(longitudinalScans);
        trajectory = longitudinal.trajectory;
        progressionRate = longitudinal.progressionRate;
        if (trajectory === "increasing") {
            totalRisk *= 1.5;
            allContributions.push({
                factor: "Longitudinal Trend",
                contribution: 1.5,
                description: `Risk increasing over ${longitudinalScans.length} scans`
            });
        }
        else if (trajectory === "decreasing") {
            totalRisk *= 0.8;
            allContributions.push({
                factor: "Longitudinal Trend",
                contribution: 0.8,
                description: `Risk decreasing over ${longitudinalScans.length} scans`
            });
        }
    }
    totalRisk = Math.min(Math.max(totalRisk, 0.001), 0.95);
    const fiveYearRisk = totalRisk * (1 + progressionRate * 0.5);
    const tenYearRisk = totalRisk * (1 + progressionRate);
    const lifetimeRisk = Math.min(totalRisk * 2.5, 0.95);
    let riskLevel;
    if (lifetimeRisk >= 0.5)
        riskLevel = "very_high";
    else if (lifetimeRisk >= 0.3)
        riskLevel = "high";
    else if (lifetimeRisk >= 0.15)
        riskLevel = "medium";
    else if (lifetimeRisk >= 0.05)
        riskLevel = "low";
    else
        riskLevel = "very_low";
    const confidence = xrayAnalysis ? (xrayAnalysis.confidence * 0.6 + 0.4) : 0.6;
    let recommendation;
    if (riskLevel === "very_high" || riskLevel === "high") {
        recommendation = "Urgent: Biopsy and oncology consultation recommended";
    }
    else if (riskLevel === "medium") {
        recommendation = "Follow-up imaging in 3-6 months recommended";
    }
    else if (riskLevel === "low") {
        recommendation = "Annual screening recommended";
    }
    else {
        recommendation = "Routine screening as per guidelines";
    }
    return {
        fiveYearRisk: Math.round(fiveYearRisk * 100),
        tenYearRisk: Math.round(tenYearRisk * 100),
        lifetimeRisk: Math.round(lifetimeRisk * 100),
        riskLevel,
        confidence: Math.round(confidence * 100) / 100,
        factors: allContributions,
        recommendation,
        trajectory,
    };
}
export function formatRiskReport(result) {
    return `
CANCER RISK ASSESSMENT
======================
5-Year Risk:  ${result.fiveYearRisk}%
10-Year Risk: ${result.tenYearRisk}%
Lifetime Risk: ${result.lifetimeRisk}%
Risk Level:    ${result.riskLevel.toUpperCase()}
Confidence:    ${(result.confidence * 100).toFixed(0)}%

Risk Factors:
${result.factors.map(f => `  - ${f.factor}: ${f.contribution.toFixed(1)}x (${f.description})`).join("\n")}

Trend: ${result.trajectory}

Recommendation: ${result.recommendation}

DISCLAIMER: This is a risk assessment tool, not a diagnosis. 
Consult a healthcare professional for medical advice.
`.trim();
}

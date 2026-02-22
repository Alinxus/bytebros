import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import OpenAI from "openai";
import { env } from "./env.js";
import { prisma } from "./db/prisma.js";
import crypto from "crypto";

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

const report = new Hono();

const reportAnalysisSchema = z.object({
  reportText: z.string().min(10),
  reportType: z.enum(["blood", "imaging", "biopsy", "general"]).optional(),
});

const authenticate = async (apiKey?: string | null) => {
  if (!apiKey) return null;
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
  const key = await prisma.apiKey.findFirst({
    where: { keyHash, isActive: true },
  });
  return key?.userId || null;
};

report.post(
  "/analyze",
  zValidator("json", reportAnalysisSchema),
  async (c) => {
    const { reportText, reportType } = c.req.valid("json");
    const apiKey = c.req.header("x-api-key");
    const userId = await authenticate(apiKey);

    if (!openai) {
      const fallback = {
        success: true,
        analysis: {
          summary: "AI analysis is currently unavailable. Please try again later or consult your healthcare provider.",
          findings: [],
          recommendations: [
            "Consult with your healthcare provider for interpretation",
            "Bring this report to your next appointment"
          ],
          riskLevel: "unknown",
          followUp: [
            "Schedule a follow-up appointment",
            "Discuss results with your doctor"
          ],
          disclaimer: "Analysis service temporarily unavailable"
        }
      };

      if (userId) {
        try {
          await prisma.reportAnalysis.create({
            data: {
              userId,
              reportType: reportType || "general",
              summary: fallback.analysis.summary,
              riskLevel: fallback.analysis.riskLevel,
              findings: fallback.analysis.findings,
              recommendations: fallback.analysis.recommendations,
              questions: [],
            },
          });
        } catch {}
      }

      return c.json(fallback);
    }

    try {
      const reportTypeLabel = reportType || "medical";
      
      const prompt = `You are a helpful medical AI assistant. Analyze the following ${reportTypeLabel} report and provide easy-to-understand results for a patient.

IMPORTANT: 
- Use simple language that a non-medical person can understand
- Do NOT make any medical diagnoses
- Always recommend consulting a healthcare professional
- Be encouraging and supportive in tone
- If you see concerning results, advise follow-up without causing alarm

Provide your analysis in this JSON format:
{
  "summary": "A 2-3 sentence plain-English summary of what this report shows",
  "findings": [
    {
      "term": "Medical term found",
      "explanation": "Simple explanation of what this means in plain English",
      "severity": "normal|watch|follow-up"
    }
  ],
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2"
  ],
  "riskLevel": "low|medium|high|unknown",
  "followUp": [
    "What to do next step 1",
    "What to do next step 2"
  ],
  "questionsForDoctor": [
    "Question 1 you could ask your doctor",
    "Question 2 you could ask your doctor"
  ]
}

MEDICAL REPORT TO ANALYZE:
${reportText}

Remember: Use simple language, be encouraging, and always recommend professional medical advice.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful medical AI assistant that explains medical reports in simple, patient-friendly language. Always recommend consulting healthcare professionals."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content || "";
      
      let analysis;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found");
        }
      } catch {
        analysis = {
          summary: content.substring(0, 500),
          findings: [],
          recommendations: ["Please consult your healthcare provider for interpretation"],
          riskLevel: "unknown",
          followUp: ["Schedule a follow-up appointment"],
          questionsForDoctor: []
        };
      }

      if (userId) {
        try {
          await prisma.reportAnalysis.create({
            data: {
              userId,
              reportType: reportType || "general",
              summary: analysis.summary || "",
              riskLevel: analysis.riskLevel || "unknown",
              findings: analysis.findings || [],
              recommendations: analysis.recommendations || [],
              questions: analysis.questionsForDoctor || [],
            },
          });
        } catch (e) {
          console.log("[Report Analysis] Failed to save analysis", e);
        }
      }

      return c.json({
        success: true,
        analysis,
        disclaimer: "This is AI-generated analysis for informational purposes only. Always consult with a qualified healthcare professional for proper medical advice."
      });

    } catch (error) {
      console.error("[Report Analysis] Error:", error);
      return c.json({
        success: false,
        error: "Failed to analyze report. Please try again.",
        fallback: {
          summary: "Unable to analyze report at this time. Please consult your healthcare provider.",
          recommendations: ["Schedule an appointment with your doctor", "Bring this report to your next visit"],
          riskLevel: "unknown"
        }
      }, 500);
    }
  }
);

export default report;

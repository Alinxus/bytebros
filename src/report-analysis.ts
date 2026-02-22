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

const fileAnalysisSchema = z.object({
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
- Explain each finding in plain English and relate it to the model output evidence

Provide your analysis in this JSON format:
{
  "summary": "A 2-3 sentence plain-English summary of what this report shows",
  "overallAssessment": "One sentence overall assessment in plain English",
  "findings": [
    {
      "term": "Medical term found",
      "explanation": "Simple explanation of what this means in plain English",
      "severity": "normal|watch|follow-up"
    }
  ],
  "findingExplanations": [
    {
      "term": "Finding name",
      "plainMeaning": "What this means in simple language",
      "whyFlagged": "Why the model flagged it (based on the provided output text)",
      "whatToWatch": "What changes or symptoms to watch for",
      "suggestedFollowUp": "Suggested next step (non-diagnostic)"
    }
  ],
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2"
  ],
  "confidenceNotes": "Short note about uncertainty or quality issues",
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
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a helpful medical AI assistant that explains medical reports in simple, patient-friendly language. Always recommend consulting healthcare professionals. You must respond in JSON."
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

// File upload endpoint for PDF and image analysis
report.post(
  "/analyze/file",
  zValidator("form", fileAnalysisSchema),
  async (c) => {
    const apiKey = c.req.header("x-api-key");
    const userId = await authenticate(apiKey);
    const { reportType } = c.req.valid("form");

    try {
      const contentType = c.req.header("content-type") || "";
      
      const body = await c.req.parseBody();
      const file = body.file as File | null;
      
      if (!file) {
        return c.json({ success: false, error: "No file provided" }, 400);
      }

      const fileBuffer = await file.arrayBuffer();
      const fileName = file.name.toLowerCase();
      
      let extractedText = "";
      
      // Handle different file types
      if (fileName.endsWith(".pdf")) {
        // Import pdf-parse dynamically
        const pdfParseModule = await import("pdf-parse");
        // Handle different export styles
        const pdfParse = (pdfParseModule as any).default || (pdfParseModule as any);
        const pdfBuffer = Buffer.from(fileBuffer);
        
        try {
          const pdfData = await pdfParse(pdfBuffer);
          extractedText = pdfData.text;
          
          if (!extractedText || extractedText.length < 20) {
            return c.json({
              success: false,
              error: "Could not extract text from PDF. Please copy the text manually or convert to image.",
              requiresTextInput: true
            }, 400);
          }
        } catch (pdfErr) {
          console.error("[PDF Parse Error]", pdfErr);
          return c.json({
            success: false,
            error: "Failed to parse PDF. Please paste the text content directly.",
            requiresTextInput: true
          }, 400);
        }
        
      } else if (fileName.endsWith(".txt")) {
        // Text files
        const decoder = new TextDecoder("utf-8");
        extractedText = decoder.decode(fileBuffer);
        
      } else if (file.type?.startsWith("image/")) {
        // For images, use OpenAI Vision API
        if (!openai) {
          return c.json({ 
            success: false, 
            error: "Image analysis is currently unavailable. Please use the text input option." 
          }, 503);
        }
        
        // Convert to base64
        const base64Image = Buffer.from(fileBuffer).toString("base64");
        const mimeType = file.type || "image/jpeg";
        
        const reportTypeLabel = reportType || "medical";
        
        const visionPrompt = `You are a helpful medical AI assistant. Analyze this medical report image and provide easy-to-understand results for a patient.

IMPORTANT: 
- Use simple language that a non-medical person can understand
- Do NOT make any medical diagnoses
- Always recommend consulting a healthcare professional
- Be encouraging and supportive in tone

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
  "recommendations": ["Specific actionable recommendation"],
  "riskLevel": "low|medium|high|unknown",
  "followUp": ["What to do next"],
  "questionsForDoctor": ["Question for your doctor"]
}`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are a helpful medical AI assistant that explains medical reports in simple, patient-friendly language. Always recommend consulting healthcare professionals."
            },
            {
              role: "user",
              content: [
                { type: "text", text: visionPrompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`
                  }
                }
              ]
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
      } else {
        return c.json({ success: false, error: "Unsupported file type. Please upload a text file, PDF, or image." }, 400);
      }

      if (!extractedText || extractedText.length < 10) {
        return c.json({ success: false, error: "Could not extract text from file. Please try again or use text input." }, 400);
      }

      // Process extracted text with the same logic as text input
      const reportTypeLabel = reportType || "medical";
      
      const prompt = `You are a helpful medical AI assistant. Analyze the following ${reportTypeLabel} report and provide easy-to-understand results for a patient.

IMPORTANT: 
- Use simple language that a non-medical person can understand
- Do NOT make any medical diagnoses
- Always recommend consulting a healthcare professional
- Be encouraging and supportive in tone

Provide your analysis in this JSON format:
{
  "summary": "A 2-3 sentence plain-English summary",
  "findings": [{"term": "term", "explanation": "explanation", "severity": "normal|watch|follow-up"}],
  "recommendations": ["recommendation"],
  "riskLevel": "low|medium|high|unknown",
  "followUp": ["follow-up"],
  "questionsForDoctor": ["question"]
}

REPORT TEXT:
${extractedText}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
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
      console.error("[Report Analysis File] Error:", error);
      return c.json({
        success: false,
        error: "Failed to analyze file. Please try again or use text input.",
      }, 500);
    }
  }
);

export default report;

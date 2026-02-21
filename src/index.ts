import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { connectDatabase, prisma } from "./db/prisma.js";
import { env } from "./env.js";
import auth from "./auth.js";
import cancer from "./cancer.js";

const app = new Hono();

app.use("*", cors());

app.get("/", (c) => {
  return c.json({
    name: "Cavista Early Detection API",
    version: "3.0.0",
    description: "AI-powered EARLY DETECTION & screening assist - using DenseNet121 + patient risk factors",
    docs: "https://docs.cavista.health",
    disclaimer: "This is a screening assist tool, not a medical diagnosis. Consult healthcare professionals.",
    endpoints: {
      auth: {
        signup: "POST /auth/signup",
        login: "POST /auth/login",
      },
      screening: {
        detect: "POST /screening/detect - X-ray analysis with DenseNet121",
        riskAssessment: "POST /screening/risk-assessment - Combined risk from patient factors + imaging",
        longitudinal: "POST /screening/longitudinal - Track changes over time",
        xray: "POST /screening/xray - Legacy X-ray analysis endpoint",
        riskPredict: "POST /screening/risk-predict - Full risk calculation",
      },
      info: {
        statistics: "GET /screening/statistics/:type",
        guidelines: "GET /screening/guidelines/:type",
      },
    },
  });
});

app.route("/auth", auth);
app.route("/screening", cancer);

async function start() {
  try {
    await connectDatabase();
    console.log("[DB] Connected to PostgreSQL");
  } catch (err) {
    console.warn("[DB] Database not available");
  }

  const port = env.PORT;
  console.log(`[Server] Starting on port ${port}`);

  serve({
    fetch: app.fetch,
    port,
  });

  console.log(`[Server] Cavista Early Detection API running at http://localhost:${port}`);
}

start().catch(console.error);

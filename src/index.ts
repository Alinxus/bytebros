
import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { connectDatabase, prisma } from "../src/db/prisma.js";
import { env } from "./env.js";
import auth from "../src/auth.js";
import cancer from "../src/cancer.js";

const app = new Hono();

app.use("*", cors());

app.get("/", (c) => {
  return c.json({
    name: "Cavista Cancer Prediction API",
    version: "2.0.0",
    description: "AI-powered cancer PREDICTION - not just detection",
    docs: "https://docs.cavista.health",
    endpoints: {
      auth: {
        signup: "POST /auth/signup",
        login: "POST /auth/login",
      },
      prediction: {
        predict: "POST /cancer/predict - Full prediction with ML + X-ray + risk factors",
        riskAssessment: "POST /cancer/risk-assessment - Risk factors only",
        longitudinal: "POST /cancer/longitudinal - Track changes over time",
        xray: "POST /cancer/xray - X-ray analysis with patient context",
      },
      info: {
        statistics: "GET /cancer/statistics/:type",
        guidelines: "GET /cancer/guidelines/:type",
      },
    },
  });
});

app.route("/auth", auth);
app.route("/cancer", cancer);

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

  console.log(`[Server] Cavista Cancer API running at http://localhost:${port}`);
}

start().catch(console.error);

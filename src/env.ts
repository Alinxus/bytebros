export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/cavista",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  EMBEDDING_MODE: process.env.EMBEDDING_MODE || "local",
  RERANK_MODE: process.env.RERANK_MODE || "hybrid",
  PORT: parseInt(process.env.PORT || "4000"),
  NODE_ENV: process.env.NODE_ENV || "development",
};

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY['read']::TEXT[],
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "familyHistory" BOOLEAN NOT NULL DEFAULT false,
    "geneticMarkers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lifestyle" JSONB,
    "reproductive" JSONB,
    "previousConditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "userId" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "modelPrediction" JSONB,
    "ensembleResult" JSONB,
    "legacyResult" JSONB,
    "prediction" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "fiveYearRisk" DOUBLE PRECISION,
    "tenYearRisk" DOUBLE PRECISION,
    "lifetimeRisk" DOUBLE PRECISION,
    "riskFactors" JSONB,
    "recommendations" TEXT[],
    "modelVersion" TEXT NOT NULL DEFAULT 'v1',
    "modelsUsed" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xray_analyses" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageBase64" TEXT,
    "analysisResult" JSONB NOT NULL,
    "hasAbnormality" BOOLEAN NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "findings" TEXT[],
    "cancerType" TEXT,
    "previousAnalysisId" TEXT,
    "longitudinalResult" JSONB,
    "trend" TEXT,
    "changes" TEXT[],
    "analysisDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xray_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trained_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "precision" DOUBLE PRECISION,
    "recall" DOUBLE PRECISION,
    "f1Score" DOUBLE PRECISION,
    "auc" DOUBLE PRECISION,
    "trainingSize" INTEGER,
    "trainingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "trained_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "apiKeyId" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER,
    "requestBody" JSONB,
    "responseBody" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyId_key" ON "api_keys"("keyId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyPrefix_key" ON "api_keys"("keyPrefix");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "api_keys_keyPrefix_idx" ON "api_keys"("keyPrefix");

-- CreateIndex
CREATE UNIQUE INDEX "patients_externalId_key" ON "patients"("externalId");

-- CreateIndex
CREATE INDEX "patients_userId_idx" ON "patients"("userId");

-- CreateIndex
CREATE INDEX "patients_externalId_idx" ON "patients"("externalId");

-- CreateIndex
CREATE INDEX "predictions_patientId_idx" ON "predictions"("patientId");

-- CreateIndex
CREATE INDEX "predictions_userId_idx" ON "predictions"("userId");

-- CreateIndex
CREATE INDEX "predictions_prediction_idx" ON "predictions"("prediction");

-- CreateIndex
CREATE INDEX "predictions_createdAt_idx" ON "predictions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "xray_analyses_previousAnalysisId_key" ON "xray_analyses"("previousAnalysisId");

-- CreateIndex
CREATE INDEX "xray_analyses_patientId_idx" ON "xray_analyses"("patientId");

-- CreateIndex
CREATE INDEX "xray_analyses_userId_idx" ON "xray_analyses"("userId");

-- CreateIndex
CREATE INDEX "xray_analyses_analysisDate_idx" ON "xray_analyses"("analysisDate");

-- CreateIndex
CREATE UNIQUE INDEX "trained_models_name_key" ON "trained_models"("name");

-- CreateIndex
CREATE INDEX "trained_models_modelType_idx" ON "trained_models"("modelType");

-- CreateIndex
CREATE INDEX "trained_models_isActive_idx" ON "trained_models"("isActive");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_apiKeyId_idx" ON "audit_logs"("apiKeyId");

-- CreateIndex
CREATE INDEX "audit_logs_endpoint_idx" ON "audit_logs"("endpoint");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xray_analyses" ADD CONSTRAINT "xray_analyses_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xray_analyses" ADD CONSTRAINT "xray_analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xray_analyses" ADD CONSTRAINT "xray_analyses_previousAnalysisId_fkey" FOREIGN KEY ("previousAnalysisId") REFERENCES "xray_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

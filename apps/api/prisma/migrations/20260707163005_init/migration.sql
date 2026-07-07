-- CreateEnum
CREATE TYPE "SexAtBirth" AS ENUM ('female', 'male');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('processing', 'needs_review', 'confirmed', 'discarded', 'failed');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "Plausibility" AS ENUM ('ok', 'out_of_magnitude');

-- CreateEnum
CREATE TYPE "FlagStatus" AS ENUM ('good', 'watch', 'alert', 'none');

-- CreateEnum
CREATE TYPE "ScoreStatus" AS ENUM ('excellent', 'good', 'watch', 'alert');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "sexAtBirth" "SexAtBirth",
    "aiProcessingConsent" BOOLEAN NOT NULL DEFAULT true,
    "flagBorderline" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "purgeScheduledAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "pageCount" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ReportFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Extraction" (
    "id" TEXT NOT NULL,
    "reportFileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ExtractionStatus" NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "rawOutput" JSONB NOT NULL,
    "reportDate" TIMESTAMP(3),
    "performingLab" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Extraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionItem" (
    "id" TEXT NOT NULL,
    "extractionId" TEXT NOT NULL,
    "rawLabel" TEXT NOT NULL,
    "biomarkerKey" TEXT,
    "value" DECIMAL(65,30),
    "valueQualifier" TEXT,
    "valueLabel" TEXT,
    "unit" TEXT,
    "refLow" DECIMAL(65,30),
    "refHigh" DECIMAL(65,30),
    "lowInclusive" BOOLEAN,
    "highInclusive" BOOLEAN,
    "refTiers" JSONB,
    "refRaw" TEXT,
    "assayMethod" TEXT,
    "confidence" "Confidence" NOT NULL,
    "plausibility" "Plausibility" NOT NULL DEFAULT 'ok',
    "editedByUser" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ExtractionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "extractionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "performingLab" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "biomarkerKey" TEXT NOT NULL,
    "value" DECIMAL(65,30),
    "valueQualifier" TEXT,
    "valueLabel" TEXT,
    "unit" TEXT NOT NULL,
    "refLow" DECIMAL(65,30),
    "refHigh" DECIMAL(65,30),
    "lowInclusive" BOOLEAN,
    "highInclusive" BOOLEAN,
    "refTiers" JSONB,
    "refRaw" TEXT,
    "assayMethod" TEXT,
    "status" "FlagStatus" NOT NULL,
    "flagLabel" TEXT NOT NULL,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "systemKey" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "status" "ScoreStatus" NOT NULL,
    "formulaVersion" TEXT NOT NULL,
    "inputsSnapshot" JSONB NOT NULL,
    "frozenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tone" "FlagStatus" NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "markerKeys" TEXT[],
    "relatedScoreKey" TEXT,
    "groundingMeta" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purgeAfter" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ReportFile_userId_idx" ON "ReportFile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Extraction_reportFileId_key" ON "Extraction"("reportFileId");

-- CreateIndex
CREATE INDEX "Extraction_userId_idx" ON "Extraction"("userId");

-- CreateIndex
CREATE INDEX "ExtractionItem_extractionId_idx" ON "ExtractionItem"("extractionId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_extractionId_key" ON "Batch"("extractionId");

-- CreateIndex
CREATE INDEX "Batch_userId_idx" ON "Batch"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_userId_sequence_key" ON "Batch"("userId", "sequence");

-- CreateIndex
CREATE INDEX "Measurement_biomarkerKey_idx" ON "Measurement"("biomarkerKey");

-- CreateIndex
CREATE UNIQUE INDEX "Measurement_batchId_biomarkerKey_key" ON "Measurement"("batchId", "biomarkerKey");

-- CreateIndex
CREATE UNIQUE INDEX "Score_batchId_systemKey_key" ON "Score"("batchId", "systemKey");

-- CreateIndex
CREATE INDEX "Insight_userId_idx" ON "Insight"("userId");

-- CreateIndex
CREATE INDEX "Insight_batchId_idx" ON "Insight"("batchId");

-- CreateIndex
CREATE INDEX "ActivityEvent_userId_createdAt_idx" ON "ActivityEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DeletionRequest_userId_idx" ON "DeletionRequest"("userId");

-- AddForeignKey
ALTER TABLE "ReportFile" ADD CONSTRAINT "ReportFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Extraction" ADD CONSTRAINT "Extraction_reportFileId_fkey" FOREIGN KEY ("reportFileId") REFERENCES "ReportFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Extraction" ADD CONSTRAINT "Extraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionItem" ADD CONSTRAINT "ExtractionItem_extractionId_fkey" FOREIGN KEY ("extractionId") REFERENCES "Extraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_extractionId_fkey" FOREIGN KEY ("extractionId") REFERENCES "Extraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TYPE "SendType" AS ENUM ('BIRTHDAY_MONTH', 'BIRTHDAY_DAY');
CREATE TYPE "SendStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

CREATE TABLE "parents" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT,
  "email" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "consentAt" TIMESTAMP(3),
  "consentSource" TEXT,
  "managementTokenHash" TEXT,
  "managementTokenCreatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "children" (
  "id" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "firstName" TEXT,
  "birthMonth" INTEGER NOT NULL,
  "birthDay" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "birthday_sends" (
  "id" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "type" "SendType" NOT NULL,
  "occurrenceYear" INTEGER NOT NULL,
  "status" "SendStatus" NOT NULL DEFAULT 'PENDING',
  "providerResponse" JSONB,
  "errorMessage" TEXT,
  "attemptedAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "birthday_sends_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app_settings" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "rate_limit_buckets" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "parents_email_key" ON "parents"("email");
CREATE UNIQUE INDEX "parents_managementTokenHash_key" ON "parents"("managementTokenHash");
CREATE INDEX "parents_active_idx" ON "parents"("active");
CREATE INDEX "children_parentId_idx" ON "children"("parentId");
CREATE INDEX "children_active_birthMonth_birthDay_idx" ON "children"("active", "birthMonth", "birthDay");
CREATE UNIQUE INDEX "birthday_sends_childId_type_occurrenceYear_key" ON "birthday_sends"("childId", "type", "occurrenceYear");
CREATE INDEX "birthday_sends_parentId_idx" ON "birthday_sends"("parentId");
CREATE INDEX "birthday_sends_status_type_occurrenceYear_idx" ON "birthday_sends"("status", "type", "occurrenceYear");
CREATE INDEX "rate_limit_buckets_resetAt_idx" ON "rate_limit_buckets"("resetAt");

ALTER TABLE "children"
  ADD CONSTRAINT "children_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "birthday_sends"
  ADD CONSTRAINT "birthday_sends_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "birthday_sends"
  ADD CONSTRAINT "birthday_sends_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

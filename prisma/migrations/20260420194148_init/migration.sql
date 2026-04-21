-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VISITOR',
    "charityPercentage" INTEGER NOT NULL DEFAULT 10,
    "charityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "Charity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "amountCents" INTEGER NOT NULL,
    "prizePoolPercentage" INTEGER NOT NULL DEFAULT 50,
    "gatewayProvider" TEXT NOT NULL DEFAULT 'stripe',
    "gatewayReference" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewalAt" DATETIME NOT NULL,
    "canceledAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "providerReference" TEXT NOT NULL,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoreEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "scoreDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScoreEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Charity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "websiteUrl" TEXT,
    "upcomingEvent" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "charityId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "percentage" INTEGER,
    "type" TEXT NOT NULL,
    "monthKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Donation_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "Charity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Draw" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "monthKey" TEXT NOT NULL,
    "logic" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SIMULATED',
    "poolTotalCents" INTEGER NOT NULL,
    "tier5Cents" INTEGER NOT NULL,
    "tier4Cents" INTEGER NOT NULL,
    "tier3Cents" INTEGER NOT NULL,
    "rolloverFromPreviousCents" INTEGER NOT NULL DEFAULT 0,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "simulatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" DATETIME,
    "notes" TEXT,
    "metricsJson" TEXT,
    "executedById" TEXT NOT NULL,
    CONSTRAINT "Draw_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DrawNumber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drawId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    CONSTRAINT "DrawNumber_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DrawWinner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drawId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchTier" TEXT NOT NULL,
    "matchedCount" INTEGER NOT NULL,
    "prizeCents" INTEGER NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "proofUrl" TEXT,
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DrawWinner_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DrawWinner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DrawWinner_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_renewalAt_idx" ON "Subscription"("status", "renewalAt");

-- CreateIndex
CREATE INDEX "Payment_subscriptionId_paidAt_idx" ON "Payment"("subscriptionId", "paidAt");

-- CreateIndex
CREATE INDEX "ScoreEntry_userId_scoreDate_idx" ON "ScoreEntry"("userId", "scoreDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ScoreEntry_userId_scoreDate_key" ON "ScoreEntry"("userId", "scoreDate");

-- CreateIndex
CREATE UNIQUE INDEX "Charity_slug_key" ON "Charity"("slug");

-- CreateIndex
CREATE INDEX "Charity_featured_isActive_idx" ON "Charity"("featured", "isActive");

-- CreateIndex
CREATE INDEX "Donation_charityId_createdAt_idx" ON "Donation"("charityId", "createdAt");

-- CreateIndex
CREATE INDEX "Donation_monthKey_idx" ON "Donation"("monthKey");

-- CreateIndex
CREATE INDEX "Draw_monthKey_status_idx" ON "Draw"("monthKey", "status");

-- CreateIndex
CREATE INDEX "Draw_publishedAt_idx" ON "Draw"("publishedAt");

-- CreateIndex
CREATE INDEX "DrawNumber_drawId_value_idx" ON "DrawNumber"("drawId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "DrawNumber_drawId_position_key" ON "DrawNumber"("drawId", "position");

-- CreateIndex
CREATE INDEX "DrawWinner_drawId_matchTier_idx" ON "DrawWinner"("drawId", "matchTier");

-- CreateIndex
CREATE INDEX "DrawWinner_userId_paymentStatus_idx" ON "DrawWinner"("userId", "paymentStatus");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

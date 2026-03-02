-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "revolutId" TEXT,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastSynced" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'connected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "revolutTxId" TEXT,
    "merchant" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'debit',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "category" TEXT,
    "entity" TEXT NOT NULL DEFAULT 'personal',
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "receipt" BOOLEAN NOT NULL DEFAULT false,
    "receiptUrl" TEXT,
    "rationale" TEXT,
    "note" TEXT,
    "originalAmount" DOUBLE PRECISION,
    "originalCurrency" TEXT,
    "isBill" BOOLEAN NOT NULL DEFAULT false,
    "billId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "dueMonth" INTEGER,
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "vendor" TEXT,
    "category" TEXT,
    "entity" TEXT NOT NULL DEFAULT 'personal',
    "accountId" TEXT,
    "paidThisMonth" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "taxSchedule" TEXT NOT NULL DEFAULT 'Schedule C',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "karaniDailyAvg" DOUBLE PRECISION NOT NULL DEFAULT 400,
    "ilaiBiweekly" DOUBLE PRECISION NOT NULL DEFAULT 3000,
    "savingsGoal" DOUBLE PRECISION NOT NULL DEFAULT 800,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL DEFAULT 2026,
    "notificationsOn" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" INTEGER NOT NULL DEFAULT 22,
    "quietHoursEnd" INTEGER NOT NULL DEFAULT 7,
    "oneSignalPlayerId" TEXT,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastUnderBudgetDate" TIMESTAMP(3),
    "biometricEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_revolutId_key" ON "Account"("revolutId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_revolutTxId_key" ON "Transaction"("revolutTxId");

-- CreateIndex
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");

-- CreateIndex
CREATE INDEX "Transaction_userId_entity_idx" ON "Transaction"("userId", "entity");

-- CreateIndex
CREATE INDEX "Transaction_userId_category_idx" ON "Transaction"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_userId_slug_key" ON "Entity"("userId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "IncomeConfig_userId_key" ON "IncomeConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeConfig" ADD CONSTRAINT "IncomeConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

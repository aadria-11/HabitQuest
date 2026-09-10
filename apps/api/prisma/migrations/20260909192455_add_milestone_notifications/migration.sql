-- CreateTable
CREATE TABLE "MilestoneNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "milestone" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilestoneNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MilestoneNotification_userId_idx" ON "MilestoneNotification"("userId");

-- CreateIndex
CREATE INDEX "MilestoneNotification_habitId_idx" ON "MilestoneNotification"("habitId");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneNotification_habitId_milestone_key" ON "MilestoneNotification"("habitId", "milestone");

-- AddForeignKey
ALTER TABLE "MilestoneNotification" ADD CONSTRAINT "MilestoneNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneNotification" ADD CONSTRAINT "MilestoneNotification_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

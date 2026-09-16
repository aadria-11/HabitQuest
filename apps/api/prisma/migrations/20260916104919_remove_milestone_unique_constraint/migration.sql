-- DropIndex
DROP INDEX "MilestoneNotification_habitId_milestone_key";

-- CreateIndex
CREATE INDEX "MilestoneNotification_habitId_milestone_acknowledged_idx" ON "MilestoneNotification"("habitId", "milestone", "acknowledged");

-- CreateIndex (restore unique constraint)
CREATE UNIQUE INDEX "MilestoneNotification_habitId_milestone_key" ON "MilestoneNotification"("habitId", "milestone");

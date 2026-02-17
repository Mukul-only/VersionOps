/*
  Warnings:

  - You are about to drop the column `pointsAwarded` on the `event_results` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventId,dummyId]` on the table `event_participations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "event_results" DROP COLUMN "pointsAwarded";

-- CreateIndex
CREATE UNIQUE INDEX "event_participations_eventId_dummyId_key" ON "event_participations"("eventId", "dummyId");

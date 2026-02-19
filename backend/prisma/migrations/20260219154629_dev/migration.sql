/*
  Warnings:

  - You are about to drop the column `status` on the `event_participations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "event_participations" DROP COLUMN "status";

-- DropEnum
DROP TYPE "ParticipationStatus";

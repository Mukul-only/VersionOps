/*
  Warnings:

  - You are about to drop the column `serialNo` on the `participants` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "participants_serialNo_key";

-- AlterTable
ALTER TABLE "participants" DROP COLUMN "serialNo";

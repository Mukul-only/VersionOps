/*
  Warnings:

  - A unique constraint covering the columns `[hackerearthUser]` on the table `participants` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "participants_hackerearthUser_key" ON "participants"("hackerearthUser");

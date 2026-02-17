-- CreateEnum
CREATE TYPE "Year" AS ENUM ('ONE', 'TWO');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('FIRST', 'SECOND', 'THIRD');

-- CreateEnum
CREATE TYPE "FestStatus" AS ENUM ('REGISTERED', 'CHECKED_IN', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('REGISTERED', 'CHECKED_IN', 'NO_SHOW');

-- CreateTable
CREATE TABLE "colleges" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" SERIAL NOT NULL,
    "serialNo" INTEGER NOT NULL,
    "participantId" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "year" "Year" NOT NULL,
    "festStatus" "FestStatus" NOT NULL DEFAULT 'REGISTERED',
    "hackerearthUser" VARCHAR(100),
    "phone" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "teamSize" INTEGER NOT NULL DEFAULT 1,
    "participationPoints" INTEGER NOT NULL DEFAULT 0,
    "firstPrizePoints" INTEGER NOT NULL DEFAULT 0,
    "secondPrizePoints" INTEGER NOT NULL DEFAULT 0,
    "thirdPrizePoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participations" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "participantId" INTEGER NOT NULL,
    "dummyId" VARCHAR(50),
    "teamId" VARCHAR(50),
    "status" "ParticipationStatus" NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_results" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "participantId" INTEGER NOT NULL,
    "position" "Position" NOT NULL,
    "pointsAwarded" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college_scores" (
    "collegeId" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "firstPrizes" INTEGER NOT NULL DEFAULT 0,
    "secondPrizes" INTEGER NOT NULL DEFAULT 0,
    "thirdPrizes" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "college_scores_pkey" PRIMARY KEY ("collegeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "colleges_code_key" ON "colleges"("code");

-- CreateIndex
CREATE UNIQUE INDEX "participants_serialNo_key" ON "participants"("serialNo");

-- CreateIndex
CREATE UNIQUE INDEX "participants_participantId_key" ON "participants"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "event_participations_eventId_participantId_key" ON "event_participations"("eventId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "event_results_eventId_participantId_key" ON "event_results"("eventId", "participantId");

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_results" ADD CONSTRAINT "event_results_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_results" ADD CONSTRAINT "event_results_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "college_scores" ADD CONSTRAINT "college_scores_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

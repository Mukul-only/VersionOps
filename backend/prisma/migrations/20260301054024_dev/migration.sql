-- CreateTable
CREATE TABLE "ManualScoreAdjustment" (
    "id" SERIAL NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualScoreAdjustment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ManualScoreAdjustment" ADD CONSTRAINT "ManualScoreAdjustment_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

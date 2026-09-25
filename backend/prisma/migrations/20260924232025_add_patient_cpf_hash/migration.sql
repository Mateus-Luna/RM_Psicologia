/*
  Warnings:

  - A unique constraint covering the columns `[cpfHash]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "cpfHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Patient_cpfHash_key" ON "Patient"("cpfHash");

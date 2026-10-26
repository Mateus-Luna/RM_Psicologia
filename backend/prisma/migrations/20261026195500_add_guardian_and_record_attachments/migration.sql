-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "guardianName" TEXT;
ALTER TABLE "Patient" ADD COLUMN "guardianPhone" TEXT;

-- AlterTable
ALTER TABLE "MedicalRecordEntry" ADD COLUMN "attachments" TEXT;

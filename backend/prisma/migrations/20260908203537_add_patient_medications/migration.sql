/*
  Warnings:

  - You are about to drop the column `medicationName` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `medicationNotes` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `usesMedication` on the `Patient` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "PatientMedication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "patientId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientMedication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Patient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "phone" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "treatmentStartDate" DATETIME NOT NULL,
    "diagnosticHypothesis" TEXT,
    "hasMedicalFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "doctorName" TEXT,
    "generalNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Patient" ("birthDate", "cpf", "createdAt", "diagnosticHypothesis", "doctorName", "generalNotes", "hasMedicalFollowUp", "id", "isActive", "name", "phone", "treatmentStartDate", "updatedAt") SELECT "birthDate", "cpf", "createdAt", "diagnosticHypothesis", "doctorName", "generalNotes", "hasMedicalFollowUp", "id", "isActive", "name", "phone", "treatmentStartDate", "updatedAt" FROM "Patient";
DROP TABLE "Patient";
ALTER TABLE "new_Patient" RENAME TO "Patient";
CREATE UNIQUE INDEX "Patient_cpf_key" ON "Patient"("cpf");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PatientMedication_patientId_idx" ON "PatientMedication"("patientId");

-- CreateIndex
CREATE INDEX "PatientMedication_name_idx" ON "PatientMedication"("name");

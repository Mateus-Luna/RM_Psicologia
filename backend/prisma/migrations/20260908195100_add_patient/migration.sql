-- CreateTable
CREATE TABLE "Patient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "treatmentStartDate" DATETIME NOT NULL,
    "diagnosticHypothesis" TEXT,
    "hasMedicalFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "doctorName" TEXT,
    "usesMedication" BOOLEAN NOT NULL DEFAULT false,
    "medicationName" TEXT,
    "medicationNotes" TEXT,
    "generalNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_cpf_key" ON "Patient"("cpf");

-- CreateTable
CREATE TABLE "MedicalRecordEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MedicalRecordEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MedicalRecordEntry_patientId_idx" ON "MedicalRecordEntry"("patientId");

-- CreateIndex
CREATE INDEX "MedicalRecordEntry_patientId_entryDate_idx" ON "MedicalRecordEntry"("patientId", "entryDate");

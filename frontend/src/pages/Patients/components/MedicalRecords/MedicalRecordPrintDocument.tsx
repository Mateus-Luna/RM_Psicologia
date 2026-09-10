import type { Patient } from '../../../../types/patient';
import type { MedicalRecordEntry } from '../../../../types/medical-record';
import { MedicalRecordEntryType } from '../../../../types/medical-record';
import {
  formatCPF,
  formatDate,
  formatDateTime,
  formatPhone,
} from '../../../../utils/formatters';

interface MedicalRecordPrintDocumentProps {
  patient: Patient;
  entries: MedicalRecordEntry[];
  printMode: 'single' | 'filtered' | 'all';
  filterDescription?: string;
}

export function MedicalRecordPrintDocument({
  patient,
  entries,
  printMode,
  filterDescription,
}: MedicalRecordPrintDocumentProps) {
  const isSingle = printMode === 'single';

  return (
    <div id="medical-record-print-document" className="print-document">
      {/* CLINICAL HEADER */}
      <header className="print-header">
        <div className="print-clinic-branding">
          <h1 className="print-clinic-name">RM PSICOLOGIA</h1>
          <p className="print-clinic-subtitle">
            Sistema de Prontuário e Acompanhamento Psicológico
          </p>
        </div>
        <div className="print-document-badge">
          <span>DOCUMENTO CLÍNICO CONFIDENCIAL</span>
        </div>
      </header>

      <div className="print-divider" />

      {/* DOCUMENT TITLE & METADATA */}
      <div className="print-title-section">
        <h2 className="print-document-title">
          {isSingle
            ? 'REGISTRO DE EVOLUÇÃO CLÍNICA'
            : 'PRONTUÁRIO PSICOLÓGICO — HISTÓRICO DE REGISTROS'}
        </h2>
        <div className="print-meta-row">
          <span>
            <strong>Emissão:</strong> {formatDateTime(new Date().toISOString())}
          </span>
          {filterDescription && !isSingle && (
            <span>
              <strong>Filtro aplicado:</strong> {filterDescription}
            </span>
          )}
        </div>
      </div>

      {/* PATIENT IDENTIFICATION BOX */}
      <section className="print-patient-box">
        <div className="print-patient-grid">
          <div>
            <span className="print-label">Paciente:</span>
            <span className="print-value print-patient-name">{patient.name}</span>
          </div>
          <div>
            <span className="print-label">CPF:</span>
            <span className="print-value">
              {patient.cpf ? formatCPF(patient.cpf) : 'Não informado'}
            </span>
          </div>
          <div>
            <span className="print-label">Telefone:</span>
            <span className="print-value">{formatPhone(patient.phone) || '-'}</span>
          </div>
          <div>
            <span className="print-label">Data de Nascimento:</span>
            <span className="print-value">{formatDate(patient.birthDate)}</span>
          </div>
          <div>
            <span className="print-label">Início do Tratamento:</span>
            <span className="print-value">
              {formatDate(patient.treatmentStartDate)}
            </span>
          </div>
          <div>
            <span className="print-label">Acompanhamento Médico:</span>
            <span className="print-value">
              {patient.hasMedicalFollowUp
                ? `Sim ${patient.doctorName ? `(${patient.doctorName})` : ''}`
                : 'Não'}
            </span>
          </div>
        </div>
      </section>

      {/* CLINICAL ENTRIES */}
      <section className="print-entries-container">
        {entries.length === 0 ? (
          <div className="print-empty-note">
            <p>Nenhum registro selecionado para impressão.</p>
          </div>
        ) : (
          entries.map((entry, index) => {
            const isAppointment =
              entry.type === MedicalRecordEntryType.APPOINTMENT;

            return (
              <div
                key={entry.id}
                className="print-entry-item"
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
              >
                <div className="print-entry-header">
                  <div className="print-entry-header-left">
                    <span className="print-entry-index">#{index + 1}</span>
                    <span className="print-entry-date">
                      {formatDateTime(entry.entryDate)}
                    </span>
                  </div>
                  <span
                    className={`print-type-badge ${
                      isAppointment ? 'print-type-appointment' : 'print-type-note'
                    }`}
                  >
                    {isAppointment ? 'Atendimento Clínico' : 'Anotação Geral'}
                  </span>
                </div>

                <div className="print-entry-body">
                  <p className="print-entry-content">{entry.content}</p>
                </div>

                <div className="print-entry-footer">
                  <span>
                    Registrado eletronicamente em{' '}
                    {formatDateTime(entry.createdAt)}
                  </span>
                  {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
                    <span>
                      {' '}
                      • Retificado em {formatDateTime(entry.updatedAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* PROFESSIONAL SIGNATURE BLOCK */}
      <footer className="print-signature-section">
        <div className="print-signature-box">
          <div className="print-signature-line" />
          <p className="print-signature-name">Profissional Responsável</p>
          <p className="print-signature-crp">Psicólogo(a) Clínico(a) — CRP</p>
          <p className="print-signature-date">
            RM Psicologia • Sistema de Prontuário Eletrônico
          </p>
        </div>
      </footer>
    </div>
  );
}

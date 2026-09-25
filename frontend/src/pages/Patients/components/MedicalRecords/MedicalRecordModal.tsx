import { useState } from 'react';
import { FileText, Stethoscope, X } from 'lucide-react';
import type { MedicalRecordEntry } from '../../../../types/medical-record';
import { MedicalRecordEntryType } from '../../../../types/medical-record';
import {
  combineDateAndTime,
  toInputDate,
  toInputTime,
} from '../../../../utils/formatters';

interface MedicalRecordModalProps {
  isOpen: boolean;
  entryToEdit: MedicalRecordEntry | null;
  patientName: string;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSave: (payload: {
    type: MedicalRecordEntryType;
    entryDate: string;
    content: string;
  }) => Promise<void>;
}

export function MedicalRecordModal({
  isOpen,
  entryToEdit,
  patientName,
  loading,
  error: backendError,
  onClose,
  onSave,
}: MedicalRecordModalProps) {
  const [type, setType] = useState<MedicalRecordEntryType>(
    () => entryToEdit?.type ?? MedicalRecordEntryType.APPOINTMENT,
  );
  const [date, setDate] = useState<string>(
    () =>
      entryToEdit
        ? toInputDate(entryToEdit.entryDate)
        : toInputDate(new Date().toISOString()),
  );
  const [time, setTime] = useState<string>(
    () =>
      entryToEdit
        ? toInputTime(entryToEdit.entryDate)
        : toInputTime(new Date().toISOString()),
  );
  const [content, setContent] = useState<string>(
    () => entryToEdit?.content ?? '',
  );
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError('');

    if (!date) {
      setValidationError('Por favor, informe a data do registro.');
      return;
    }

    if (!content.trim()) {
      setValidationError('Por favor, digite o conteúdo do registro clínico.');
      return;
    }

    const isoEntryDate = combineDateAndTime(date, time);

    await onSave({
      type,
      entryDate: isoEntryDate,
      content: content.trim(),
    });
  }

  const isEditing = !!entryToEdit;

  return (
    <div
      className="modal-backdrop"
      id="medical-record-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-content modal-content-lg"
        id="medical-record-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h3 id="medical-record-modal-title">
              {isEditing ? 'Editar Registro no Prontuário' : 'Novo Registro no Prontuário'}
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginTop: '2px',
              }}
            >
              Paciente: <strong>{patientName}</strong>
            </p>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            disabled={loading}
            id="close-record-modal-btn"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ERROR ALERTS */}
        {(validationError || backendError) && (
          <div className="alert alert-danger" id="medical-record-modal-error">
            <span>{validationError || backendError}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="medical-record-form"
          style={{
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            paddingRight: '6px',
          }}
        >
          {/* TIPO DE REGISTRO */}
          <div className="form-field">
            <label>Tipo de Registro</label>
            <div className="record-type-selector">
              <label
                className={`record-type-option ${
                  type === MedicalRecordEntryType.APPOINTMENT ? 'selected' : ''
                }`}
                htmlFor="type-appointment-radio"
              >
                <input
                  type="radio"
                  id="type-appointment-radio"
                  name="record-type"
                  value={MedicalRecordEntryType.APPOINTMENT}
                  checked={type === MedicalRecordEntryType.APPOINTMENT}
                  onChange={() => setType(MedicalRecordEntryType.APPOINTMENT)}
                />
                <div className="record-type-icon">
                  <Stethoscope size={18} />
                </div>
                <div className="record-type-text">
                  <span className="record-type-title">Atendimento</span>
                  <span className="record-type-desc">
                    Consulta, sessão de psicoterapia ou evolução clínica
                  </span>
                </div>
              </label>

              <label
                className={`record-type-option ${
                  type === MedicalRecordEntryType.GENERAL_NOTE ? 'selected' : ''
                }`}
                htmlFor="type-general-note-radio"
              >
                <input
                  type="radio"
                  id="type-general-note-radio"
                  name="record-type"
                  value={MedicalRecordEntryType.GENERAL_NOTE}
                  checked={type === MedicalRecordEntryType.GENERAL_NOTE}
                  onChange={() => setType(MedicalRecordEntryType.GENERAL_NOTE)}
                />
                <div className="record-type-icon">
                  <FileText size={18} />
                </div>
                <div className="record-type-text">
                  <span className="record-type-title">Anotação Geral</span>
                  <span className="record-type-desc">
                    Observação clínica, contato com familiares, recados ou alinhamentos
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* DATA E HORÁRIO */}
          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="record-date-input">
                Data do Registro <span className="form-field-required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  id="record-date-input"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="record-time-input">
                Horário do Registro
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="time"
                  id="record-time-input"
                  className="form-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* CONTEÚDO CLÍNICO */}
          <div className="form-field">
            <label htmlFor="record-content-input">
              Conteúdo do Registro <span className="form-field-required">*</span>
            </label>
            <textarea
              id="record-content-input"
              className="form-textarea record-textarea"
              rows={12}
              placeholder="Descreva a evolução da sessão, relatos do paciente, observações sobre humor e afeto, intervenções clínicas realizadas, encaminhamentos e planejamento terapêutico..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: '4px',
              }}
            >
              Dica: O texto preserva parágrafos e formatação de linhas.
            </span>
          </div>

          {/* ACTIONS */}
          <div className="modal-footer" style={{ marginTop: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
              id="cancel-record-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              id="save-record-btn"
            >
              {loading ? 'Salvando registro...' : 'Salvar registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

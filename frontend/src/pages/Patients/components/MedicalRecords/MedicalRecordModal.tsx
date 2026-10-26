import { useRef, useState } from 'react';
import {
  FileText,
  Paperclip,
  Stethoscope,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  MedicalRecordAttachment,
  MedicalRecordEntry,
} from '../../../../types/medical-record';
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
    attachments?: MedicalRecordAttachment[];
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
  const [attachments, setAttachments] = useState<MedicalRecordAttachment[]>(
    () => entryToEdit?.attachments ?? [],
  );
  const [validationError, setValidationError] = useState('');
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    setFileError('');
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit per file

    Array.from(files).forEach((file) => {
      if (file.size > MAX_SIZE) {
        setFileError(`O arquivo "${file.name}" excede o limite máximo de 10 MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newAttachment: MedicalRecordAttachment = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl,
          uploadedAt: new Date().toISOString(),
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };

      reader.onerror = () => {
        setFileError(`Erro ao ler o arquivo "${file.name}". Tente novamente.`);
      };

      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleRemoveAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError('');
    setFileError('');

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
      attachments,
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
          maxHeight: '92vh',
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
        {(validationError || backendError || fileError) && (
          <div className="alert alert-danger" id="medical-record-modal-error">
            <span>{validationError || backendError || fileError}</span>
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
              rows={10}
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

          {/* UPLOAD DE ANEXOS E IMAGENS */}
          <div className="form-field" style={{ marginTop: '16px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Paperclip size={16} color="var(--primary)" />
                <span>Anexos e Imagens Externas</span>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    fontWeight: 400,
                  }}
                >
                  (Opcional)
                </span>
              </span>
              {attachments.length > 0 && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--primary)',
                  }}
                >
                  {attachments.length}{' '}
                  {attachments.length === 1 ? 'anexo' : 'anexos'}
                </span>
              )}
            </label>

            <input
              ref={fileInputRef}
              id="record-file-input"
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            {/* DROPZONE */}
            <div
              className={`record-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileSelect(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="dropzone-icon-circle">
                <Upload size={20} color="var(--primary)" />
              </div>
              <div className="dropzone-text">
                <span className="dropzone-title">
                  Clique para anexar ou arraste arquivos aqui
                </span>
                <span className="dropzone-sub">
                  Suporta imagens (PNG, JPG, WEBP), laudos (PDF), documentos e anotações (até 10 MB)
                </span>
              </div>
            </div>

            {/* ATTACHMENTS LIST */}
            {attachments.length > 0 && (
              <div className="record-attachments-list" id="record-attachments-preview">
                {attachments.map((att) => {
                  const isImage = att.type.startsWith('image/');
                  return (
                    <div key={att.id} className="attachment-chip">
                      {isImage ? (
                        <img
                          src={att.dataUrl}
                          alt={att.name}
                          className="attachment-thumb"
                        />
                      ) : (
                        <div className="attachment-doc-icon">
                          <FileText size={18} color="var(--primary)" />
                        </div>
                      )}

                      <div className="attachment-info">
                        <span className="attachment-name" title={att.name}>
                          {att.name}
                        </span>
                        <span className="attachment-size">
                          {formatFileSize(att.size)}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="attachment-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAttachment(att.id);
                        }}
                        title="Remover anexo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="modal-footer" style={{ marginTop: '16px' }}>
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

import { type FormEvent, useState } from 'react';
import { Pill, X } from 'lucide-react';
import { toInputDate } from '../../../utils/formatters';

export interface MedicationFormData {
  id?: number;
  name: string;
  notes?: string;
  startedAt?: string;
}

interface MedicationModalProps {
  isOpen: boolean;
  initialData?: MedicationFormData | null;
  onClose: () => void;
  onSave: (data: MedicationFormData) => void;
}

interface MedicationFormContentProps {
  initialData?: MedicationFormData | null;
  onClose: () => void;
  onSave: (data: MedicationFormData) => void;
}

function MedicationFormContent({
  initialData,
  onClose,
  onSave,
}: MedicationFormContentProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [startedAt, setStartedAt] = useState(
    toInputDate(initialData?.startedAt),
  );
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError('O nome do medicamento deve ter pelo menos 2 caracteres.');
      return;
    }

    onSave({
      id: initialData?.id,
      name: name.trim(),
      notes: notes.trim() ? notes.trim() : undefined,
      startedAt: startedAt ? startedAt : undefined,
    });
    onClose();
  }

  return (
    <div
      className="modal-content"
      id="medication-modal-content"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
    >
      <div className="modal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Pill size={20} />
          </div>
          <h3>
            {initialData ? 'Editar Medicamento' : 'Adicionar Medicamento'}
          </h3>
        </div>

        <button
          type="button"
          className="btn-icon"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="form-field">
          <label htmlFor="medication-name-input">
            Nome do medicamento <span className="form-field-required">*</span>
          </label>
          <input
            id="medication-name-input"
            type="text"
            className="form-input"
            placeholder="Ex: Sertralina, Fluoxetina..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="medication-notes-input">
            Observações / Dosagem
          </label>
          <input
            id="medication-notes-input"
            type="text"
            className="form-input"
            placeholder="Ex: 50mg pela manhã, 1 comprimido à noite..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="medication-started-at-input">
            Data de início (opcional)
          </label>
          <input
            id="medication-started-at-input"
            type="date"
            className="form-input"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
          />
        </div>

        <div className="modal-footer" style={{ marginTop: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            id="save-medication-btn"
          >
            {initialData ? 'Salvar Alterações' : 'Adicionar'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function MedicationModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: MedicationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      id="medication-modal-backdrop"
      onClick={onClose}
    >
      <MedicationFormContent
        key={initialData?.id ?? 'new-medication'}
        initialData={initialData}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  );
}

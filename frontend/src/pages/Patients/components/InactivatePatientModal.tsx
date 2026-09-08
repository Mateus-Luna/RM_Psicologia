import { AlertTriangle, X } from 'lucide-react';
import type { Patient } from '../../../types/patient';

interface InactivatePatientModalProps {
  patient: Patient | null;
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function InactivatePatientModal({
  patient,
  isOpen,
  loading,
  onClose,
  onConfirm,
}: InactivatePatientModalProps) {
  if (!isOpen || !patient) return null;

  return (
    <div
      className="modal-backdrop"
      id="inactivate-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-content"
        id="inactivate-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="inactivate-modal-title"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h3 id="inactivate-modal-title">Inativar Paciente</h3>
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

        <div>
          <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
            Deseja realmente inativar este paciente?
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
            Paciente: <strong>{patient.name}</strong>
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
            O paciente não aparecerá mais na listagem de pacientes ativos.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            id="cancel-inactivate-btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            id="confirm-inactivate-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Inativando...' : 'Inativar'}
          </button>
        </div>
      </div>
    </div>
  );
}

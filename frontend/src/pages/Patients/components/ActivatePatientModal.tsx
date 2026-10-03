import { CheckCircle2, UserCheck, X } from 'lucide-react';
import type { Patient } from '../../../types/patient';

interface ActivatePatientModalProps {
  patient: Patient | null;
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ActivatePatientModal({
  patient,
  isOpen,
  loading,
  onClose,
  onConfirm,
}: ActivatePatientModalProps) {
  if (!isOpen || !patient) return null;

  return (
    <div
      className="modal-backdrop"
      id="activate-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-content"
        id="activate-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="activate-modal-title"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--success-light)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserCheck size={20} />
            </div>
            <h3 id="activate-modal-title">Reativar Paciente</h3>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Fechar"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
          <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '15px' }}>
            Tem certeza que deseja reativar este paciente?
          </p>
          <p style={{ color: 'var(--text)', fontSize: '14px', lineHeight: '1.5' }}>
            Paciente: <strong>{patient.name}</strong>
          </p>
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid rgba(22, 163, 74, 0.2)',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ color: '#15803d', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
              Após a reativação, o paciente voltará a aparecer nas listas e poderá participar normalmente dos fluxos do sistema.
            </p>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '20px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            id="cancel-activate-btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            id="confirm-activate-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Reativando...' : 'Reativar paciente'}
          </button>
        </div>
      </div>
    </div>
  );
}

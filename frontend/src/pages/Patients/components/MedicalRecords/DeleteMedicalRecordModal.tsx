import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { MedicalRecordEntry } from '../../../../types/medical-record';
import { MedicalRecordEntryType } from '../../../../types/medical-record';
import { formatDateTime } from '../../../../utils/formatters';

interface DeleteMedicalRecordModalProps {
  entry: MedicalRecordEntry | null;
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteMedicalRecordModal({
  entry,
  isOpen,
  loading,
  onClose,
  onConfirm,
}: DeleteMedicalRecordModalProps) {
  if (!isOpen || !entry) return null;

  const isAppointment = entry.type === MedicalRecordEntryType.APPOINTMENT;

  return (
    <div
      className="modal-backdrop"
      id="delete-record-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-content"
        id="delete-record-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="delete-record-modal-title"
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
            <h3 id="delete-record-modal-title">Apagar Registro do Prontuário</h3>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Fechar"
            id="close-delete-record-modal-btn"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            Deseja realmente apagar este registro?
          </p>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--background)',
              border: '1px solid var(--border)',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tipo:</span>
              <span
                className={`badge ${
                  isAppointment ? 'badge-primary' : 'badge-general-note'
                }`}
              >
                {isAppointment ? 'Atendimento' : 'Anotação Geral'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Data:</span>
              <strong style={{ color: 'var(--text)' }}>
                {formatDateTime(entry.entryDate)}
              </strong>
            </div>

            <div style={{ marginTop: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Conteúdo:</span>
              <p
                style={{
                  margin: '4px 0 0',
                  color: 'var(--text)',
                  fontStyle: 'italic',
                  maxHeight: '80px',
                  overflowY: 'auto',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {entry.content.length > 200
                  ? `${entry.content.substring(0, 200)}...`
                  : entry.content}
              </p>
            </div>
          </div>

          <p
            style={{
              color: 'var(--danger)',
              fontSize: '13px',
              margin: 0,
              fontWeight: 500,
            }}
          >
            Atenção: Esta ação é definitiva e o registro será removido permanentemente do histórico do paciente.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            id="cancel-delete-record-btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            id="confirm-delete-record-btn"
            onClick={onConfirm}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={16} />
            <span>{loading ? 'Apagando...' : 'Apagar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

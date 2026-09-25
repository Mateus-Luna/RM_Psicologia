import { CheckCircle2 } from 'lucide-react';

interface RestoreSuccessModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export function RestoreSuccessModal({
  isOpen,
  onConfirm,
}: RestoreSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      id="restore-success-backdrop"
    >
      <div
        className="modal-content"
        id="restore-success-content"
        role="dialog"
        aria-labelledby="restore-success-title"
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
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={20} />
            </div>
            <h3 id="restore-success-title">Banco restaurado com sucesso</h3>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--text)',
              lineHeight: '1.5',
            }}
          >
            Os dados foram restaurados com sucesso.
          </p>
          <div className="alert alert-info" style={{ fontSize: '13px', margin: 0 }}>
            <span>Por segurança, será necessário entrar novamente no sistema.</span>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary"
            id="restore-success-ok-btn"
            onClick={onConfirm}
            autoFocus
          >
            Fazer login novamente
          </button>
        </div>
      </div>
    </div>
  );
}

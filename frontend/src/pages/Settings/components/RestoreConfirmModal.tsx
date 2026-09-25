import { AlertTriangle, FileBox, X } from 'lucide-react';

interface RestoreConfirmModalProps {
  isOpen: boolean;
  file: File | null;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function RestoreConfirmModal({
  isOpen,
  file,
  loading,
  error,
  onClose,
  onConfirm,
}: RestoreConfirmModalProps) {
  if (!isOpen || !file) return null;

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <div
      className="modal-backdrop"
      id="restore-modal-backdrop"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        className="modal-content"
        id="restore-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="restore-modal-title"
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
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h3 id="restore-modal-title">Restaurar backup</h3>
          </div>

          {!loading && (
            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {error && (
          <div className="alert alert-danger" id="restore-modal-error">
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <span
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Arquivo selecionado:
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--background)',
                border: '1px solid var(--border)',
              }}
            >
              <FileBox size={20} color="var(--primary)" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'var(--text)',
                    wordBreak: 'break-all',
                  }}
                >
                  {file.name}
                </p>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {formatFileSize(file.size)}
                </span>
              </div>
            </div>
          </div>

          <div
            className="alert alert-warning"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <AlertTriangle size={16} />
              <span>Atenção</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.45' }}>
              Esta ação substituirá os dados atuais do sistema pelos dados contidos no backup selecionado.
            </p>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9, lineHeight: '1.4' }}>
              O sistema possui uma cópia de segurança dos dados atuais antes da restauração.
            </p>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text)',
            }}
          >
            Deseja realmente continuar com a restauração?
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            id="cancel-restore-btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            id="confirm-restore-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Restaurando backup...' : 'Restaurar'}
          </button>
        </div>
      </div>
    </div>
  );
}

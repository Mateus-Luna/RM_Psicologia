import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Database,
  Download,
  HelpCircle,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { backupService, extractApiErrorMessage } from '../../../services/backup.service';
import { RestoreConfirmModal } from './RestoreConfirmModal';
import { RestoreSuccessModal } from './RestoreSuccessModal';

export function BackupRestoreSection() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup states
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState('');
  const [backupError, setBackupError] = useState('');

  // Restore states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Handle Backup creation & download
  async function handleCreateBackup() {
    if (creatingBackup) return;

    setCreatingBackup(true);
    setBackupError('');
    setBackupSuccessMessage('');

    try {
      await backupService.downloadBackup();
      setBackupSuccessMessage('Backup realizado com sucesso.');

      // Clear success feedback after 5 seconds
      setTimeout(() => {
        setBackupSuccessMessage('');
      }, 5000);
    } catch (err: unknown) {
      const message = await extractApiErrorMessage(
        err,
        'Não foi possível realizar o backup.',
      );
      setBackupError(message);
    } finally {
      setCreatingBackup(false);
    }
  }

  // Trigger file selection for restore
  function handleSelectFileClick() {
    setRestoreError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }

  // Handle file input change
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setRestoreError('');
    setIsConfirmModalOpen(true);
  }

  // Cancel restore
  function handleCancelRestore() {
    if (restoring) return;
    setIsConfirmModalOpen(false);
    setSelectedFile(null);
    setRestoreError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Confirm restore and send to backend
  async function handleConfirmRestore() {
    if (!selectedFile || restoring) return;

    setRestoring(true);
    setRestoreError('');

    try {
      await backupService.restoreBackup(selectedFile);
      setIsConfirmModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (err: unknown) {
      const message = await extractApiErrorMessage(
        err,
        'Não foi possível restaurar o backup.',
      );
      setRestoreError(message);
    } finally {
      setRestoring(false);
    }
  }

  // Complete restore flow: logout and redirect to login
  function handleCompleteRestore() {
    sessionStorage.removeItem('renato_psic_session');
    navigate('/login', { replace: true });
  }

  return (
    <section className="form-card" id="security-and-data-section">
      {/* SECTION HEADER */}
      <div className="form-section-title" style={{ paddingBottom: '4px' }}>
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
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: 'var(--text)' }}>
              Segurança e dados
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 400 }}>
              Faça cópias de segurança do banco de dados ou restaure registros anteriores.
            </p>
          </div>
        </div>
      </div>

      {/* BLOCO 1: BACKUP */}
      <div className="form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} color="var(--primary)" />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
            Backup
          </h4>
        </div>

        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Faça uma cópia dos dados do sistema para mantê-los seguros. O arquivo baixado conterá todos os pacientes, prontuários e agendamentos.
        </p>

        {backupSuccessMessage && (
          <div className="alert alert-success" id="backup-success-alert">
            <span>{backupSuccessMessage}</span>
          </div>
        )}

        {backupError && (
          <div className="alert alert-danger" id="backup-error-alert">
            <span>{backupError}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            id="make-backup-btn"
            onClick={handleCreateBackup}
            disabled={creatingBackup}
          >
            {creatingBackup ? (
              <>
                <Loader2 size={16} className="btn-spinner" />
                <span>Criando backup...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Fazer backup</span>
              </>
            )}
          </button>
        </div>

        {/* Informações e orientação ao usuário sobre Backup */}
        <div
          style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text)' }}>
            <HelpCircle size={15} color="var(--primary)" />
            <span>Como fazer um backup?</span>
          </div>
          <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px', lineHeight: '1.4' }}>
            <li>Clique em &quot;Fazer backup&quot;.</li>
            <li>O arquivo será baixado pelo navegador (formato .db).</li>
            <li>Guarde o arquivo em um local seguro ou nuvem externa.</li>
          </ol>
          <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <strong>Recomendação:</strong> Faça backups regularmente e mantenha uma cópia em um local seguro.
          </div>
        </div>
      </div>

      {/* BLOCO 2: RESTAURAÇÃO */}
      <div className="form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RotateCcw size={18} color="var(--danger)" />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
            Restauração
          </h4>
        </div>

        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Restaure os dados do sistema a partir de um arquivo de backup previamente gerado.
        </p>

        <div
          className="alert alert-warning"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '13px',
            lineHeight: '1.45',
          }}
        >
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Atenção:</strong> A restauração substituirá todos os dados atuais pelos dados do arquivo. O sistema cria automaticamente uma cópia de segurança antes da substituição.
          </span>
        </div>

        {restoreError && !isConfirmModalOpen && (
          <div className="alert alert-danger" id="restore-general-error-alert">
            <span>{restoreError}</span>
          </div>
        )}

        {/* Hidden file input strictly filtering .db files */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".db"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          id="backup-file-input"
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            id="restore-backup-btn"
            onClick={handleSelectFileClick}
            disabled={restoring}
          >
            <RotateCcw size={16} />
            <span>Restaurar backup</span>
          </button>
        </div>

        {/* Informações e orientação ao usuário sobre Restauração */}
        <div
          style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text)' }}>
            <HelpCircle size={15} color="var(--danger)" />
            <span>Como restaurar?</span>
          </div>
          <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px', lineHeight: '1.4' }}>
            <li>Clique em &quot;Restaurar backup&quot;.</li>
            <li>Selecione um arquivo de backup válido (.db).</li>
            <li>Confira os dados do arquivo na janela de confirmação.</li>
            <li>Confirme a restauração.</li>
            <li>Após a conclusão, entre novamente no sistema.</li>
          </ol>
          <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <strong>Atenção:</strong> A restauração substitui os dados atuais pelos dados presentes no arquivo. Utilize apenas arquivos de backup confiáveis.
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      <RestoreConfirmModal
        isOpen={isConfirmModalOpen}
        file={selectedFile}
        loading={restoring}
        error={restoreError}
        onClose={handleCancelRestore}
        onConfirm={handleConfirmRestore}
      />

      {/* SUCCESS MODAL */}
      <RestoreSuccessModal
        isOpen={isSuccessModalOpen}
        onConfirm={handleCompleteRestore}
      />
    </section>
  );
}

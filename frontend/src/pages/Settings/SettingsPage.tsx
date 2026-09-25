import { Settings } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { BackupRestoreSection } from './components/BackupRestoreSection';

export function SettingsPage() {
  return (
    <AppLayout
      title="Configurações"
      subtitle="Preferências do sistema, segurança e dados"
    >
      <div className="page-container" id="settings-page">
        {/* HEADER ROW */}
        <div className="page-header-row">
          <div className="page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={24} color="var(--primary)" />
              <h2>Configurações</h2>
            </div>
            <p>Gerencie as preferências do sistema, cópias de segurança e integridade dos dados.</p>
          </div>
        </div>

        {/* SEÇÃO SEGURANÇA E DADOS (BACKUP & RESTAURAÇÃO) */}
        <BackupRestoreSection />
      </div>
    </AppLayout>
  );
}

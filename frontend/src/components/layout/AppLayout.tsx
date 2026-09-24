import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { Header } from './Header';
import { Sidebar } from './Sidebar';

import { AutoLock } from '../auth/AutoLock';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const navigate = useNavigate();

  const storedSession = sessionStorage.getItem('renato_psic_session');

  const session = storedSession
    ? JSON.parse(storedSession)
    : null;



  function handleLogout() {
    sessionStorage.removeItem('renato_psic_session');
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />

      <div className="app-content">
        <Header
          userName={session?.name ?? 'usuário'}
          title={title}
          subtitle={subtitle}
        />

        <main className="app-main">
          {children}
        </main>
      </div>

      <AutoLock />
    </div>
  );
}
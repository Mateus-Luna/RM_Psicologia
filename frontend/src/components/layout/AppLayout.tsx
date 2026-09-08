import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const navigate = useNavigate();

  const storedUser = sessionStorage.getItem('renato_psic_user');

  const user = storedUser
    ? JSON.parse(storedUser)
    : null;

  function handleLogout() {
    sessionStorage.removeItem('renato_psic_user');
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />

      <div className="app-content">
        <Header
          userName={user?.name ?? 'usuário'}
          title={title}
          subtitle={subtitle}
        />

        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
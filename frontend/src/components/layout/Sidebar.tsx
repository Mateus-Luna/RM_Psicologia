import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  FileText,
  House,
  LogOut,
  Settings,
  UserX,
  Users,
} from 'lucide-react';


interface SidebarProps {
  onLogout: () => void;
}

const menuItems = [
  {
    label: 'Início',
    path: '/dashboard',
    icon: House,
  },
  {
    label: 'Pacientes',
    path: '/patients',
    icon: Users,
  },
  {
    label: 'Pacientes inativos',
    path: '/patients/inactive',
    icon: UserX,
  },
  {
    label: 'Agenda',
    path: '/agenda',
    icon: CalendarDays,
  },
  {
    label: 'Prontuários',
    path: '/records',
    icon: FileText,
  },
  {
    label: 'Configurações',
    path: '/settings',
    icon: Settings,
  },
];

export function Sidebar({ onLogout }: SidebarProps) {
  const [logoSrc, setLogoSrc] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadLogo() {
      try {
        const result =
          await window.logoAPI?.getLogo?.();

        if (
          result?.exists &&
          result.data &&
          result.mimeType
        ) {
          setLogoSrc(
            `data:${result.mimeType};base64,${result.data}`,
          );
        }
      } catch (error) {
        console.error(
          'Erro ao carregar logomarca:',
          error,
        );
      }
    }

    void loadLogo();
  }, []);

  async function handleLogoClick() {
    try {
      const result = await window.logoAPI.selectLogo();

      if (result?.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Erro ao selecionar logomarca:', error);
    }
  }


  return (
    <aside className="sidebar">
      <button
        type="button"
        className="sidebar-logo"
        onClick={handleLogoClick}
        title="Alterar logomarca"
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt="Logomarca"
          />
        ) : (
          <span className="sidebar-logo-placeholder">
            PsiFicha
          </span>
        )}
      </button>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-link sidebar-logout"
          onClick={onLogout}
        >
          <LogOut size={20} strokeWidth={1.8} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  FileText,
  House,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';

import logo from '../../assets/logo/RENATO LOGO  AZUL.png';

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
    label: 'Agenda',
    path: '/appointments',
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
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="Renato Psic" />
      </div>

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
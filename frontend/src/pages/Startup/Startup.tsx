import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export function Startup() {
  const navigate = useNavigate();

  useEffect(() => {
    async function checkSetup() {
      try {
        const storedUser = sessionStorage.getItem('rentao_psic_user');

        if (storedUser) {
          navigate('/dashboard', { replace: true });
          return;
        }

        const response = await api.get('/auth/setup-status');

        if (response.data.configured) {
          navigate('/login', { replace: true });
        } else {
          navigate('/setup', { replace: true });
        }
      } catch {
        // Vamos tratar a indisponibilidade do backend
        // de forma visual posteriormente.
      }
    }

    checkSetup();
  }, [navigate]);

  return (
    <main>
      <h1>Renato Psic</h1>
      <p>Carregando...</p>
    </main>
  );
}
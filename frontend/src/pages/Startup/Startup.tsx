import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export function Startup() {
  const navigate = useNavigate();

  useEffect(() => {
    async function checkSetup() {
      try {
        const storedSession = sessionStorage.getItem('renato_psic_session');

        if (storedSession) {
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
        // Se houver erro ou backend indisponível, direciona para configuração inicial
        navigate('/setup', { replace: true });
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
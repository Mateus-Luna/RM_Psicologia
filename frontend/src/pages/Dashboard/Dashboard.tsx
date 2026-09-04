import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();

  const storedUser = sessionStorage.getItem('rentao_psic_user');

  const user = storedUser ? JSON.parse(storedUser) : null;

  function handleLogout() {
    sessionStorage.removeItem('rentao_psic_user');
    navigate('/login');
  }

  return (
    <div>
      <header>
        <div>
          <h1>Rentao Psic</h1>
        </div>

        <div>
          <span>
            {user?.name ?? 'Usuário'}
          </span>

          <button type="button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <main>
        <h2>Olá, {user?.name ?? 'usuário'}!</h2>

        <p>
          Bem-vindo ao Renato Psic.
        </p>

        <section>
          <h3>Visão geral</h3>

          <p>
            O sistema está pronto para começar a ser configurado.
          </p>
        </section>
      </main>
    </div>
  );
}
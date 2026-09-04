import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export function Login() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        password,
      });

      sessionStorage.setItem(
        'rentao_psic_user',
        JSON.stringify(response.data),
      );

      navigate('/dashboard');
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'Não foi possível realizar o login.';

      setError(
        Array.isArray(message) ? message.join(', ') : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Renato Psic</h1>

      <p>Digite sua senha para acessar o sistema.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password">Senha</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
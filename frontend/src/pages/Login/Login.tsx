import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
        'renato_psic_session',
        JSON.stringify({
          id: response.data.id,
          name: response.data.name,
          expiresAt: response.data.expiresAt,
          token: response.data.token,
        }),
      );

      navigate('/dashboard');
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? (error.response.data.message as string | string[])
          : 'Não foi possível realizar o login.';

      setError(
        Array.isArray(message) ? message.join(', ') : String(message),
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
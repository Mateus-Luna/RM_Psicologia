import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../../services/api';

export function Setup() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/setup', {
        name,
        password,
      });

      navigate('/login');
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? (error.response.data.message as string | string[])
          : 'Não foi possível configurar o sistema.';

      setError(
        Array.isArray(message) ? message.join(', ') : String(message),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Configuração inicial</h1>

      <p>
        Configure o sistema informando o nome do psicólogo e uma senha
        de acesso.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Nome</label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Senha</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">
            Confirmar senha
          </label>

          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            minLength={8}
            required
          />
        </div>

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Configurando...' : 'Configurar sistema'}
        </button>
      </form>
    </main>
  );
}
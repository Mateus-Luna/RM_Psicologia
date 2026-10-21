
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../../services/api';

export function Setup() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [crp, setCrp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');

    if (!crp.trim()) {
      setError('Informe o CRP do psicólogo.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/setup', {
        name: name.trim(),
        crp: crp.trim(),
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
        Configure o sistema informando o nome do psicólogo,
        seu CRP e uma senha de acesso.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Nome completo do psicólogo</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label htmlFor="crp">CRP</label>
          <input
            id="crp"
            type="text"
            value={crp}
            onChange={(event) => setCrp(event.target.value)}
            placeholder="Ex.:00/12345"
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
            autoComplete="new-password"
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
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Configurando...' : 'Configurar sistema'}
        </button>
      </form>
    </main>
  );
}

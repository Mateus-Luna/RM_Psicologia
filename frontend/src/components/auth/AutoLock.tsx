import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { api } from '../../services/api';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
] as const;

export function AutoLock() {
  const [locked, setLocked] = useState(
  () => sessionStorage.getItem('renato_psic_locked') === 'true',
);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const timeoutRef = useRef<number | null>(null);

  const lock = useCallback(() => {
    sessionStorage.setItem('renato_psic_locked', 'true');

    setLocked(true);
    setPassword('');
    setError('');
    }, []);

  const resetTimer = useCallback(() => {
    if (locked) {
      return;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(
      lock,
      INACTIVITY_TIMEOUT,
    );
  }, [locked, lock]);

  useEffect(() => {
    if (locked) {
      return;
    }

    resetTimer();

    const handleActivity = () => {
      resetTimer();
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [locked, resetTimer]);

  async function handleUnlock(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      await api.post('/auth/unlock', {
        password,
      });

      sessionStorage.removeItem('renato_psic_locked');

      setPassword('');
      setLocked(false);
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) &&
        error.response?.data?.message
          ? error.response.data.message
          : 'Senha inválida.';

      setError(
        Array.isArray(message)
          ? message.join(', ')
          : String(message),
      );
    } finally {
      setLoading(false);
    }
  }

  if (!locked) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '32px',
          background: '#fff',
          borderRadius: '12px',
        }}
      >
        <h2 id="lock-title">Sistema bloqueado</h2>

        <p>
          Por segurança, o sistema foi bloqueado por
          inatividade.
        </p>

        <form onSubmit={handleUnlock}>
          <label htmlFor="unlock-password">
            Digite sua senha para continuar
          </label>

          <input
            id="unlock-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            required
          />

          {error && <p>{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Desbloqueando...' : 'Desbloquear'}
          </button>
        </form>
      </div>
    </div>
  );
}
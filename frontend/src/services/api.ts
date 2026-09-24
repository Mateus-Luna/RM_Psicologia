import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const rawSession = sessionStorage.getItem('renato_psic_session');

  if (rawSession) {
    try {
      const session = JSON.parse(rawSession);

      if (session.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
      }
    } catch {
      sessionStorage.removeItem('renato_psic_session');
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (
      typeof response.data === 'string' &&
      (response.data.trim().startsWith('<!doctype') ||
        response.data.trim().startsWith('<html'))
    ) {
      return Promise.reject(
        new Error('Resposta inesperada da API (documento HTML recebido).'),
      );
    }

    return response;
  },
);
import axios from 'axios';

export const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to reject unexpected HTML fallback responses from SPA server
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
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();

    if (url.includes('/auth/setup-status') && method === 'get') {
      const localUser = localStorage.getItem('rm_local_user');
      return {
        data: { configured: !!localUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }

    if (url.includes('/auth/setup') && method === 'post') {
      try {
        const body =
          typeof config.data === 'string'
            ? JSON.parse(config.data)
            : config.data || {};
        const user = {
          id: 'local_1',
          name: body.name || 'Psicólogo',
          password: body.password,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('rm_local_user', JSON.stringify(user));
        return {
          data: {
            id: user.id,
            name: user.name,
            createdAt: user.createdAt,
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      } catch {
        return Promise.reject(error);
      }
    }

    if (url.includes('/auth/login') && method === 'post') {
      try {
        const body =
          typeof config.data === 'string'
            ? JSON.parse(config.data)
            : config.data || {};
        const rawUser = localStorage.getItem('rm_local_user');
        if (!rawUser) {
          return Promise.reject({
            response: {
              data: { message: 'O sistema ainda não foi configurado.' },
              status: 401,
            },
          });
        }
        const user = JSON.parse(rawUser);
        if (user.password !== body.password) {
          return Promise.reject({
            response: {
              data: { message: 'Senha inválida.' },
              status: 401,
            },
          });
        }
        return {
          data: { id: user.id, name: user.name },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

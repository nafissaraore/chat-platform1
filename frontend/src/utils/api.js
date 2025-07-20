// frontend/src/utils/api.js
import axios from 'axios';

const api = axios.create({
baseURL: 'https://p6-groupeb.com/nafinode/chat_platform/api',
});

// Intercepteur pour ajouter le token et gérer les headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    // Ajoute le token si présent
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ne pas fixer Content-Type si c'est du FormData (Axios le gère)
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Gestion automatique de déconnexion si 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

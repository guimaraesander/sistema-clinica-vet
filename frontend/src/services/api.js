import axios from 'axios';

// Base do backend configurável via .env (Vite)
// Exemplos válidos:
// - VITE_API_URL=http://localhost:3001
// - VITE_API_URL=http://localhost:3001/api
const RAW_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const CLEAN_BASE = RAW_BASE.replace(/\/$/, '');
const baseURL = CLEAN_BASE.endsWith('/api') ? CLEAN_BASE : `${CLEAN_BASE}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// cybersport-cards/src/services/api.js

import axios from 'axios';

// Формируем базовый URL, сразу добавляя /api
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001') + '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена авторизации в каждый запрос
// Этот код у тебя уже есть и он правильный, оставляем его как есть
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
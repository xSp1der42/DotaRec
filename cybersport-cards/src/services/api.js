import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Interceptor для добавления токена авторизации в каждый запрос
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

// Response interceptor для централизованной обработки ошибок
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Enhance error object with additional information
    const enhancedError = {
      ...error,
      isNetworkError: !error.response,
      isTimeout: error.code === 'ECONNABORTED',
      isServerError: error.response?.status >= 500,
      isClientError: error.response?.status >= 400 && error.response?.status < 500,
      statusCode: error.response?.status,
      errorCode: error.response?.data?.error?.code,
      errorMessage: error.response?.data?.error?.message || error.message,
    };

    return Promise.reject(enhancedError);
  }
);

// Helper function to check if API is available
export const checkApiHealth = async () => {
  try {
    await api.get('/api/health', { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
};

// Helper function to retry failed requests
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.isClientError) {
        throw error;
      }
      
      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

export default api;
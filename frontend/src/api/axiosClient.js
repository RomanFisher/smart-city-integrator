// Konfiguracja klienta Axios do komunikacji z backendem
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor do automatycznego dołączania tokenu JWT do każdego żądania
axiosClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  } catch (error) {
    return config;
  }
});

export default axiosClient;

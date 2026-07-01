import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('swaddo_delivery_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === 'Network Error') {
      console.warn("Backend API is currently unreachable (Network Error). Suppressing to prevent app crash.");
      return Promise.resolve({ data: { success: false, data: null, message: "Network Error" } });
    }

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('swaddo_delivery_token');
        localStorage.removeItem('swaddo_delivery_phone');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

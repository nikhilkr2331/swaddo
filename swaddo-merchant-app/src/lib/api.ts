import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api'
});

api.interceptors.request.use(function (config) {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('swaddo_merchant_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('swaddo_merchant_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// --- Persistent Caching System for 0ms Loads ---
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCache = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem('swaddo_api_cache_' + key);
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem('swaddo_api_cache_' + key);
      return null;
    }
    return parsed.data;
  } catch (e) {
    return null;
  }
};

const setCache = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('swaddo_api_cache_' + key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    // Ignore quota errors
  }
};

const clearCache = () => {
  if (typeof window === 'undefined') return;
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('swaddo_api_cache_')) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
};

const originalGet = api.get;
const originalPost = api.post;
const originalPut = api.put;
const originalDelete = api.delete;
const originalPatch = api.patch;

api.get = async function(url: string, config?: any) {
  if (!config || config.cache !== false) {
    const key = btoa(url + JSON.stringify(config?.params || {}));
    
    // 1. Try returning cached data immediately for 0ms loading
    const cachedData = getCache(key);
    if (cachedData) {
      // Still fetch in background to keep data fresh (Stale-While-Revalidate pattern)
      originalGet.call(this, url, config).then((response: any) => {
        setCache(key, response.data);
      }).catch(() => {});
      
      return Promise.resolve({ 
        data: cachedData, 
        status: 200, 
        statusText: 'OK', 
        headers: {}, 
        config: {} 
      } as any);
    }
    
    // 2. No cache, fetch and store
    const response = await originalGet.call(this, url, config);
    setCache(key, response.data);
    return response;
  }
  return originalGet.call(this, url, config);
} as any;

// Invalidate cache on mutations
api.post = async function(url: string, data?: any, config?: any) { clearCache(); return originalPost.call(this, url, data, config); } as any;
api.put = async function(url: string, data?: any, config?: any) { clearCache(); return originalPut.call(this, url, data, config); } as any;
api.delete = async function(url: string, config?: any) { clearCache(); return originalDelete.call(this, url, config); } as any;
api.patch = async function(url: string, data?: any, config?: any) { clearCache(); return originalPatch.call(this, url, data, config); } as any;

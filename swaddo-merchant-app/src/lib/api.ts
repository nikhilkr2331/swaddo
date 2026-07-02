import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('swaddo_merchant_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('swaddo_merchant_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- In-Memory Caching System ---
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const originalGet = api.get;
const originalPost = api.post;
const originalPut = api.put;
const originalDelete = api.delete;
const originalPatch = api.patch;

api.get = async function(url: string, config?: any) {
  if (!config || config.cache !== false) {
    const key = url + JSON.stringify(config?.params || {});
    const cachedItem = cache.get(key);
    
    if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_TTL)) {
      return Promise.resolve({ 
        data: cachedItem.data, 
        status: 200, 
        statusText: 'OK', 
        headers: {}, 
        config: {} 
      } as any);
    }
    
    const response = await originalGet.call(this, url, config);
    cache.set(key, { data: response.data, timestamp: Date.now() });
    return response;
  }
  return originalGet.call(this, url, config);
} as any;

const clearCache = () => cache.clear();

// Invalidate cache on mutations
api.post = async function(url: string, data?: any, config?: any) { clearCache(); return originalPost.call(this, url, data, config); } as any;
api.put = async function(url: string, data?: any, config?: any) { clearCache(); return originalPut.call(this, url, data, config); } as any;
api.delete = async function(url: string, config?: any) { clearCache(); return originalDelete.call(this, url, config); } as any;
api.patch = async function(url: string, data?: any, config?: any) { clearCache(); return originalPatch.call(this, url, data, config); } as any;

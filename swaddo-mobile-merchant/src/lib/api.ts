import axios from 'axios';
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

// Replace with your actual backend IP/URL when testing on physical device (e.g., http://192.168.x.x:5005/api)
export const api = axios.create({
  baseURL: 'http://localhost:5005/api', // Use local IP if using physical device
});

api.interceptors.request.use((config) => {
  const token = storage.getString('swaddo_merchant_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      storage.delete('swaddo_merchant_token');
      // In React Native, we handle redirection via a navigation state or an event emitter, not window.location
      // TODO: Emit logout event
    }
    return Promise.reject(error);
  }
);

// --- Persistent Caching System using MMKV for 0ms Loads ---
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCache = (key: string) => {
  try {
    const item = storage.getString('swaddo_api_cache_' + key);
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      storage.delete('swaddo_api_cache_' + key);
      return null;
    }
    return parsed.data;
  } catch (e) {
    return null;
  }
};

const setCache = (key: string, data: any) => {
  try {
    storage.set('swaddo_api_cache_' + key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    // Ignore quota errors
  }
};

const clearCache = () => {
  const keys = storage.getAllKeys();
  keys.forEach(k => {
    if (k.startsWith('swaddo_api_cache_')) {
      storage.delete(k);
    }
  });
};

const originalGet = api.get;
const originalPost = api.post;
const originalPut = api.put;
const originalDelete = api.delete;
const originalPatch = api.patch;

// Utility for encoding base64 in RN without `btoa`
const btoa = (input: string) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input;
  let output = '';
  for (let block = 0, charCode, i = 0, map = chars;
  str.charAt(i | 0) || (map = '=', i % 1);
  output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
    charCode = str.charCodeAt(i += 3/4);
    block = block << 8 | charCode;
  }
  return output;
};

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

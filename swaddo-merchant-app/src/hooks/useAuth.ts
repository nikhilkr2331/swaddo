import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('swaddo_merchant_token');
    if (!token || token.startsWith('mock_')) {
      if (token) localStorage.removeItem('swaddo_merchant_token');
      localStorage.setItem('swaddo_redirect_to', pathname);
      router.push('/login');
    }
  }, [router, pathname]);
}

export function requireAuth(router: any, intendedPath: string): boolean {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('swaddo_merchant_token');
    if (!token || token.startsWith('mock_')) {
      if (token) localStorage.removeItem('swaddo_merchant_token');
      localStorage.setItem('swaddo_redirect_to', intendedPath);
      router.push('/login');
      return false;
    }
    return true;
  }
  return false;
}

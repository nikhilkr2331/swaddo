import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('swaddo_delivery_token');
    if (!token || token.startsWith('mock_')) {
      if (token) localStorage.removeItem('swaddo_delivery_token');
      localStorage.setItem('swaddo_redirect_to', pathname);
      router.push('/login');
      return;
    }
      
    // Strict Active Delivery Lock
    const activeDelivery = localStorage.getItem('activeDelivery');
    if (activeDelivery && !pathname.startsWith('/active-delivery')) {
      // If they have an active delivery but aren't on the delivery screen, force them back
      router.push(`/active-delivery?id=${activeDelivery}`);
      return;
    }
      
    // Ensure redirect mapping handles login -> appropriate page
    if (pathname === '/login') {
      const redirectTo = localStorage.getItem('swaddo_redirect_to') || '/home';
      localStorage.removeItem('swaddo_redirect_to');
      router.push(redirectTo);
    }
  }, [pathname, router]);
}

export function requireAuth(router: any, intendedPath: string): boolean {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('swaddo_delivery_token');
    if (!token || token.startsWith('mock_')) {
      if (token) localStorage.removeItem('swaddo_delivery_token');
      localStorage.setItem('swaddo_redirect_to', intendedPath);
      router.push('/login');
      return false;
    }
    return true;
  }
  return false;
}

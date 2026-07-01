"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from './LocationContext';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isVeg?: boolean;
  markup?: number;
};

type CartState = {
  stallId: string | null;
  stallName: string | null;
  items: CartItem[];
};

type CartContextType = {
  cart: CartState;
  updateQuantity: (stallId: string, stallName: string, item: Omit<CartItem, 'quantity'>, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
  conflictModal: { isOpen: boolean; pendingStallId: string; pendingStallName: string; pendingItem: Omit<CartItem, 'quantity'> | null; delta: number } | null;
  resolveConflict: (clearCurrent: boolean) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>({ stallId: null, stallName: null, items: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [conflictModal, setConflictModal] = useState<CartContextType['conflictModal']>(null);
  const { resetToLiveLocation } = useLocation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 5-minute abandoned cart timeout (300,000 ms)
  const resetInactivityTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Only set timer if cart has items
    if (cart.items.length > 0) {
      timeoutRef.current = setTimeout(() => {
        setCart({ stallId: null, stallName: null, items: [] });
        resetToLiveLocation();
      }, 5 * 60 * 1000);
    }
  };

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [cart.items]); // re-run whenever items change

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('swaddo_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load cart", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('swaddo_cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const updateQuantity = (stallId: string, stallName: string, item: Omit<CartItem, 'quantity'>, delta: number) => {
    // Check for cross-stall conflict
    if (cart.stallId && cart.stallId !== stallId && cart.items.length > 0) {
      setConflictModal({
        isOpen: true,
        pendingStallId: stallId,
        pendingStallName: stallName,
        pendingItem: item,
        delta
      });
      return;
    }

    setCart(prev => {
      const existingItemIndex = prev.items.findIndex(i => i.id === item.id);
      let newItems = [...prev.items];

      if (existingItemIndex >= 0) {
        const newQty = Math.max(0, newItems[existingItemIndex].quantity + delta);
        if (newQty === 0) {
          newItems.splice(existingItemIndex, 1);
        } else {
          newItems[existingItemIndex] = { ...newItems[existingItemIndex], quantity: newQty };
        }
      } else if (delta > 0) {
        newItems.push({ ...item, quantity: delta });
      }

      // If cart is empty after update, clear stall info
      if (newItems.length === 0) {
        return { stallId: null, stallName: null, items: [] };
      }

      return {
        stallId,
        stallName,
        items: newItems
      };
    });
  };

  const resolveConflict = (clearCurrent: boolean) => {
    if (clearCurrent && conflictModal?.pendingItem) {
      // Clear cart and add new item
      setCart({
        stallId: conflictModal.pendingStallId,
        stallName: conflictModal.pendingStallName,
        items: [{ ...conflictModal.pendingItem, quantity: Math.max(0, conflictModal.delta) }]
      });
    }
    setConflictModal(null);
  };

  const clearCart = () => setCart({ stallId: null, stallName: null, items: [] });

  const cartTotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  // We render children immediately to prevent blank screen, state will update on client

  return (
    <CartContext.Provider value={{ cart, updateQuantity, clearCart, cartTotal, cartItemCount, conflictModal, resolveConflict }}>
      {children}
      
      {/* Global Conflict Modal */}
      {conflictModal?.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-heading font-bold text-lg mb-2 text-text-primary">Replace cart item?</h3>
            <p className="text-text-muted text-sm mb-6 leading-relaxed">
              Your cart contains items from <span className="font-bold text-text-primary">{cart.stallName}</span>. 
              Do you want to discard the selection and add dishes from <span className="font-bold text-text-primary">{conflictModal.pendingStallName}</span>?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => resolveConflict(false)}
                className="flex-1 py-3 font-bold text-text-primary border border-border-subtle rounded-xl hover:bg-gray-50 transition-colors"
              >
                No
              </button>
              <button 
                onClick={() => resolveConflict(true)}
                className="flex-1 py-3 font-bold text-white bg-primary rounded-xl hover:bg-primary-hover transition-colors shadow-md"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

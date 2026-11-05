'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CoffeeProduct, CartItem } from '@/types/coffee';

interface CartContextType {
  items: CartItem[];
  addItem: (product: CoffeeProduct, grindOption?: CartItem['grindOption'], quantity?: number, openDrawer?: boolean) => void;
  removeItem: (productId: string, grindOption: CartItem['grindOption']) => void;
  updateQuantity: (productId: string, grindOption: CartItem['grindOption'], quantity: number) => void;
  updateGrind: (productId: string, oldGrind: CartItem['grindOption'], newGrind: CartItem['grindOption']) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isSommelierOpen: boolean;
  setIsSommelierOpen: (open: boolean) => void;
  sommelierTab: 'chat' | 'quiz';
  setSommelierTab: (tab: 'chat' | 'quiz') => void;
  selectedCoffeeForSommelier: CoffeeProduct | null;
  clearSelectedCoffeeForSommelier: () => void;
  openSommelierWithCoffee: (coffee?: CoffeeProduct, tab?: 'chat' | 'quiz') => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSommelierOpen, setIsSommelierOpen] = useState(false);
  const [sommelierTab, setSommelierTab] = useState<'chat' | 'quiz'>('chat');
  const [selectedCoffeeForSommelier, setSelectedCoffeeForSommelier] = useState<CoffeeProduct | null>(null);

  // Cargar carrito de localStorage
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem('aura_cart');
        if (saved) {
          setItems(JSON.parse(saved));
        }
      } catch {
        // Ignorar errores de localStorage
      } finally {
        setIsHydrated(true);
      }
    });
  }, []);

  // Guardar en localStorage solo después de hidratar
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('aura_cart', JSON.stringify(items));
    } catch {
      // Ignorar
    }
  }, [items, isHydrated]);

  // Cerrar modales con tecla Escape y bloquear scroll del body
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSommelierOpen) setIsSommelierOpen(false);
        if (isCartOpen) setIsCartOpen(false);
      }
    };

    if (isSommelierOpen || isCartOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSommelierOpen, isCartOpen]);

  const removeItem = useCallback((productId: string, grindOption: CartItem['grindOption']) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.grindOption === grindOption)
      )
    );
  }, []);

  const addItem = useCallback(
    (
      product: CoffeeProduct,
      grindOption: CartItem['grindOption'] = 'Grano Entero',
      quantity: number = 1,
      openDrawer: boolean = true
    ) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.product.id === product.id && item.grindOption === grindOption
        );
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
          };
          return updated;
        }
        return [...prev, { product, grindOption, quantity }];
      });
      if (openDrawer) {
        setIsCartOpen(true);
      }
    },
    []
  );

  const updateQuantity = useCallback(
    (
      productId: string,
      grindOption: CartItem['grindOption'],
      quantity: number
    ) => {
      if (quantity <= 0) {
        removeItem(productId, grindOption);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.product.id === productId && item.grindOption === grindOption
            ? { ...item, quantity }
            : item
        )
      );
    },
    [removeItem]
  );

  const updateGrind = useCallback(
    (
      productId: string,
      oldGrind: CartItem['grindOption'],
      newGrind: CartItem['grindOption']
    ) => {
      if (oldGrind === newGrind) return;
      setItems((prev) => {
        const target = prev.find((i) => i.product.id === productId && i.grindOption === oldGrind);
        if (!target) return prev;
        const existingNew = prev.find((i) => i.product.id === productId && i.grindOption === newGrind);
        if (existingNew) {
          return prev
            .filter((i) => !(i.product.id === productId && i.grindOption === oldGrind))
            .map((i) =>
              i.product.id === productId && i.grindOption === newGrind
                ? { ...i, quantity: i.quantity + target.quantity }
                : i
            );
        }
        return prev.map((i) =>
          i.product.id === productId && i.grindOption === oldGrind
            ? { ...i, grindOption: newGrind }
            : i
        );
      });
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const clearSelectedCoffeeForSommelier = useCallback(() => {
    setSelectedCoffeeForSommelier(null);
  }, []);

  const openSommelierWithCoffee = useCallback((coffee?: CoffeeProduct, tab: 'chat' | 'quiz' = 'chat') => {
    setSelectedCoffeeForSommelier(coffee || null);
    setSommelierTab(coffee ? 'chat' : tab);
    setIsSommelierOpen(true);
  }, []);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  const contextValue = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateGrind,
      clearCart,
      totalItems,
      totalPrice,
      isCartOpen,
      setIsCartOpen,
      isSommelierOpen,
      setIsSommelierOpen,
      sommelierTab,
      setSommelierTab,
      selectedCoffeeForSommelier,
      clearSelectedCoffeeForSommelier,
      openSommelierWithCoffee,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateGrind,
      clearCart,
      totalItems,
      totalPrice,
      isCartOpen,
      isSommelierOpen,
      sommelierTab,
      selectedCoffeeForSommelier,
      clearSelectedCoffeeForSommelier,
      openSommelierWithCoffee,
    ]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

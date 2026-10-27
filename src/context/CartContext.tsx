'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CoffeeProduct, CartItem } from '@/types/coffee';

interface CartContextType {
  items: CartItem[];
  addItem: (product: CoffeeProduct, grindOption?: CartItem['grindOption'], quantity?: number) => void;
  removeItem: (productId: string, grindOption: CartItem['grindOption']) => void;
  updateQuantity: (productId: string, grindOption: CartItem['grindOption'], quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isSommelierOpen: boolean;
  setIsSommelierOpen: (open: boolean) => void;
  selectedCoffeeForSommelier: CoffeeProduct | null;
  openSommelierWithCoffee: (coffee?: CoffeeProduct) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSommelierOpen, setIsSommelierOpen] = useState(false);
  const [selectedCoffeeForSommelier, setSelectedCoffeeForSommelier] = useState<CoffeeProduct | null>(null);

  // Cargar carrito de localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aura_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // Ignorar errores de localStorage
    }
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aura_cart', JSON.stringify(items));
    } catch {
      // Ignorar
    }
  }, [items]);

  const addItem = (
    product: CoffeeProduct,
    grindOption: CartItem['grindOption'] = 'Grano Entero',
    quantity: number = 1
  ) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.grindOption === grindOption
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { product, grindOption, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeItem = (productId: string, grindOption: CartItem['grindOption']) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.grindOption === grindOption)
      )
    );
  };

  const updateQuantity = (
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
  };

  const clearCart = () => setItems([]);

  const openSommelierWithCoffee = (coffee?: CoffeeProduct) => {
    setSelectedCoffeeForSommelier(coffee || null);
    setIsSommelierOpen(true);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
        isSommelierOpen,
        setIsSommelierOpen,
        selectedCoffeeForSommelier,
        openSommelierWithCoffee,
      }}
    >
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

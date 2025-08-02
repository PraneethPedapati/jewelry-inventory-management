import React, { createContext, useState, useCallback } from 'react';

// Types for cart items and products
export interface Product {
  id: string;
  productCode: string;
  name: string;
  description: string;
  productType: string;
  categoryId?: string;
  price: string;
  discountedPrice?: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  size?: string; // Simple size string for bracelet products
  quantity: number;
  price: number;
}

// Context interface
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, price: number, size?: string) => void;
  updateQuantity: (productId: string, newQuantity: number, size?: string) => void;
  removeFromCart: (productId: string, size?: string) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  clearCart: () => void;
  isInCart: (productId: string, size?: string) => boolean;
}

// Create context
export const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart provider component
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Add item to cart
  const addToCart = useCallback((product: Product, quantity: number, price: number, size?: string) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        item => item.product.id === product.id && item.size === size
      );

      if (existingItemIndex > -1) {
        // Item exists, update quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
        return updatedCart;
      } else {
        // New item, add to cart
        return [...prevCart, { product, size, quantity, price } as CartItem];
      }
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((productId: string, size?: string) => {
    setCart(prevCart =>
      prevCart.filter(
        item => !(item.product.id === productId && item.size === size)
      )
    );
  }, []);

  // Update quantity of existing item
  const updateQuantity = useCallback((productId: string, newQuantity: number, size?: string) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, size);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId && item.size === size
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }, [removeFromCart]);

  // Calculate total price
  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  // Calculate total unique products (not total quantity)
  const getTotalItems = useCallback(() => {
    return cart.length;
  }, [cart]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Check if item is in cart
  const isInCart = useCallback((productId: string, size?: string) => {
    return cart.some(
      item => item.product.id === productId && item.size === size
    );
  }, [cart]);

  const value: CartContextType = {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
    getTotalItems,
    clearCart,
    isInCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 

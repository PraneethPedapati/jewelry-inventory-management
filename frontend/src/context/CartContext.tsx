import React, { createContext, useContext, useState, useCallback } from 'react';

// Types for cart items and products
export interface Product {
  id: string; // Changed to string for UUID compatibility
  name: string;
  images: string[];
  category: string;
  description?: string;
}

export interface ProductSpecification {
  id: string; // Changed to string for UUID compatibility
  displayName: string;
  value: string;
  type: 'size' | 'layer' | 'material' | 'color';
}

export interface CartItem {
  product: Product;
  specification: ProductSpecification;
  quantity: number;
  price: number;
}

// Context interface
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, specification: ProductSpecification, quantity: number, price: number) => void;
  updateQuantity: (productId: string, specificationId: string, newQuantity: number) => void;
  removeFromCart: (productId: string, specificationId: string) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  clearCart: () => void;
  isInCart: (productId: string, specificationId: string) => boolean;
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Cart provider component
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Add item to cart
  const addToCart = useCallback((product: Product, specification: ProductSpecification, quantity: number, price: number) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        item => item.product.id === product.id && item.specification.id === specification.id
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
        return [...prevCart, { product, specification, quantity, price }];
      }
    });
  }, []);

  // Update quantity of existing item
  const updateQuantity = useCallback((productId: string, specificationId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, specificationId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId && item.specification.id === specificationId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((productId: string, specificationId: string) => {
    setCart(prevCart =>
      prevCart.filter(
        item => !(item.product.id === productId && item.specification.id === specificationId)
      )
    );
  }, []);

  // Calculate total price
  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  // Calculate total items
  const getTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Check if item is in cart
  const isInCart = useCallback((productId: string, specificationId: string) => {
    return cart.some(
      item => item.product.id === productId && item.specification.id === specificationId
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

export default CartContext; 

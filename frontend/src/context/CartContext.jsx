import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as api from "./api.js";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], subtotal: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [lastAdded, setLastAdded] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.fetchCart();
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async (productId, quantity, size, color) => {
    const data = await api.addToCart({ productId, quantity, size, color });
    setCart(data);
    setLastAdded({ productId, ts: Date.now() });
    return data;
  };

  const updateQuantity = async (index, quantity) => {
    const data = await api.updateCartItem(index, quantity);
    setCart(data);
  };

  const remove = async (index) => {
    const data = await api.removeCartItem(index);
    setCart(data);
  };

  return (
    <CartContext.Provider value={{ cart, loading, add, updateQuantity, remove, refresh, lastAdded }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans CartProvider");
  return ctx;
}

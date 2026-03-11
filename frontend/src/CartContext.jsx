import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CART_STORAGE_KEY = 'nfc_store_cart';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, quantity = 1) => {
    const parsedQuantity = Number(quantity);
    if (!product?.id || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return;
    }

    setItems((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing) {
        return current.map((item) => (
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + parsedQuantity }
            : item
        ));
      }

      return [
        ...current,
        {
          product_id: product.id,
          nfc_tag_id: product.nfc_tag_id,
          name: product.name,
          price: Number(product.price),
          image: product.image || null,
          stock_quantity: Number(product.stock_quantity ?? 0),
          quantity: parsedQuantity,
        },
      ];
    });
  };

  const setCartItemQuantity = (productId, quantity) => {
    const parsedQuantity = Number(quantity);
    if (Number.isNaN(parsedQuantity)) {
      return;
    }

    if (parsedQuantity <= 0) {
      setItems((current) => current.filter((item) => item.product_id !== productId));
      return;
    }

    setItems((current) => current.map((item) => (
      item.product_id === productId ? { ...item, quantity: parsedQuantity } : item
    )));
  };

  const removeFromCart = (productId) => {
    setItems((current) => current.filter((item) => item.product_id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0),
    [items],
  );

  const value = {
    items,
    addToCart,
    setCartItemQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalAmount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

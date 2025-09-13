import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = (item) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === item.id);
      if (idx === -1) return [...prev, { ...item, qty: item.qty ?? 1 }];
      const next = [...prev];
      next[idx] = { ...next[idx], qty: (next[idx].qty ?? 1) + (item.qty ?? 1) };
      return next;
    });
  };

  const removeItem = (id, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const newQty = (next[idx].qty ?? 1) - qty;
      if (newQty <= 0) next.splice(idx, 1);
      else next[idx] = { ...next[idx], qty: newQty };
      return next;
    });
  };

  const clear = () => setItems([]);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.price ?? 0) * Number(item.qty ?? 1),
        0
      ),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, clear, total }),
    [items, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
};

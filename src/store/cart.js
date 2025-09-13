import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ title, layerHeight, layers, currentLayer, heightMM, price }]

  const addItem = (item) => setItems((p) => [...p, item]);
  const removeItem = (idx) => setItems((p) => p.filter((_, i) => i !== idx));
  const clear = () => setItems([]);
  const total = useMemo(
    () => items.reduce((s, i) => s + (i.price || 0), 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

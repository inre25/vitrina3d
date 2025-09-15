// src/store/cart.js
import { create } from "zustand";

export const useCart = create((set, get) => ({
  items: [],
  addItem: (item) => {
    const it = { qty: 1, ...item };
    set({ items: [...get().items, it] });
  },
  clearCart: () => set({ items: [] }),
}));

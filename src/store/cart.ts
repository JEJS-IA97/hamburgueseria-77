import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dish } from '../data';

export type CartLine = { dish: Dish; qty: number; extras: string[]; promotion_id?: string };

type Cart = {
  lines: CartLine[];
  open: boolean;
  add: (dish: Dish, extras?: string[], promotionId?: string) => void;
  qty: (id: string, extras: string[], by: number) => void;
  remove: (id: string, extras: string[]) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

const sameLine = (line: CartLine, id: string, extras: string[]) => line.dish.id === id && line.extras.join('|') === extras.join('|');

// Igual que en LM Perfumes: agregar abre el carrito lateral; solo se guardan las líneas, no si está abierto.
export const useCart = create<Cart>()(persist((set) => ({
  lines: [],
  open: false,
  add: (dish, extras = [], promotionId) => set(s => {
    const old = s.lines.find(l => l.dish.id === dish.id && l.promotion_id === promotionId && l.extras.join('|') === extras.join('|'));
    const lines = old
      ? s.lines.map(l => l === old ? { ...l, qty: l.qty + 1 } : l)
      : [...s.lines, { dish, qty: 1, extras, ...(promotionId ? { promotion_id: promotionId } : {}) }];
    return { lines, open: true };
  }),
  qty: (id, extras, by) => set(s => ({ lines: s.lines.map(l => sameLine(l, id, extras) ? { ...l, qty: l.qty + by } : l).filter(l => l.qty > 0) })),
  remove: (id, extras) => set(s => ({ lines: s.lines.filter(l => !sameLine(l, id, extras)) })),
  clear: () => set({ lines: [] }),
  setOpen: open => set({ open }),
}), { name: 'h77-cart', partialize: s => ({ lines: s.lines }) }));

/** Precio de una línea con sus extras (mismo cálculo que el checkout). */
export const lineTotal = (line: CartLine) =>
  ((line.dish.price_clp ?? 0) + line.extras.reduce((sum, name) => sum + (line.dish.extras.find(extra => extra.name === name)?.price_clp ?? 0), 0)) * line.qty;
export const cartTotal = (lines: CartLine[]) => lines.reduce((sum, line) => sum + lineTotal(line), 0);
export const cartCount = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.qty, 0);

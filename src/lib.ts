export const formatCLP = (value: number | null | undefined) => value == null
  ? 'Precio por definir'
  : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);

export const formatDishPrice = (dish: { price_clp: number | null; price_min_clp?: number | null; price_max_clp?: number | null }) =>
  dish.price_clp != null ? formatCLP(dish.price_clp)
    : dish.price_min_clp != null && dish.price_max_clp != null
      ? `${formatCLP(dish.price_min_clp)} – ${formatCLP(dish.price_max_clp)}`
      : formatCLP(null);

export type Theme = 'light' | 'dark';

export function getInitialTheme(): Theme {
  const saved = localStorage.getItem('h77-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('h77-theme', theme);
}

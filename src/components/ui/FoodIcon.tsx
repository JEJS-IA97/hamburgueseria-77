import type { ReactNode } from 'react';
import { Coffee, CupSoda, Drumstick, Percent, Pizza, Salad, Sandwich, UtensilsCrossed, type LucideProps } from 'lucide-react';

/* Iconos propios (mismo trazo que Lucide) para lo que Lucide no tiene: hamburguesa, completo y papas fritas. */
function Svg({ size = 24, strokeWidth = 2, children, ...props }: LucideProps & { children: ReactNode }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

const Burger = (p: LucideProps) => (
  <Svg {...p}>
    <path d="M4 10a8 6 0 0 1 16 0z" />
    <path d="M3 13.5c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" />
    <path d="M4 17h16a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" />
  </Svg>
);

const HotDog = (p: LucideProps) => (
  <Svg {...p}>
    <path d="M4.5 9.5A2.5 2.5 0 0 0 2 12c0 3 2.5 5 5 5h10c2.5 0 5-2 5-5a2.5 2.5 0 0 0-2.5-2.5" />
    <rect x="3" y="7" width="18" height="5" rx="2.5" />
    <path d="M6 9.5c1-.8 2-.8 3 0s2 .8 3 0 2-.8 3 0 2 .8 3 0" />
  </Svg>
);

const Fries = (p: LucideProps) => (
  <Svg {...p}>
    <path d="M5 11h14l-1.6 9.2a1 1 0 0 1-1 .8H7.6a1 1 0 0 1-1-.8z" />
    <path d="M8 11V5" /><path d="M11 11V3" /><path d="M14 11V4" /><path d="M17 11V6" />
  </Svg>
);

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('es');

/** Icono que representa la categoría. Si no hay uno fiel, cubiertos genéricos (nunca un producto distinto). */
export function FoodIcon({ category, ...props }: LucideProps & { category: string }) {
  const c = normalize(category);
  if (c.includes('hamburgues')) return <Burger {...props} />;
  if (c.includes('completo')) return <HotDog {...props} />;
  if (c.includes('pizza')) return <Pizza {...props} />;
  // Antes que las papas: «2 Churrascos + Papas Fritas» es un combo de sándwiches.
  if (/sandwich|mechada|pepito|churrasco|lomito|barros|chacarero|^as$/.test(c)) return <Sandwich {...props} />;
  if (c.includes('pollo') || c.includes('tutito')) return <Drumstick {...props} />;
  if (c.includes('fritura') || c.includes('chorrillana') || c.includes('papa')) return <Fries {...props} />;
  if (c.includes('bebida')) return <CupSoda {...props} />;
  if (c.includes('cafe')) return <Coffee {...props} />;
  if (c.includes('saludable') || c.includes('bowl') || c.includes('ensalada')) return <Salad {...props} />;
  if (c.includes('promo') || c.includes('combo')) return <Percent {...props} />;
  return <UtensilsCrossed {...props} />;
}

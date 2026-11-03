import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

/** <select> nativo (teclado y móvil gratis) con la misma altura que los inputs y flecha propia centrada. */
export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={`select ${className}`}>
      <select className="input" {...props}>{children}</select>
      <ChevronDown className="select__chevron" size={18} aria-hidden="true" />
    </span>
  );
}

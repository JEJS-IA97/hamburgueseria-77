import { useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Fila con scroll horizontal y flechas que dan la vuelta en los extremos. */
export function Carousel({ children, className = '', label }: { children: ReactNode; className?: string; label: string }) {
  const track = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (direction === 1 && el.scrollLeft >= max - 4) return el.scrollTo({ left: 0, behavior: 'smooth' });
    if (direction === -1 && el.scrollLeft <= 4) return el.scrollTo({ left: max, behavior: 'smooth' });
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <div className={`carousel ${className}`}>
      <div className="carousel__track" ref={track} role="region" aria-label={label} tabIndex={0}>{children}</div>
      <div className="carousel__nav">
        <button className="icon-btn icon-btn--float" type="button" onClick={() => scroll(-1)} aria-label="Anterior"><ChevronLeft size={20} /></button>
        <button className="icon-btn icon-btn--float" type="button" onClick={() => scroll(1)} aria-label="Siguiente"><ChevronRight size={20} /></button>
      </div>
    </div>
  );
}

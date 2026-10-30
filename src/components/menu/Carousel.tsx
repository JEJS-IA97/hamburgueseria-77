import { useRef, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function Carousel({ children, className = '' }: { children: ReactNode; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (direction: -1 | 1) => {
    if (!track.current) return;
    track.current.scrollBy({ left: direction * track.current.clientWidth * 0.82, behavior: 'smooth' });
  };
  return <div className={`carousel-shell ${className}`}>
    <button className="carousel-arrow carousel-arrow-prev" onClick={() => scroll(-1)} aria-label="Desplazar hacia la izquierda"><ArrowLeft size={18} /></button>
    <div className="carousel-track" ref={track}>{children}</div>
    <button className="carousel-arrow carousel-arrow-next" onClick={() => scroll(1)} aria-label="Desplazar hacia la derecha"><ArrowRight size={18} /></button>
  </div>;
}

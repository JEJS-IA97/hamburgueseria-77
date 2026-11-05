import { LoaderCircle } from 'lucide-react';

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return <div className="load-state" role="status" aria-live="polite">
    <LoaderCircle className="load-state__icon" size={24} aria-hidden="true" />
    <span>{label}</span>
  </div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="load-error" role="alert">
    <p>{message}</p>
    {onRetry && <button className="btn btn-outline" type="button" onClick={onRetry}>Intentar de nuevo</button>}
  </div>;
}

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getDishes } from '../api/catalog';
import { type Dish } from '../data';
import { DishCard } from '../components/product/DishCard';
import { ErrorState, LoadingState } from '../components/ui/LoadState';

export function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q')?.trim() ?? '';
  const [menu, setMenu] = useState<Dish[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus('loading');
    getDishes().then(data => { if (active) { setMenu(data); setStatus('ready'); } })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [attempt]);
  const results = useMemo(() => {
    const term = query.toLocaleLowerCase('es');
    return menu.filter(dish => dish.available && `${dish.name} ${dish.category} ${dish.description} ${dish.ingredients.join(' ')}`.toLocaleLowerCase('es').includes(term));
  }, [menu, query]);

  return <main className="container page">
    <Link to="/#menu" className="back-link"><ArrowLeft size={18} /> Volver al menú</Link>
    <header className="page-head">
      <h1 className="display">Buscaste <em>“{query}”</em></h1>
      <p className="muted">{results.length} {results.length === 1 ? 'resultado' : 'resultados'}</p>
    </header>
    {status === 'loading' ? <LoadingState label="Buscando en el menú…" />
      : status === 'error' ? <ErrorState message="No pudimos buscar platos en el servidor." onRetry={() => setAttempt(value => value + 1)} />
      : results.length
      ? <div className="grid">{results.map(dish => <DishCard key={dish.id} dish={dish} />)}</div>
      : <p className="empty-state">No encontramos platos con ese nombre. Prueba con otro término.</p>}
  </main>;
}

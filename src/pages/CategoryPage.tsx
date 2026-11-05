import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { type Dish } from '../data';
import { getDishes } from '../api/catalog';
import { DishCard } from '../components/product/DishCard';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import { NotFound } from './NotFound';

const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function CategoryPage() {
  const { slug = '' } = useParams();
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

  const category = useMemo(() => menu.find(dish => slugify(dish.category) === slug)?.category ?? '', [menu, slug]);
  const dishes = useMemo(() => menu.filter(dish => dish.available && dish.product_type !== 'combo' && dish.category === category), [menu, category]);

  if (status === 'ready' && !category) return <NotFound message="Esta categoría no existe o ya no está disponible." />;

  return <main className="container page">
    <Link to="/#menu" className="back-link"><ArrowLeft size={18} /> Volver al menú</Link>
    <header className="page-head">
      <h1 className="display">{category || 'Categoría'}</h1>
      <p className="muted">{dishes.length} {dishes.length === 1 ? 'plato disponible' : 'platos disponibles'}</p>
    </header>
    {status === 'loading' ? <LoadingState label="Cargando la categoría…" />
      : status === 'error' ? <ErrorState message="No pudimos cargar los platos desde el servidor." onRetry={() => setAttempt(value => value + 1)} />
      : dishes.length
      ? <div className="grid">{dishes.map(dish => <DishCard key={dish.id} dish={dish} />)}</div>
      : <p className="empty-state">No hay platos disponibles en esta categoría.</p>}
  </main>;
}

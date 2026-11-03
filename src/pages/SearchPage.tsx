import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getDishes } from '../api/catalog';
import { type Dish } from '../data';
import { DishCard } from '../components/product/DishCard';

export function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q')?.trim() ?? '';
  const [menu, setMenu] = useState<Dish[]>([]);
  useEffect(() => { getDishes().then(setMenu).catch(() => setMenu([])); }, []);
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
    {results.length
      ? <div className="grid">{results.map(dish => <DishCard key={dish.id} dish={dish} />)}</div>
      : <p className="empty-state">No encontramos platos con ese nombre. Prueba con otro término.</p>}
  </main>;
}

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

  return <main className="search-page">
    <Link to="/" className="back-link"><ArrowLeft size={17} /> Volver al menú</Link>
    <div className="search-page-heading"><span className="catalog-eyebrow">RESULTADOS DEL MENÚ</span><h1>Buscaste <em>“{query}”</em></h1><p>{results.length} {results.length === 1 ? 'resultado' : 'resultados'}</p></div>
    {results.length ? <div className="search-results-grid">{results.map(dish => <DishCard key={dish.id} dish={dish} />)}</div> : <p className="empty-state">No encontramos platos con ese nombre. Prueba con otro término.</p>}
  </main>;
}

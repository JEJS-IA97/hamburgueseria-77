import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { type Dish } from '../data';
import { getDishes } from '../api/catalog';
import { DishCard } from '../components/product/DishCard';

const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function CategoryPage() {
  const { slug = '' } = useParams();
  const [menu, setMenu] = useState<Dish[]>([]);
  useEffect(() => { getDishes().then(setMenu).catch(() => setMenu([])); }, []);

  const category = useMemo(() => menu.find(dish => slugify(dish.category) === slug)?.category ?? '', [menu, slug]);
  const dishes = useMemo(() => menu.filter(dish => dish.available && dish.product_type !== 'combo' && dish.category === category), [menu, category]);

  return <main className="category-page">
    <div className="category-page-top"><Link to="/" className="back-link"><ArrowLeft size={17} /> Volver al menú</Link><span className="catalog-eyebrow">HAMBURGUESERÍA 77 · CARTA</span></div>
    <div className="category-page-heading"><div><h1>{category || 'Categoría'}</h1><p>{dishes.length} {dishes.length === 1 ? 'plato disponible' : 'platos disponibles'} para elegir.</p></div></div>
    {dishes.length ? <div className="category-page-grid">{dishes.map(dish => <DishCard key={dish.id} dish={dish} />)}</div> : <p className="empty-state">{category ? 'No hay platos disponibles en esta categoría.' : 'No encontramos esta categoría.'}</p>}
  </main>;
}

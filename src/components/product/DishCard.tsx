import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDishPrice } from '../../lib';
import { imageUrl, type Dish } from '../../data';
import { useCart } from '../../store/cart';
import { FoodIcon } from '../ui/FoodIcon';

/** Tarjeta del menú (AGENTS.md §6 y §11.3): foto cuadrada, nombre en una línea, precio y «+». */
export function DishCard({ dish }: { dish: Dish }) {
  const add = useCart(state => state.add);
  const [added, setAdded] = useState(false);
  const href = `/plato/${dish.id}`;
  const detail = [dish.size, dish.ingredients.join(', ') || dish.description].filter(Boolean).join(' · ');
  // Si hay que elegir algo o no hay precio exacto, el «+» lleva a la ficha en vez de añadir directo.
  const needsChoice = dish.price_clp == null || (dish.extra_selection_limit ?? 0) > 0 || dish.code === 'ARMABLE';

  const quickAdd = () => {
    add(dish, []);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="dish-card">
      <Link className="dish-card__media" to={href} tabIndex={-1} aria-hidden="true">
        {dish.image
          ? <img src={imageUrl(dish.image, 600)} alt="" loading="lazy" />
          : <span className="dish-card__placeholder"><FoodIcon category={dish.category} size={40} strokeWidth={1.5} /></span>}
      </Link>
      <div className="dish-card__body">
        <h3 className="dish-card__name truncate" title={dish.name}><Link to={href}>{dish.name}</Link></h3>
        <p className="dish-card__meta" title={detail}>{detail || dish.category}</p>
        <div className="dish-card__foot">
          <strong className="dish-card__price num">{formatDishPrice(dish)}</strong>
          {needsChoice
            ? <Link className="add-btn" to={href} aria-label={`Elegir opciones de ${dish.name}`}><Plus size={20} /></Link>
            : <button className="add-btn" type="button" onClick={quickAdd} aria-label={`Agregar ${dish.name} al carrito`}>{added ? <Check size={20} /> : <Plus size={20} />}</button>}
        </div>
      </div>
    </article>
  );
}

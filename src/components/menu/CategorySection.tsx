import { ChevronRight, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Dish } from '../../data';
import { DishCard } from '../product/DishCard';
import { FoodIcon } from '../ui/FoodIcon';
import { Carousel } from './Carousel';

type Props = { name: string; dishes: Dish[]; anchor: string };

const slugOf = (anchor: string) => `/categoria/${anchor.replace(/^categoria-/, '')}`;

export function CategorySection({ name, dishes, anchor }: Props) {
  if (!dishes.length) return null;
  return (
    <section className="section" id={anchor} aria-labelledby={`${anchor}-title`}>
      <div className="section-head">
        <h2 className="display" id={`${anchor}-title`}>{name}</h2>
        <Link to={slugOf(anchor)} className="section-head__link">Ver todo ({dishes.length}) <ChevronRight size={16} /></Link>
      </div>
      <Carousel label={name}>
        {dishes.slice(0, 8).map(dish => <div className="carousel__item" key={dish.id}><DishCard dish={dish} /></div>)}
      </Carousel>
    </section>
  );
}

/** Fila de categorías en círculos con icono y nombre debajo (ref-1, ref-7). Sin fotos genéricas. */
export function CategoryNav({ categories }: { categories: { name: string; anchor: string }[] }) {
  if (!categories.length) return null;
  return (
    <nav className="category-nav" id="categorias" aria-label="Categorías del menú">
      {categories.map(category => (
        <Link className="category-nav__item" key={category.anchor} to={slugOf(category.anchor)}>
          <span className="category-nav__icon"><FoodIcon category={category.name} size={30} strokeWidth={1.75} /></span>
          <span className="category-nav__label">{category.name}</span>
        </Link>
      ))}
      <a className="category-nav__item" href="/#promos">
        <span className="category-nav__icon category-nav__icon--promo"><Percent size={28} /></span>
        <span className="category-nav__label">Promos</span>
      </a>
    </nav>
  );
}

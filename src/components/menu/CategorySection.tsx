import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Dish } from '../../data';
import { categoryImage, imageUrl } from '../../data';
import { DishCard } from '../product/DishCard';
import { Carousel } from './Carousel';

type Props = { name: string; dishes: Dish[]; anchor: string };

export function CategorySection({ name, dishes, anchor }: Props) {
  if (!dishes.length) return null;
  const categoryHref = `/categoria/${anchor.replace(/^categoria-/, '')}`;
  return (
    <section className="catalog-section" id={anchor} aria-labelledby={`${anchor}-title`}>
      <div className="catalog-section-heading">
        <div>
          <h2 id={`${anchor}-title`}>{name}</h2>
        </div>
        <Link to={categoryHref} className="catalog-count">Ver toda la categoría <ArrowRight size={14} /></Link>
      </div>
      <Carousel className="dish-carousel">
        {dishes.slice(0, 6).map(dish => <div className="carousel-card" key={dish.id}><DishCard dish={dish} /></div>)}
      </Carousel>
    </section>
  );
}

export function CategoryNav({ categories }: { categories: { name: string; anchor: string }[] }) {
  return (
    <section className="category-browser" id="categorias" aria-label="Explora por categoría">
      <div className="category-browser-heading"><div><span className="catalog-eyebrow"></span><h2>ENCUENTRA TU <em>ANTOJO</em></h2></div><Link to="/" className="category-browser-all">Ver carta completa <ArrowRight size={14} /></Link></div>
      <Carousel className="category-carousel">
        <nav className="category-nav" aria-label="Categorías del menú">
          {categories.map(category => (
            <Link className="category-tile" key={category.anchor} to={`/categoria/${category.anchor.replace(/^categoria-/, '')}`} aria-label={`Ver platos de ${category.name}`}>
              <span className="category-image" style={{ backgroundImage: `url(${imageUrl(categoryImage(category.name), 200)})` }} />
              <b>{category.name}</b>
            </Link>
          ))}
          <Link className="category-tile category-tile-promo" to="/#promos" aria-label="Ver promociones"><span className="category-image category-image-promo">%</span><b>Promociones</b></Link>
        </nav>
      </Carousel>
    </section>
  );
}

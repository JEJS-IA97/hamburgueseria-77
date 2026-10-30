import { ArrowRight, Plus, Tag } from 'lucide-react';
import { formatCLP } from '../../lib';
import { useCart } from '../../store/cart';
import type { Dish } from '../../data';
import { Carousel } from './Carousel';

export type Promotion = {
  id: string;
  record_type: 'combo' | 'promotion';
  title: string;
  description: string;
  kind: 'weekly' | 'seasonal';
  price_clp: number | null;
  components: string[];
  payment_conditions: string;
};

export function PromotionSection({ promotions }: { promotions: Promotion[] }) {
  const add = useCart(state => state.add);
  const addCombo = (promo: Promotion) => {
    const combo: Dish = {
      id: promo.id,
      name: promo.title,
      category: 'Combos',
      description: promo.description,
      ingredients: [],
      price_clp: promo.price_clp,
      image: '',
      extras: [],
      available: true,
      product_type: 'combo',
      components: promo.components ?? [],
      payment_conditions: promo.payment_conditions,
    };
    add(combo, [], promo.id);
  };
  return (
    <section className="promotions-block" id="promos" aria-labelledby="promotions-title">
      <div className="promotions-heading">
        <div>
          <span className="catalog-eyebrow">PARA DISFRUTAR HOY</span>
          <h2 id="promotions-title">Combos y <em>promociones</em></h2>
          <p>Ofertas de la casa, con sus condiciones y detalles a la vista.</p>
        </div>
        <Tag size={26} aria-hidden="true" />
      </div>
      {promotions.length ? (
        <Carousel className="promotion-carousel">
          {promotions.map(promo => (
            <div className="carousel-card" key={promo.id}><article className="promotion-card">
              <div className="promotion-card-top"><span>{promo.record_type === 'combo' ? 'COMBO' : promo.kind === 'weekly' ? 'PROMO SEMANAL' : 'PROMO DE TEMPORADA'}</span><Tag size={17} /></div>
              <h3>{promo.title}</h3>
              {promo.description && <p>{promo.description}</p>}
              {promo.components?.length > 0 && <ul>{promo.components.map((item, index) => <li key={`${promo.id}-${index}`}>{item}</li>)}</ul>}
              {promo.payment_conditions && <small>{promo.payment_conditions}</small>}
              <div className="promotion-card-bottom">
                <strong>{promo.price_clp != null ? formatCLP(promo.price_clp) : 'Consultar'}</strong>
                {promo.record_type === 'combo' ? <button type="button" onClick={() => addCombo(promo)} disabled={promo.price_clp == null}>AGREGAR COMBO <Plus size={15} /></button> : <a href="#menu" aria-label={`Ver menú para ${promo.title}`}>VER MENÚ <ArrowRight size={14} /></a>}
              </div>
            </article></div>
          ))}
        </Carousel>
      ) : <div className="promotions-empty">Las próximas promociones aparecerán aquí.</div>}
    </section>
  );
}

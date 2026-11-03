import { Check, Plus, Wallet } from 'lucide-react';
import { useState } from 'react';
import { formatCLP } from '../../lib';
import { useCart } from '../../store/cart';
import type { Dish } from '../../data';
import { Carousel } from './Carousel';
import { FoodIcon } from '../ui/FoodIcon';

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

const norm = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, ' ').trim();
const isPayment = (text: string) => /\bpago\b|transferencia|efectivo/i.test(text);
const clean = (text: string) => text.replace(/^(notas?|incluye|opci[oó]n(es)?)\s*:\s*/i, '').replace(/^\((.*)\)\.?$/, '$1').replace(/[.;]+$/, '').trim();

/**
 * En Supabase la descripción suele ser los componentes unidos con «;» y la condición de pago se repite
 * dentro de los componentes. Aquí se arma una sola lista sin repeticiones: nada que ya diga el título,
 * nada repetido y el pago una sola vez, abajo.
 */
function contentOf(promo: Promotion) {
  const title = norm(promo.title);
  const source = promo.components?.length ? promo.components : promo.description.split(';');
  const seen = new Set<string>();
  const items: string[] = [];
  let payment = promo.payment_conditions?.trim() ?? '';
  for (const raw of source) {
    const text = clean(raw);
    const key = norm(text);
    if (!key || seen.has(key) || title.includes(key)) continue;
    seen.add(key);
    if (isPayment(text) && !/v[aá]lido solo/i.test(text)) { if (!payment) payment = text; continue; }
    items.push(text);
  }
  return { items, payment };
}

const tagOf = (promo: Promotion) => promo.record_type === 'combo' ? 'Combo' : promo.kind === 'weekly' ? 'Promo semanal' : 'Promo';

function PromoCard({ promo }: { promo: Promotion }) {
  const add = useCart(state => state.add);
  const [added, setAdded] = useState(false);
  const { items, payment } = contentOf(promo);
  // Solo los combos se pueden pedir: create_order() rechaza las promociones.
  const orderable = promo.record_type === 'combo' && promo.price_clp != null;

  const addCombo = () => {
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
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className={`promo-card${promo.kind === 'weekly' ? ' promo-card--weekly' : ''}`}>
      <div className="promo-card__head">
        <span className="promo-card__tag">{tagOf(promo)}</span>
        <span className="promo-card__icon"><FoodIcon category={promo.title} size={22} strokeWidth={1.75} /></span>
      </div>
      <h3 className="promo-card__title" title={promo.title}>{promo.title}</h3>
      {items.length > 0 && (
        <ul className="promo-card__items" title={items.join(' · ')}>
          {items.map(item => <li key={item}><Check size={16} strokeWidth={2.5} aria-hidden="true" />{item}</li>)}
        </ul>
      )}
      {payment && <p className="promo-card__pay"><Wallet size={15} aria-hidden="true" />{payment}</p>}
      <div className="promo-card__foot">
        <strong className="promo-card__price num">{formatCLP(promo.price_clp)}</strong>
        {orderable && (
          <button className="add-btn promo-card__add" type="button" onClick={addCombo} aria-label={`Agregar ${promo.title} al carrito`}>
            {added ? <Check size={22} /> : <Plus size={22} />}
          </button>
        )}
      </div>
    </article>
  );
}

export function PromotionSection({ promotions }: { promotions: Promotion[] }) {
  return (
    <section className="section" id="promos" aria-labelledby="promotions-title">
      <div className="section-head">
        <h2 className="display" id="promotions-title">Combos y <em>promos</em></h2>
      </div>
      {promotions.length
        ? <Carousel className="carousel--promos" label="Combos y promociones">
            {promotions.map(promo => <div className="carousel__item" key={promo.id}><PromoCard promo={promo} /></div>)}
          </Carousel>
        : <p className="empty-state">Las próximas promociones aparecerán aquí.</p>}
    </section>
  );
}

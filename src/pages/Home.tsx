import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, MapPin } from 'lucide-react';
import { type Dish } from '../data';
import { getDishes } from '../api/catalog';
import { CategoryNav, CategorySection } from '../components/menu/CategorySection';
import { PromotionSection, type Promotion } from '../components/menu/PromotionSection';
import { supabase } from '../lib/supabase';

const categoryOrder = ['Hamburguesas', 'Completos', 'Pizzas', 'Sándwiches', 'As', 'Bowls', 'Menú saludable', 'Bebidas', 'Mechadas', 'Pepitos', 'Chorrillanas', 'Frituras', 'Pollo Crispy', 'Cafetería'];
const categoryNavOrder = ['Hamburguesas', 'Pizzas', 'Completos', 'Bowls', 'Sándwiches', 'Bebidas', 'Menú saludable', 'As', 'Mechadas', 'Chorrillanas', 'Pepitos', 'Frituras', 'Pollo Crispy', 'Cafetería'];
const homeCategoryOrder = ['Hamburguesas', 'Completos', 'Pizzas', 'Sándwiches', 'As', 'Bowls', 'Menú saludable', 'Bebidas'];
const excludedCategories = new Set(['combos', 'promociones']);
const storeAddress = 'C. 1 Nte. 0115, 4780000 Labranza, Temuco, Araucanía, Chile';
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
const anchorFor = (name: string) => `categoria-${normalize(name).replace(/[^a-z0-9]+/g, '-')}`;

export function Home() {
  const [menu, setMenu] = useState<Dish[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const address = storeAddress;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  useEffect(() => {
    getDishes().then(setMenu).catch(() => setMenu([]));
    if (supabase) {
      supabase.from('promotions').select('id,title,description,kind,record_type,price_clp,components,payment_conditions').eq('active', true).then(({ data }) => setPromotions((data ?? []) as Promotion[]));
    }
  }, []);

  const available = useMemo(() => menu.filter(dish => dish.available), [menu]);
  const promoNames = useMemo(() => new Set(promotions.map(promo => normalize(promo.title))), [promotions]);
  const catalogDishes = useMemo(() => available.filter(dish => dish.product_type !== 'combo' && !excludedCategories.has(normalize(dish.category)) && !promoNames.has(normalize(dish.name))), [available, promoNames]);
  const activeCategories = useMemo(() => {
    const availableNames = new Set(catalogDishes.map(dish => dish.category));
    return [...availableNames].sort((a, b) => {
      const aIndex = categoryOrder.findIndex(name => normalize(name) === normalize(a));
      const bIndex = categoryOrder.findIndex(name => normalize(name) === normalize(b));
      return (aIndex < 0 ? 999 : aIndex) - (bIndex < 0 ? 999 : bIndex) || a.localeCompare(b, 'es');
    });
  }, [catalogDishes]);
  const categoryLinks = activeCategories
    .map(name => ({ name, anchor: anchorFor(name) }))
    .sort((a, b) => {
      const aIndex = categoryNavOrder.findIndex(name => normalize(name) === normalize(a.name));
      const bIndex = categoryNavOrder.findIndex(name => normalize(name) === normalize(b.name));
      return (aIndex < 0 ? 999 : aIndex) - (bIndex < 0 ? 999 : bIndex) || a.name.localeCompare(b.name, 'es');
    });
  const homeCategoryLinks = categoryLinks.filter(category => homeCategoryOrder.some(name => normalize(name) === normalize(category.name)));

  return <main>
    <section className="hero" id="inicio">
      <img className="hero__bg" src="/images/hero-festin-callejero.png" alt="" fetchPriority="high" />
      <div className="container hero__inner">
        <div className="hero__copy">
          <h1 className="display">¿Hambre en<br /><em>Labranza?</em></h1>
          <p>Lo tenemos todo para matarte el antojo.</p>
          <div className="hero__actions">
            <a className="btn btn-primary" href="#menu">Ver el menú <ArrowRight size={18} /></a>
            <a className="btn hero__ghost" href="#promos">Promociones</a>
          </div>
          <p className="hero__location"><MapPin size={16} /> {address}</p>
        </div>
        <div className="hero__visual" aria-hidden="true">
          <div className="hero__orbit" />
          <div className="hero__orbit hero__orbit--two" />
          <div className="hero__photo">
            <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85" alt="" fetchPriority="high" />
          </div>
          <div className="hero__sticker"><span>¿HAMBRE?</span><b>Resuelta.</b></div>
        </div>
      </div>
    </section>

    <div className="container" id="menu">
      <div className="section menu-intro">
        <div className="section-head">
          <h2 className="display">Encuentra tu <em>antojo</em></h2>
        </div>
        <CategoryNav categories={categoryLinks} />
      </div>

      {homeCategoryLinks.map(({ name, anchor }) => {
        const dishes = catalogDishes.filter(dish => normalize(dish.category) === normalize(name));
        return <CategorySection key={name} name={name} anchor={anchor} dishes={dishes} />;
      })}
      {available.length === 0 && <p className="empty-state section">No hay platos disponibles para mostrar.</p>}

      <PromotionSection promotions={promotions} />

      <section className="section" id="ubicacion" aria-labelledby="ubicacion-title">
        <div className="location">
          <img className="location__img" src="/images/location.jpg" alt="Fachada de Hamburguesería 77" loading="lazy" />
          <div className="location__copy">
            <h2 className="display" id="ubicacion-title">Estamos en <em>Labranza</em></h2>
            <p><MapPin size={18} />{address}</p>
          </div>
          <div className="location__card">
            <div className="location__map">
              <iframe title="Mapa de Hamburguesería 77" src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
            <a className="btn btn-primary" href={mapsUrl} target="_blank" rel="noreferrer"><MapPin size={18} /> Ubícanos <ArrowUpRight size={18} /></a>
          </div>
        </div>
      </section>
    </div>
  </main>;
}

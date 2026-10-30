import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, MapPin } from 'lucide-react';
import { type Dish } from '../data';
import { getDishes } from '../api/catalog';
import { CategoryNav, CategorySection } from '../components/menu/CategorySection';
import { PromotionSection, type Promotion } from '../components/menu/PromotionSection';
import { supabase } from '../lib/supabase';

const categoryOrder = ['Hamburguesas', 'Completos', 'Pizzas', 'Sándwiches', 'As', 'Bowls', 'Menú saludable', 'Bebidas', 'Mechadas', 'Pepitos', 'Chorrillanas', 'Frituras', 'Pollo Crispy', 'Cafetería'];
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
  const categoryLinks = activeCategories.map(name => ({ name, anchor: anchorFor(name) }));
  const homeCategoryLinks = categoryLinks.filter(category => homeCategoryOrder.some(name => normalize(name) === normalize(category.name)));

  return <main>
    <section className="hero" id="inicio">
      <div className="hero-content">
        <div className="hero-kicker"><span /> HAMBURGUESAS · PIZZAS · MÁS</div>
        <h1>EL ANTOJO<br />TIENE <em>77</em></h1>
        <p>Tu próxima comida favorita está a un pedido de distancia.</p>
        <a className="hero-cta" href="#menu">VER EL MENÚ <ArrowRight size={17} /></a>
        <div className="hero-location"><MapPin size={15} /> {address}</div>
      </div>
      <div className="hero-visual"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-photo" /><div className="hero-sticker"><span>HAMBRE?</span><b>Resuelta.</b><ArrowDown size={14} /></div></div>
      <a className="hero-scroll" href="#categorias">DESLIZA PARA DESCUBRIR <ArrowDown size={13} /></a>
    </section>

    <CategoryNav categories={categoryLinks} />

    <div className="menu-page" id="menu">
      {homeCategoryLinks.map(({ name, anchor }) => {
        const dishes = catalogDishes.filter(dish => normalize(dish.category) === normalize(name));
        return <CategorySection key={name} name={name} anchor={anchor} dishes={dishes} />;
      })}
      {available.length === 0 && <p className="empty-state">No hay platos disponibles para mostrar.</p>}

      <PromotionSection promotions={promotions} />
    </div>

    <section className="location-section" id="ubicacion"><div className="location-copy"><span className="hero-kicker">UBICACIÓN</span><h2>Labranza,<br /><em>Chile.</em></h2><p>{address}</p></div><a className="location-card" href={mapsUrl} target="_blank" rel="noreferrer" aria-label={`Abrir ${address}, Labranza en Google Maps`}><span className="location-pin"><MapPin size={18} /></span><span>ENCUÉNTRANOS EN</span><b>Hamburguesería 77 <ArrowUpRight size={17} aria-hidden="true" /></b><small>{address}</small><span className="location-map-cta">ABRIR EN MAPS <ArrowUpRight size={13} aria-hidden="true" /></span></a></section>
  </main>;
}

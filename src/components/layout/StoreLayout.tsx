import { useEffect, useState, type ReactNode } from 'react';
import { Facebook, Instagram, MapPin, MessageCircle, Plus } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { CartDrawer } from '../cart/CartDrawer';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../store/cart';

type StoreSettings = { address: string | null; whatsapp_number: string | null; instagram_url: string | null; tiktok_url: string | null };

const fallbackAddress = 'C. 1 Nte. 0115, 4780000 Labranza, Temuco, Araucanía, Chile';
// Redes oficiales del local (si en «Local» del panel se guarda otra URL de Instagram, manda esa).
const instagramUrl = 'https://www.instagram.com/lahamburgueseria77';
const facebookUrl = 'https://www.facebook.com/people/Hamburgueser%C3%ADa-Labranza/100063806342442/';
const menuLinks = [
  { to: '/categoria/hamburguesas', label: 'Hamburguesas' },
  { to: '/categoria/completos', label: 'Completos' },
  { to: '/categoria/pizzas', label: 'Pizzas' },
  { to: '/categoria/sandwiches', label: 'Sándwiches' },
];

/** Columna del pie: acordeón en móvil, columna fija en escritorio (mismo patrón que LM Perfumes). */
function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="site-footer__col" open>
      <summary><h2>{title}</h2><Plus className="site-footer__plus" size={18} aria-hidden="true" /></summary>
      <div className="site-footer__links">{children}</div>
    </details>
  );
}

export function StoreLayout() {
  const [settings, setSettings] = useState<StoreSettings>();
  const { pathname, hash } = useLocation();

  // Al cambiar de página se empieza arriba (antes se heredaba el scroll de la página anterior).
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  useEffect(() => {
    supabase?.from('settings').select('address,whatsapp_number,instagram_url,tiktok_url').eq('id', true).maybeSingle()
      .then(({ data }) => { if (data) setSettings(data); });
    // En móvil las columnas empiezan cerradas.
    if (window.matchMedia('(max-width: 767px)').matches) {
      document.querySelectorAll<HTMLDetailsElement>('.site-footer__col').forEach(col => { col.open = false; });
    }
  }, []);

  const address = settings?.address || fallbackAddress;
  const whatsapp = settings?.whatsapp_number?.replace(/\D/g, '');
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div className="site-shell">
      <Header />
      <CartDrawer />
      <Outlet />
      <footer className="site-footer">
        <div className="container">
          <div className="site-footer__cta">
            <p className="display">¿Ya sabes qué <em>pedir?</em></p>
            <div className="site-footer__cta-actions">
              <a className="btn btn-primary" href="/#menu">Ver el menú</a>
              {whatsapp && <a className="btn site-footer__ghost" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp</a>}
            </div>
          </div>

          <div className="site-footer__grid">
            <div className="site-footer__about">
              <img src="/images/logo-variant.svg" alt="" width={72} height={72} />
              <div>
                <p className="site-footer__brand">Hamburguesería <b>77</b></p>
                <p>Hamburguesas, completos, pizzas y combos hechos al momento en Labranza.</p>
                <div className="site-footer__social">
                  <a className="icon-btn" href={settings?.instagram_url || instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram de Hamburguesería 77"><Instagram size={20} /></a>
                  <a className="icon-btn" href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook de Hamburguesería 77"><Facebook size={20} /></a>
                </div>
              </div>
            </div>

            <FooterCol title="La carta">
              {menuLinks.map(link => <Link key={link.to} to={link.to}>{link.label}</Link>)}
              <a href="/#promos">Combos y promos</a>
            </FooterCol>

            <FooterCol title="Tu pedido">
              <button className="site-footer__link-btn" type="button" onClick={() => useCart.getState().setOpen(true)}>Ver carrito</button>
              <span>Delivery en Labranza</span>
              <span>Retiro en el local</span>
              <span>Consumo en mesa</span>
            </FooterCol>

            <FooterCol title="Encuéntranos">
              <a href={maps} target="_blank" rel="noreferrer"><MapPin size={16} /> {address}</a>
              {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={16} /> +{whatsapp}</a>}
              <a href={settings?.instagram_url || instagramUrl} target="_blank" rel="noreferrer"><Instagram size={16} /> @lahamburgueseria77</a>
              <a href={facebookUrl} target="_blank" rel="noreferrer"><Facebook size={16} />La Hamburguesería 77</a>
              {settings?.tiktok_url && <a href={settings.tiktok_url} target="_blank" rel="noreferrer">TikTok</a>}
            </FooterCol>
          </div>

          <div className="site-footer__legal">
            <span>© {new Date().getFullYear()} Hamburguesería 77 · Labranza, Temuco</span>
            <Link to="/admin">Acceso del equipo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

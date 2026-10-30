import { Menu, Moon, Search, ShoppingBag, Sun, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../store/cart';

export function Header() {
  const { lines } = useCart();
  const count = lines.reduce((total, line) => total + line.qty, 0);
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'light');
  const [search, setSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('h77-theme', next);
    setTheme(next);
  };
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = search.trim();
    if (!value) return;
    navigate(`/buscar?q=${encodeURIComponent(value)}`);
    setMobileSearchOpen(false);
  };

  return <header className="site-header">
    <Link className="brand" to="/"><span className="brand-icon">77</span><span className="brand-name">HAMBURGUESERÍA <b>77</b></span></Link>
    <nav className={`main-nav${mobileMenuOpen ? ' nav-open' : ''}`} id="main-navigation"><a href="/#menu" onClick={() => setMobileMenuOpen(false)}>Menú</a><a href="/#promos" onClick={() => setMobileMenuOpen(false)}>Promociones</a><a href="/#ubicacion" onClick={() => setMobileMenuOpen(false)}>Ubicación</a></nav>
    <form className={`header-search${mobileSearchOpen ? ' header-search-open' : ''}`} onSubmit={submitSearch} role="search">
      <input value={search} onChange={event => setSearch(event.target.value)} aria-label="Buscar platos" placeholder="Buscar platos…" />
      <button type="submit" className="header-search-submit" aria-label="Buscar"><Search size={17} /></button>
      {mobileSearchOpen && <button type="button" className="search-close" aria-label="Cerrar búsqueda" onClick={() => setMobileSearchOpen(false)}><X size={17} /></button>}
    </form>
    <div className="header-actions">
      <button className="mobile-menu-toggle" aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={mobileMenuOpen} aria-controls="main-navigation" onClick={() => { setMobileMenuOpen(open => !open); setMobileSearchOpen(false); }}>{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      <button className="header-search-toggle" aria-label={mobileSearchOpen ? 'Cerrar búsqueda' : 'Abrir búsqueda'} aria-expanded={mobileSearchOpen} onClick={() => { setMobileSearchOpen(open => !open); setMobileMenuOpen(false); }}><Search size={19} /></button>
      <button className="theme-toggle" aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'} onClick={toggle}>{theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}</button>
      <Link className="cart-button" to="/checkout" aria-label={`Carrito ${count}`}><ShoppingBag />{count > 0 && <span>{count}</span>}</Link>
    </div>
  </header>;
}

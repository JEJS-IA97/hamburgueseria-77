import { ChevronRight, Menu, Moon, Search, ShoppingBag, Sun, X } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartCount, useCart } from '../../store/cart';

const links = [
  { href: '/#menu', label: 'Menú' },
  { href: '/#promos', label: 'Promociones' },
  { href: '/#ubicacion', label: 'Ubicación' },
];

export function Header() {
  const { lines, setOpen } = useCart();
  const count = cartCount(lines);
  const navigate = useNavigate();
  const menu = useRef<HTMLDialogElement>(null);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'light');
  const [search, setSearch] = useState('');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('h77-theme', next); } catch { /* modo privado */ }
    setTheme(next);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = search.trim();
    if (!value) return;
    navigate(`/buscar?q=${encodeURIComponent(value)}`);
    menu.current?.close();
  };

  const searchForm = (
    <form className="search-input header-search" onSubmit={submitSearch} role="search">
      <Search size={18} aria-hidden="true" />
      <input className="input" type="search" value={search} onChange={event => setSearch(event.target.value)} aria-label="Buscar platos" placeholder="Buscar platos…" />
    </form>
  );

  return (
    <header className="site-header">
      <div className="container site-header__bar">
        <button className="icon-btn menu-button" aria-label="Abrir menú" onClick={() => menu.current?.showModal()}>
          <Menu size={22} />
        </button>

        <Link className="brand" to="/" aria-label="Hamburguesería 77, inicio">
          <img src="/images/logo.jpeg" alt="" width={48} height={48} />
          <span>Hamburguesería <b>77</b></span>
        </Link>

        <nav className="site-nav" aria-label="Principal">
          {links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>

        {searchForm}

        <div className="site-header__actions">
          <button className="icon-btn theme-button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="icon-btn cart-button" type="button" onClick={() => setOpen(true)} aria-label={`Abrir carrito, ${count} productos`}>
            <ShoppingBag size={21} />
            {count > 0 && <span className="cart-button__count">{count}</span>}
          </button>
        </div>
      </div>

      <dialog className="mobile-menu" ref={menu} onClick={event => { if (event.target === menu.current) menu.current?.close(); }}>
        <div className="mobile-menu__panel">
          <div className="mobile-menu__head">
            <img src="/images/logo.jpeg" alt="Hamburguesería 77" width={44} height={44} />
            <button className="icon-btn" aria-label="Cerrar menú" onClick={() => menu.current?.close()}><X size={22} /></button>
          </div>
          <div className="mobile-menu__search">{searchForm}</div>
          <nav className="mobile-menu__nav" aria-label="Principal">
            {links.map(link => <a key={link.href} href={link.href} onClick={() => menu.current?.close()}>{link.label}<ChevronRight size={20} /></a>)}
          </nav>
          <div className="mobile-menu__foot">
            <button className="mobile-menu__row" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </button>
          </div>
        </div>
      </dialog>
    </header>
  );
}

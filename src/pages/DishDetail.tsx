import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Minus, Plus, Share2 } from 'lucide-react';
import { FoodIcon } from '../components/ui/FoodIcon';
import { getDishes } from '../api/catalog';
import { extraPrice, imageUrl, type Dish } from '../data';
import { formatCLP, formatDishPrice } from '../lib';
import { useCart } from '../store/cart';
import { ErrorState, LoadingState } from '../components/ui/LoadState';
import { NotFound } from './NotFound';

export function DishDetail() {
  const { id } = useParams();
  const [dish, setDish] = useState<Dish>();
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [extras, setExtras] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const add = useCart((state) => state.add);

  useEffect(() => {
    let active = true;
    setDish(undefined);
    setLoadStatus('loading');
    getDishes().then((dishes) => {
      if (!active) return;
      const found = dishes.find((item) => item.id === id);
      setDish(found);
      setLoadStatus(found ? 'ready' : 'missing');
    }).catch(() => { if (active) setLoadStatus('error'); });
    return () => { active = false; };
  }, [id, attempt]);

  const includedLimit = dish?.extra_selection_limit ?? (dish?.code === 'ARMABLE' ? 3 : 0);
  const isIncluded = (name: string) =>
    dish?.extras.find((extra) => extra.name === name)?.is_included ?? dish?.code === 'ARMABLE';
  const selectedIncluded = useMemo(
    () => extras.filter((name) => isIncluded(name)).length,
    [extras, dish],
  );
  const selectedExtrasPrice = dish?.extras
    .filter((extra) => extras.includes(extra.name) && !isIncluded(extra.name))
    .reduce((total, extra) => total + extraPrice(dish!, extra), 0) ?? 0;
  const unitPrice = dish?.price_clp == null ? null : dish.price_clp + selectedExtrasPrice;
  const canAdd = Boolean(
    dish && unitPrice != null && (!includedLimit || selectedIncluded === includedLimit),
  );

  if (loadStatus === 'loading') return <main className="container page"><LoadingState label="Cargando el producto…" /></main>;
  if (loadStatus === 'error') return <main className="container page"><ErrorState message="No pudimos cargar este producto desde el servidor." onRetry={() => setAttempt(value => value + 1)} /></main>;
  if (loadStatus === 'missing' || !dish) return <NotFound message="Este producto no está en el menú o ya no está disponible." />;

  const shareDish = async () => {
    if (navigator.share) {
      await navigator.share({ title: dish.name, url: window.location.href });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const toggleExtra = (name: string, checked: boolean) => {
    setExtras((current) => {
      if (!checked) return current.filter((extra) => extra !== name);
      if (current.includes(name)) return current;
      const extraIsIncluded = isIncluded(name);
      if (extraIsIncluded && includedLimit > 0 && selectedIncluded >= includedLimit) return current;
      return [...current, name];
    });
  };

  const addToCart = () => {
    if (!canAdd) return;
    for (let index = 0; index < quantity; index += 1) add(dish, extras);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  const categoryHref = `/categoria/${dish.category.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  const extrasCount = extras.filter(name => !isIncluded(name)).length;

  return (
    <main className="dish-detail">
      <div className="dish-detail-layout">
        <section className="dish-detail-visual" aria-label={dish.image ? `Fotografía de ${dish.name}` : undefined}>
          {dish.image
            ? <img src={imageUrl(dish.image, 1200)} alt={dish.name} />
            : <div className="dish-detail-plate" aria-hidden="true">
                <span className="dish-detail-plate__ring" />
                <FoodIcon category={dish.category} size={120} strokeWidth={1.25} />
              </div>}
          <button className="icon-btn icon-btn--float dish-share-button" type="button" onClick={shareDish} aria-label="Compartir plato">
            <Share2 size={19} />
          </button>
        </section>

        <div className="dish-detail-content">
          <header className="dish-detail-heading">
            <div className="dish-detail-top">
              <nav className="dish-detail-crumbs" aria-label="Ruta">
                <Link to="/#menu"><ArrowLeft size={16} aria-hidden="true" /> Menú</Link><ChevronRight size={14} aria-hidden="true" /><Link to={categoryHref}>{dish.category}</Link>
              </nav>
            </div>
            <div className="dish-detail-title">
              <h1 className="display">{dish.name}</h1>
            </div>
            {dish.size && <span className="pill dish-detail-size">{dish.size}</span>}
            <strong className="dish-detail-price num">{formatDishPrice(dish)}</strong>
            {dish.description && <p className="dish-detail-description">{dish.description}</p>}
          </header>

          {dish.price_clp == null && dish.price_min_clp != null && (
            <p className="dish-detail-note">La carta publica un rango. Confirma el precio exacto con el local para activar pedidos de este producto.</p>
          )}
          {dish.payment_conditions && <p className="dish-detail-note">{dish.payment_conditions}</p>}

          {dish.ingredients.length > 0 && (
            <section className="dish-detail-section">
              <h2>Lleva</h2>
              <ul className="dish-ingredient-chips">
                {dish.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
              </ul>
            </section>
          )}

          {dish.components && dish.components.length > 0 && (
            <section className="dish-detail-section">
              <h2>Incluye</h2>
              <ul className="dish-ingredient-chips">
                {dish.components.map((component) => <li key={component}>{component}</li>)}
              </ul>
            </section>
          )}

          {dish.extras.length > 0 && (
            <section className="dish-detail-section">
              <div className="dish-options-heading">
                <h2>{includedLimit ? 'Elige tus ingredientes' : 'Agrega extras'}</h2>
                {includedLimit > 0
                  ? <span>{selectedIncluded} de {includedLimit}</span>
                  : extrasCount > 0 && <span>{extrasCount} {extrasCount === 1 ? 'extra' : 'extras'}</span>}
              </div>
              <div className="dish-extra-grid">
                {dish.extras.map((extra) => {
                  const checked = extras.includes(extra.name);
                  const included = isIncluded(extra.name);
                  const limitReached = included && includedLimit > 0 && selectedIncluded >= includedLimit;
                  return (
                    <label className={`dish-extra${checked ? ' is-selected' : ''}`} key={extra.name}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && limitReached}
                        onChange={(event) => toggleExtra(extra.name, event.target.checked)}
                      />
                      <span className="dish-extra__mark" aria-hidden="true">{checked ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={2.5} />}</span>
                      <span className="dish-extra__name">{extra.name}</span>
                      <span className="dish-extra__price">{included ? 'Incluido' : `+${formatCLP(extraPrice(dish, extra))}`}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          <div className="dish-purchase-bar">
            <div className="stepper" role="group" aria-label="Cantidad">
              <button type="button" aria-label="Restar una unidad" disabled={quantity === 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                <Minus size={18} />
              </button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" aria-label="Sumar una unidad" onClick={() => setQuantity((value) => value + 1)}>
                <Plus size={18} />
              </button>
            </div>
            <button className="btn btn-primary btn-split dish-purchase-button" type="button" disabled={!canAdd} onClick={addToCart}>
              <span>{added ? 'Agregado al carrito' : 'Agregar al carrito'}</span>
              <strong>{added ? <Check size={20} /> : unitPrice == null ? formatDishPrice(dish) : formatCLP(unitPrice * quantity)}</strong>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

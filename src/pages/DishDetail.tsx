import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Minus, Plus, Share2 } from 'lucide-react';
import { getDishes } from '../api/catalog';
import { imageUrl, type Dish } from '../data';
import { formatCLP, formatDishPrice } from '../lib';
import { useCart } from '../store/cart';

export function DishDetail() {
  const { id } = useParams();
  const [dish, setDish] = useState<Dish>();
  const [extras, setExtras] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const add = useCart((state) => state.add);

  useEffect(() => {
    getDishes().then((dishes) => setDish(dishes.find((item) => item.id === id)));
  }, [id]);

  const includedLimit = dish?.extra_selection_limit ?? (dish?.code === 'ARMABLE' ? 3 : 0);
  const isIncluded = (name: string) =>
    dish?.extras.find((extra) => extra.name === name)?.is_included ?? dish?.code === 'ARMABLE';
  const selectedIncluded = useMemo(
    () => extras.filter((name) => isIncluded(name)).length,
    [extras, dish],
  );
  const selectedExtrasPrice = dish?.extras
    .filter((extra) => extras.includes(extra.name) && !isIncluded(extra.name))
    .reduce((total, extra) => total + extra.price_clp, 0) ?? 0;
  const unitPrice = dish?.price_clp == null ? null : dish.price_clp + selectedExtrasPrice;
  const canAdd = Boolean(
    dish && unitPrice != null && (!includedLimit || selectedIncluded === includedLimit),
  );

  if (!dish) {
    return (
      <main className="container section dish-detail">
        <Link to="/#menu" className="dish-back-link"><ArrowLeft size={18} /> Volver al menú</Link>
        <h1>Plato no encontrado</h1>
      </main>
    );
  }

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
  };

  return (
    <main className="dish-detail">
      <div className="dish-detail-layout">
        <section className="dish-detail-visual" aria-label={`Fotografía de ${dish.name}`}>
          {dish.image ? (
            <img src={imageUrl(dish.image, 1200)} alt={dish.name} />
          ) : (
            <div className="dish-detail-placeholder" aria-hidden="true">🍔</div>
          )}
          <Link to="/#menu" className="dish-floating-button dish-back-button" aria-label="Volver al menú">
            <ArrowLeft size={20} />
          </Link>
          <button className="dish-floating-button dish-share-button" type="button" onClick={shareDish} aria-label="Compartir plato">
            <Share2 size={19} />
          </button>
        </section>

        <div className="dish-detail-content">
          <header className="dish-detail-heading">
            <p className="dish-detail-eyebrow">{dish.category}{dish.size && ` · ${dish.size}`}</p>
            <h1>{dish.name}</h1>
            <p className="dish-detail-ingredients">
              {[...dish.ingredients, ...(dish.components ?? [])].join(' · ')}
            </p>
            <strong className="dish-detail-price">{formatDishPrice(dish)}</strong>
          </header>

          {dish.price_clp == null && dish.price_min_clp != null && (
            <p className="dish-detail-note">La carta publica un rango. Confirma el precio exacto con el local para activar pedidos de este producto.</p>
          )}
          {dish.description && <p className="dish-detail-description">{dish.description}</p>}
          {dish.payment_conditions && <p className="dish-detail-note">{dish.payment_conditions}</p>}

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
                {includedLimit > 0 && <span>{selectedIncluded} de {includedLimit}</span>}
              </div>
              <div className="dish-extra-grid">
                {dish.extras.map((extra) => {
                  const checked = extras.includes(extra.name);
                  const included = isIncluded(extra.name);
                  const limitReached = included && includedLimit > 0 && selectedIncluded >= includedLimit;
                  return (
                    <label className={`dish-extra-card${checked ? ' is-selected' : ''}`} key={extra.name}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && limitReached}
                        onChange={(event) => toggleExtra(extra.name, event.target.checked)}
                      />
                      <span className="dish-extra-name">{extra.name}</span>
                      <span className="dish-extra-price">{included ? 'Incluido' : `+${formatCLP(extra.price_clp)}`}</span>
                      <span className="dish-extra-mark" aria-hidden="true">{checked ? <Check size={17} /> : <Plus size={17} />}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          {dish.ingredients.length > 0 && (
            <section className="dish-detail-section dish-ingredients-section">
              <h2>Ingredientes</h2>
              <ul className="dish-ingredient-chips">
                {dish.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
              </ul>
            </section>
          )}

          <div className="dish-purchase-bar">
            <div className="dish-quantity" aria-label="Cantidad">
              <button type="button" aria-label="Restar una unidad" disabled={quantity === 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                <Minus size={18} />
              </button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" aria-label="Sumar una unidad" onClick={() => setQuantity((value) => value + 1)}>
                <Plus size={18} />
              </button>
            </div>
            <button className="dish-purchase-button" type="button" disabled={!canAdd} onClick={addToCart}>
              <span>Agregar al carrito</span>
              <strong>{unitPrice == null ? formatDishPrice(dish) : formatCLP(unitPrice * quantity)}</strong>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

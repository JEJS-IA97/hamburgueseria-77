import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { imageUrl } from '../../data';
import { formatCLP } from '../../lib';
import { cartTotal, lineTotal, useCart } from '../../store/cart';
import { FoodIcon } from '../ui/FoodIcon';

/** Carrito lateral, mismo patrón que LM Perfumes: <dialog> nativo (foco atrapado, Escape y fondo inerte). */
export function CartDrawer() {
  const { lines, open, setOpen, qty, remove } = useCart();
  const ref = useRef<HTMLDialogElement>(null);
  const total = cartTotal(lines);
  const missingPrice = lines.some(line => line.dish.price_clp == null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="cart-title"
      onClose={() => setOpen(false)}
      onClick={event => event.target === ref.current && setOpen(false)}
    >
      <div className="drawer__panel">
        <div className="drawer__head">
          <h2 id="cart-title" className="display">Tu <em>pedido</em></h2>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar carrito"><X size={22} /></button>
        </div>

        {lines.length === 0 ? (
          <div className="drawer__empty">
            <p className="muted">Aún no has agregado nada.</p>
            <a href="/#menu" className="btn btn-outline" onClick={() => setOpen(false)}>Ver el menú</a>
          </div>
        ) : (
          <>
            <ul className="drawer__lines">
              {lines.map((line, index) => (
                <li key={`${line.dish.id}-${line.extras.join('|')}-${index}`} className="line">
                  <span className="line__thumb">
                    {line.dish.image
                      ? <img src={imageUrl(line.dish.image, 160)} alt="" width={72} height={72} />
                      : <FoodIcon category={line.promotion_id ? line.dish.name : line.dish.category} size={28} strokeWidth={1.75} />}
                  </span>
                  <div className="line__info">
                    {line.promotion_id
                      ? <span className="line__name">{line.dish.name}</span>
                      : <Link to={`/plato/${line.dish.id}`} className="line__name" onClick={() => setOpen(false)}>{line.dish.name}</Link>}
                    <span className="line__meta">
                      {line.promotion_id ? 'Combo' : [line.dish.size, line.extras.length ? `+ ${line.extras.join(', ')}` : ''].filter(Boolean).join(' · ')}
                    </span>
                    <div className="line__row">
                      <div className="stepper stepper--sm" role="group" aria-label={`Cantidad de ${line.dish.name}`}>
                        <button onClick={() => qty(line.dish.id, line.extras, -1)} disabled={line.qty <= 1} aria-label="Restar uno"><Minus size={16} /></button>
                        <span aria-live="polite">{line.qty}</span>
                        <button onClick={() => qty(line.dish.id, line.extras, 1)} aria-label="Sumar uno"><Plus size={16} /></button>
                      </div>
                      <span className="num line__total">{formatCLP(lineTotal(line))}</span>
                    </div>
                  </div>
                  <button className="icon-btn line__remove" onClick={() => remove(line.dish.id, line.extras)} aria-label={`Quitar ${line.dish.name}`}><Trash2 size={18} /></button>
                </li>
              ))}
            </ul>
            <div className="drawer__foot">
              <div className="drawer__total">
                <span>Total</span>
                <b className="num">{formatCLP(total)}</b>
              </div>
              {missingPrice && <p className="notice">Hay un producto sin precio exacto. Confírmalo con el local.</p>}
              <Link to="/checkout" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>Continuar con el pedido</Link>
              <p className="muted drawer__hint">Completas tus datos y el pedido llega al local por WhatsApp.</p>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}

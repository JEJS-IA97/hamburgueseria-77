import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CircleCheck, Minus, Plus, Trash2 } from 'lucide-react';
import { cartTotal, lineTotal, useCart } from '../store/cart';
import { formatCLP } from '../lib';
import { createOrder, type Customer } from '../api/orders';
import { supabase } from '../lib/supabase';

function validRut(value: string) {
  const clean = value.replace(/[.\s]/g, '').toUpperCase();
  if (!/^\d{7,8}-[0-9K]$/.test(clean)) return false;
  const [body, dv] = clean.split('-');
  let sum = 0, multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const result = 11 - sum % 11;
  return (result === 11 ? '0' : result === 10 ? 'K' : String(result)) === dv;
}

export function Checkout() {
  const { lines, clear, qty } = useCart();
  const [mode, setMode] = useState<Customer['mode']>('delivery');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [receipt, setReceipt] = useState<any>();
  const total = cartTotal(lines);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customer = {
      name: String(form.get('name') ?? '').trim(),
      phone: String(form.get('phone') ?? '').trim(),
      rut: String(form.get('rut') ?? '').trim(),
      mode,
      address: String(form.get('address') ?? '').trim(),
      table_number: String(form.get('table_number') ?? '').trim(),
      notes: String(form.get('notes') ?? '').trim(),
    };
    if (customer.name.length < 2 || !customer.phone || !validRut(customer.rut) || (mode === 'delivery' && !customer.address) || (mode === 'table' && !customer.table_number)) {
      setErr('Revisa tu nombre, teléfono, RUT y los datos requeridos para la entrega.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const result = await createOrder(customer, lines);
      const { data } = await supabase!.from('settings').select('whatsapp_number').eq('id', true).maybeSingle();
      setReceipt({ result, customer, whatsapp: data?.whatsapp_number ?? '', lines });
      clear();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'No se pudo registrar el pedido.');
    } finally {
      setBusy(false);
    }
  }

  if (receipt) {
    const itemDetails = receipt.lines.map((line: (typeof lines)[number]) => {
      const comboLabel = line.promotion_id ? ' · COMBO' : '';
      const contents = line.promotion_id && line.dish.components?.length ? `\n   Incluye: ${line.dish.components.join(', ')}` : '';
      return `${line.qty} × ${line.dish.name}${comboLabel}${contents}`;
    }).join('\n');
    const message = encodeURIComponent(`Pedido #${receipt.result.number} · Hamburguesería 77\n${receipt.customer.name} · ${receipt.customer.phone}\nRUT ${receipt.customer.rut}\n${itemDetails}\nTotal: ${formatCLP(receipt.result.total_clp)}`);
    return <main className="container page confirm">
      <CircleCheck className="confirm__icon" size={96} strokeWidth={1.5} aria-hidden="true" />
      <h1 className="display">¡Pedido <em>confirmado!</em></h1>
      <p className="muted">Orden #{receipt.result.number}. Envíala por WhatsApp para que el local la reciba al instante.</p>
      <div className="summary confirm__summary">
        <ul className="summary__lines">
          {receipt.lines.map((line: (typeof lines)[number], index: number) => <li key={`${line.dish.id}-${index}`}>
            <span>
              <b>{line.qty} × {line.dish.name}</b>{line.promotion_id && <span className="pill">Combo</span>}
              {line.promotion_id && line.dish.components?.length ? <small>Incluye: {line.dish.components.join(' · ')}</small> : null}
            </span>
          </li>)}
        </ul>
        <p className="summary__total"><span>Total</span><b className="num">{formatCLP(receipt.result.total_clp)}</b></p>
      </div>
      {receipt.whatsapp
        ? <a className="btn btn-primary" href={`https://wa.me/${String(receipt.whatsapp).replace(/\D/g, '')}?text=${message}`} target="_blank" rel="noreferrer">Enviar pedido por WhatsApp</a>
        : <p className="notice">La orden quedó registrada. El WhatsApp del local aún no está configurado.</p>}
      <Link to="/#menu" className="back-link">Volver al menú</Link>
    </main>;
  }

  const missingPrice = lines.some(line => line.dish.price_clp == null);

  return <main className="container page">
    <Link to="/#menu" className="back-link"><ArrowLeft size={18} /> Seguir pidiendo</Link>
    <div className="checkout">
      <form className="form checkout__form" onSubmit={submit} noValidate>
        <h1 className="display">Tu <em>pedido</em></h1>

        <section className="form-card">
          <h2>Tus datos</h2>
          <label className="field"><span>Nombre y apellido</span><input className="input" name="name" required autoComplete="name" /></label>
          <div className="form-row">
            <label className="field"><span>Teléfono / WhatsApp</span><input className="input" name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="+56 9 1234 5678" /></label>
            <label className="field"><span>RUT</span><input className="input" name="rut" required placeholder="12.345.678-5" autoCapitalize="characters" /></label>
          </div>
        </section>

        <section className="form-card">
          <h2>Entrega</h2>
          <fieldset className="choices">
            <legend>¿Cómo recibirás tu pedido?</legend>
            {(['delivery', 'pickup', 'table'] as const).map(value => <label key={value}>
              <input type="radio" name="mode" checked={mode === value} onChange={() => setMode(value)} />
              {value === 'delivery' ? 'Delivery' : value === 'pickup' ? 'Retiro en local' : 'Consumo en mesa'}
            </label>)}
          </fieldset>
          {mode === 'delivery' && <label className="field"><span>Dirección en Labranza</span><input className="input" name="address" required autoComplete="street-address" /></label>}
          {mode === 'table' && <label className="field"><span>Número de mesa</span><input className="input" name="table_number" required inputMode="numeric" /></label>}
          <label className="field"><span>Notas para el local (opcional)</span><textarea className="input" name="notes" maxLength={500} /></label>
        </section>

        {err && <p className="alert" role="alert">{err}</p>}
        {missingPrice && <p className="notice">Hay un producto sin precio exacto. Quítalo o confirma el precio con el local.</p>}
        <button className="btn btn-strong btn-block" disabled={busy || lines.length === 0 || missingPrice}>{busy ? 'Registrando…' : `Confirmar pedido · ${formatCLP(total)}`}</button>
      </form>

      <aside className="summary checkout__summary" aria-labelledby="summary-title">
        <h2 id="summary-title">Resumen</h2>
        {lines.length === 0 && <p className="muted">Tu carrito está vacío.</p>}
        <ul className="summary__lines">
          {lines.map((line, index) => <li key={`${line.dish.id}-${line.promotion_id ?? 'dish'}-${index}`}>
            <span>
              <b>{line.dish.name}</b>{line.promotion_id && <span className="pill">Combo</span>}
              {line.extras.length > 0 && <small>{line.extras.join(' · ')}</small>}
              {line.promotion_id && line.dish.components?.length ? <small>Incluye: {line.dish.components.join(' · ')}</small> : null}
              <span className="stepper stepper--sm">
                <button type="button" aria-label="Restar uno" onClick={() => qty(line.dish.id, line.extras, -1)}>{line.qty === 1 ? <Trash2 size={16} /> : <Minus size={16} />}</button>
                <span>{line.qty}</span>
                <button type="button" aria-label="Sumar uno" onClick={() => qty(line.dish.id, line.extras, 1)}><Plus size={16} /></button>
              </span>
            </span>
            <b className="num">{formatCLP(lineTotal(line))}</b>
          </li>)}
        </ul>
        <p className="summary__total"><span>Total</span><b className="num">{formatCLP(total)}</b></p>
        {!supabase && <p className="muted">El registro se activa al conectar Supabase.</p>}
      </aside>
    </div>
  </main>;
}

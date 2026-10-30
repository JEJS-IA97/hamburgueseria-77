import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../store/cart';
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
  const { lines, clear } = useCart();
  const [mode, setMode] = useState<Customer['mode']>('delivery');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [receipt, setReceipt] = useState<any>();
  const total = lines.reduce((sum, line) => sum + (line.dish.price_clp ?? 0) * line.qty + line.extras.reduce((extraSum, name) => extraSum + (line.dish.extras.find(extra => extra.name === name)?.price_clp ?? 0), 0) * line.qty, 0);

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
    return <main className="container section"><h1>Pedido registrado</h1><p>Orden #{receipt.result.number}</p><div className="checkout__summary">{receipt.lines.map((line: (typeof lines)[number], index: number) => <div className="checkout-line" key={`${line.dish.id}-${index}`}><p><b>{line.qty} × {line.dish.name}{line.promotion_id && ' · COMBO'}</b></p>{line.promotion_id && line.dish.components?.length ? <small className="cart-line-details">Incluye: {line.dish.components.join(' · ')}</small> : null}</div>)}<h3>Total <b>{formatCLP(receipt.result.total_clp)}</b></h3></div>{receipt.whatsapp ? <a className="dialog-add" href={`https://wa.me/${String(receipt.whatsapp).replace(/\D/g, '')}?text=${message}`} target="_blank" rel="noreferrer">Enviar pedido por WhatsApp</a> : <p>La orden quedó registrada. El WhatsApp del local aún no está configurado.</p>}</main>;
  }

  return <main className="container section checkout">
    <form className="checkout__form" onSubmit={submit}>
      <Link to="/#menu">← Volver al menú</Link>
      <h1>Datos para tu pedido</h1>
      <label className="field">Nombre y apellido<input className="input" name="name" required autoComplete="name" /></label>
      <div className="checkout__row"><label className="field">Teléfono / WhatsApp<input className="input" name="phone" required type="tel" autoComplete="tel" /></label><label className="field">RUT<input className="input" name="rut" required placeholder="12.345.678-5" /></label></div>
      <fieldset className="choices"><legend>¿Cómo recibirás tu pedido?</legend>{(['delivery', 'pickup', 'table'] as const).map(value => <label key={value}><input type="radio" name="mode" checked={mode === value} onChange={() => setMode(value)} />{value === 'delivery' ? 'Delivery' : value === 'pickup' ? 'Retiro en local' : 'Consumo en mesa'}</label>)}</fieldset>
      {mode === 'delivery' && <label className="field">Dirección en Labranza<input className="input" name="address" required autoComplete="street-address" /></label>}
      {mode === 'table' && <label className="field">Número de mesa<input className="input" name="table_number" required /></label>}
      <label className="field">Notas para el local (opcional)<textarea className="input" name="notes" maxLength={500} /></label>
      {err && <p className="alert" role="alert">{err}</p>}
      <button className="dialog-add" disabled={busy || lines.length === 0 || lines.some(line => line.dish.price_clp == null)}>{busy ? 'Registrando…' : 'Confirmar pedido'}</button>
    </form>
    <aside className="checkout__summary"><h2>Tu pedido</h2>{lines.map((line, index) => <div className="checkout-line" key={`${line.dish.id}-${line.promotion_id ?? 'dish'}-${index}`}><p>{line.qty} × {line.dish.name} <b>{formatCLP((line.dish.price_clp ?? 0) * line.qty)}</b>{line.promotion_id && <strong className="combo-label">COMBO</strong>}</p>{line.promotion_id && line.dish.components?.length ? <small className="cart-line-details">Incluye: {line.dish.components.join(' · ')}</small> : null}{line.promotion_id && line.dish.description && <small className="cart-line-details">{line.dish.description}</small>}</div>)}<hr /><h3>Total <b>{formatCLP(total)}</b></h3>{!supabase && <p className="muted">El registro se activa al conectar Supabase.</p>}</aside>
  </main>;
}

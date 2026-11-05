import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatCLP } from '../lib';
import { Select } from '../components/ui/Select';
import { ErrorState, LoadingState } from '../components/ui/LoadState';

type OrderItem = {
  name: string;
  item_type?: 'dish' | 'combo';
  quantity: number;
  size?: string;
  components?: string[];
  description?: string;
  extras?: string[];
  line_total_clp?: number;
};

const statuses = ['nuevo', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'];

export function OrdersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    if (!supabase) { setError('Supabase no está configurado.'); setLoading(false); return; }
    Promise.resolve(supabase.from('orders').select('*').order('created_at', { ascending: false })).then(({ data, error }) => {
      if (!active) return;
      if (error) setError(error.message);
      else { setRows(data ?? []); setError(''); }
      setLoading(false);
    }).catch(() => { if (active) { setError('No se pudieron cargar los pedidos desde el servidor.'); setLoading(false); } });
    return () => { active = false; };
  }, [attempt]);

  async function status(id: string, value: string) {
    if (!supabase) return;
    const { error } = await supabase.from('orders').update({ status: value }).eq('id', id);
    if (error) setError(error.message);
    else setRows(current => current.map(order => order.id === id ? { ...order, status: value } : order));
  }

  const visible = useMemo(() => filter ? rows.filter(order => order.status === filter) : rows, [rows, filter]);

  return (
    <section>
      <div className="admin__head">
        <div>
          <h1>Pedidos</h1>
          <p className="muted">{visible.length} {visible.length === 1 ? 'orden' : 'órdenes'}</p>
        </div>
        <Select className="admin__filter" value={filter} onChange={event => setFilter(event.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {statuses.map(value => <option key={value} value={value}>{value}</option>)}
        </Select>
      </div>
      {error && <ErrorState message={error} onRetry={() => setAttempt(value => value + 1)} />}
      {loading ? <LoadingState label="Cargando pedidos…" /> : visible.length === 0 && !error ? <p className="empty-state">No hay pedidos.</p> : null}
      {!loading && !error && <div className="orders">
        {visible.map(order => {
          const items = Array.isArray(order.items) ? order.items as OrderItem[] : [];
          return (
            <details className="order" key={order.id}>
              <summary>
                <b>#{order.order_number}</b>
                <span>{order.customer_name}</span>
                <span className={`pill pill--${order.status}`}>{order.status}</span>
                <strong className="num">{formatCLP(order.total_clp)}</strong>
                <time className="muted">{new Date(order.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}</time>
              </summary>
              <div className="order__body">
                <dl className="order__data">
                  <dt>Teléfono</dt><dd><a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a></dd>
                  <dt>RUT</dt><dd>{order.customer_rut}</dd>
                  <dt>Entrega</dt><dd>{order.mode === 'delivery' ? order.address : order.mode === 'table' ? `Mesa ${order.table_number}` : 'Retiro en local'}</dd>
                  {order.notes && <><dt>Notas</dt><dd>{order.notes}</dd></>}
                </dl>
                <ul className="order__items">
                  {items.map((item, index) => <li key={`${item.name}-${index}`}>
                    <span>
                      <b>{item.quantity} × {item.name}{item.size ? ` · ${item.size}` : ''}</b>
                      {item.item_type === 'combo' && <span className="pill">Combo</span>}
                      {item.item_type === 'combo' && item.components?.length ? <small>Incluye: {item.components.join(' · ')}</small> : null}
                      {item.extras?.length ? <small>Extras: {item.extras.join(' · ')}</small> : null}
                    </span>
                    {item.line_total_clp != null && <span className="num">{formatCLP(item.line_total_clp)}</span>}
                  </li>)}
                </ul>
                <label className="field order__status">
                  <span>Estado</span>
                  <Select value={order.status} onChange={event => status(order.id, event.target.value)}>
                    {statuses.map(value => <option key={value} value={value}>{value}</option>)}
                  </Select>
                </label>
              </div>
            </details>
          );
        })}
      </div>}
    </section>
  );
}

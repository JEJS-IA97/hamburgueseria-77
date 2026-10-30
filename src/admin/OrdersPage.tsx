import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatCLP } from '../lib';

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

export function OrdersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase?.from('orders').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) setError(error.message);
      else setRows(data ?? []);
    });
  }, []);

  async function status(id: string, value: string) {
    if (!supabase) return;
    const { error } = await supabase.from('orders').update({ status: value }).eq('id', id);
    if (error) setError(error.message);
    else setRows(current => current.map(order => order.id === id ? { ...order, status: value } : order));
  }

  return <section className="admin-content">
    <h1>Pedidos</h1><p>Órdenes recibidas</p>{error && <p className="alert">{error}</p>}
    <div className="admin-list">{rows.map(order => {
      const items = Array.isArray(order.items) ? order.items as OrderItem[] : [];
      return <article className="admin-row order-row" key={order.id}>
        <div className="admin-dish">
          <small>#{order.order_number} · {new Date(order.created_at).toLocaleString('es-CL')}</small>
          <b>{order.customer_name} · {order.customer_phone}</b>
          <span>{order.mode === 'delivery' ? order.address : order.mode === 'table' ? `Mesa ${order.table_number}` : 'Retiro'} · RUT {order.customer_rut}</span>
          <div className="order-items">{items.map((item, index) => <div className="order-item" key={`${item.name}-${index}`}>
            <b>{item.quantity} × {item.name}{item.size ? ` · ${item.size}` : ''}</b>
            {item.item_type === 'combo' && <strong className="combo-label">COMBO</strong>}
            {item.item_type === 'combo' && item.components?.length ? <small>Incluye: {item.components.join(' · ')}</small> : null}
            {item.item_type === 'combo' && item.description ? <small>{item.description}</small> : null}
            {item.extras?.length ? <small>Extras: {item.extras.join(' · ')}</small> : null}
            {item.line_total_clp != null && <small>{formatCLP(item.line_total_clp)}</small>}
          </div>)}</div>
        </div>
        <strong>{formatCLP(order.total_clp)}</strong>
        <select value={order.status} onChange={event => status(order.id, event.target.value)}>{['nuevo', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'].map(value => <option key={value}>{value}</option>)}</select>
      </article>;
    })}</div>
  </section>;
}

import { supabase } from '../lib/supabase';
import type { CartLine } from '../store/cart';

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta';

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia bancaria',
  tarjeta: 'Tarjeta Débito / Crédito',
};

export const MODE_LABELS = {
  delivery: 'Delivery (Labranza)',
  pickup: 'Retiro en local (Pick up)',
  table: 'Consumo en mesa',
} as const;

export type Customer = {
  name: string;
  phone: string;
  rut: string;
  mode: 'delivery' | 'pickup' | 'table';
  address: string;
  table_number: string;
  payment_method: PaymentMethod;
  notes: string;
};

export async function createOrder(customer: Customer, lines: CartLine[]) {
  if (!supabase) throw new Error('Pedidos deshabilitados: conecta Supabase antes de publicar.');

  const paymentLabel = PAYMENT_LABELS[customer.payment_method] || customer.payment_method;
  const deliveryLabel = customer.mode === 'delivery'
    ? `Delivery (${customer.address})`
    : customer.mode === 'table'
    ? `Mesa ${customer.table_number}`
    : 'Retiro en local (Pick up)';

  // Guardamos pago y entrega en las notas por compatibilidad con esquemas previos
  const formattedNotes = [
    `[Pago: ${paymentLabel}]`,
    `[Entrega: ${deliveryLabel}]`,
    customer.notes?.trim(),
  ].filter(Boolean).join(' ');

  const payloadCustomer = {
    ...customer,
    payment_method: customer.payment_method,
    notes: formattedNotes,
  };

  const { data, error } = await supabase.rpc('create_order', {
    p_customer: payloadCustomer,
    p_items: lines.map((l) => ({
      ...(l.promotion_id ? { promotion_id: l.promotion_id } : { dish_id: l.dish.id }),
      quantity: l.qty,
      extras: l.extras,
    })),
  });

  if (error) throw error;
  return data as { id: string; number: number; total_clp: number };
}

import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCLP } from '../lib';
import { Select } from '../components/ui/Select';
import { ErrorState, LoadingState } from '../components/ui/LoadState';

type Promo = {
  id: string; title: string; description: string; kind: 'weekly' | 'seasonal'; record_type: 'combo' | 'promotion';
  price_clp: number | null; components: string[]; payment_conditions: string; weekdays: string[]; starts_at?: string; ends_at?: string;
};

const emptyPromo = (): Promo => ({ id: '', title: '', description: '', kind: 'seasonal', record_type: 'promotion', price_clp: null, components: [], payment_conditions: '', weekdays: [] });

export function PromotionsPage() {
  const [rows, setRows] = useState<Promo[]>([]);
  const [edit, setEdit] = useState<Promo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  async function reload() {
    const { data, error } = await supabase!.from('promotions').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setRows((data ?? []) as Promo[]);
  }
  useEffect(() => {
    let active = true;
    setLoading(true);
    if (!supabase) { setError('Supabase no está configurado.'); setLoading(false); return; }
    reload().catch(() => { if (active) setError('No se pudieron cargar las promociones desde el servidor.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const f = new FormData(event.currentTarget);
    const values = {
      title: String(f.get('title')),
      price_clp: Number(f.get('price_clp')),
      description: String(f.get('description')),
      kind: String(f.get('kind')),
      record_type: String(f.get('record_type')),
      components: String(f.get('components')).split('\n').map(x => x.trim()).filter(Boolean),
      payment_conditions: String(f.get('payment_conditions')),
      weekdays: String(f.get('weekdays')).split(',').map(x => x.trim()).filter(Boolean),
      starts_at: f.get('starts_at') || null,
      ends_at: f.get('ends_at') || null,
      active: true,
    };
    const query = edit?.id ? supabase.from('promotions').update(values).eq('id', edit.id) : supabase.from('promotions').insert(values);
    const { error } = await query;
    if (error) setError(error.message);
    else { setEdit(null); await reload(); }
  }

  async function remove(promo: Promo) {
    if (!confirm(`¿Eliminar ${promo.title}?`)) return;
    const { error } = await supabase!.from('promotions').delete().eq('id', promo.id);
    if (error) setError(error.message);
    else reload();
  }

  return (
    <section>
      <div className="admin__head">
        <div>
          <h1>Combos y promociones</h1>
          <p className="muted">Precios, componentes, forma de pago y vigencia.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEdit(emptyPromo())}><Plus size={18} /> Nueva oferta</button>
      </div>
      {error && <ErrorState message={error} onRetry={() => setAttempt(value => value + 1)} />}

      {edit && <form key={edit.id || 'new'} className="form-card admin-section" onSubmit={save}>
        <h2>{edit.id ? 'Editar oferta' : 'Nueva oferta'}</h2>
        <label className="field"><span>Nombre</span><input className="input" name="title" defaultValue={edit.title} required /></label>
        <div className="form-row">
          <label className="field"><span>Precio CLP</span><input className="input" name="price_clp" type="number" min="0" inputMode="numeric" defaultValue={edit.price_clp ?? ''} required /></label>
          <label className="field"><span>Tipo de oferta</span>
            <Select name="record_type" defaultValue={edit.record_type}><option value="promotion">Promoción</option><option value="combo">Combo</option></Select>
          </label>
        </div>
        <div className="form-row">
          <label className="field"><span>Vigencia</span>
            <Select name="kind" defaultValue={edit.kind}><option value="weekly">Semanal</option><option value="seasonal">Temporada</option></Select>
          </label>
          <label className="field"><span>Días</span><input className="input" name="weekdays" defaultValue={(edit.weekdays ?? []).join(', ')} placeholder="Martes, Miércoles" /><small>Separados por coma.</small></label>
        </div>
        <label className="field"><span>Descripción</span><textarea className="input" name="description" defaultValue={edit.description} /></label>
        <label className="field"><span>Componentes o ingredientes a elección</span><textarea className="input" name="components" defaultValue={(edit.components ?? []).join('\n')} /><small>Uno por línea.</small></label>
        <label className="field"><span>Condición de pago</span><input className="input" name="payment_conditions" defaultValue={edit.payment_conditions} placeholder="Transferencia o efectivo" /></label>
        <div className="form-row">
          <label className="field"><span>Desde</span><input className="input" type="date" name="starts_at" defaultValue={edit.starts_at?.slice(0, 10)} /></label>
          <label className="field"><span>Hasta</span><input className="input" type="date" name="ends_at" defaultValue={edit.ends_at?.slice(0, 10)} /></label>
        </div>
        <div className="admin-dialog__actions">
          <button className="btn btn-primary">{edit.id ? 'Guardar cambios' : 'Crear oferta'}</button>
          <button type="button" className="btn btn-outline" onClick={() => setEdit(null)}>Cancelar</button>
        </div>
      </form>}

      {loading ? <LoadingState label="Cargando promociones…" /> : !error && rows.length === 0 ? <p className="empty-state">No hay promociones guardadas.</p> : !error && <ul className="admin-list">
        {rows.map(promo => <li className="admin-row admin-row--promo" key={promo.id}>
          <span className="admin-row__main">
            <b className="truncate">{promo.title}</b>
            <small className="truncate">{promo.record_type === 'combo' ? 'Combo' : 'Promoción'} · {promo.kind === 'weekly' ? 'Semanal' : 'Temporada'}{promo.components?.length ? ` · ${promo.components.join(' · ')}` : ''}</small>
          </span>
          <strong className="num admin-row__price">{formatCLP(promo.price_clp)}</strong>
          <span className="admin-row__actions">
            <button className="icon-btn" onClick={() => setEdit(promo)} aria-label={`Editar ${promo.title}`}><Pencil size={18} /></button>
            <button className="icon-btn admin-danger" onClick={() => remove(promo)} aria-label={`Eliminar ${promo.title}`}><Trash2 size={18} /></button>
          </span>
        </li>)}
      </ul>}
    </section>
  );
}

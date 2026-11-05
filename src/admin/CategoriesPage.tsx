import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ErrorState, LoadingState } from '../components/ui/LoadState';

export function CategoriesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    if (!supabase) { setError('Supabase no está configurado.'); setLoading(false); return; }
    Promise.resolve(supabase.from('categories').select('*').order('sort_order')).then(({ data, error }) => {
      if (!active) return;
      if (error) setError(error.message);
      else { setRows(data ?? []); setError(''); }
      setLoading(false);
    }).catch(() => { if (active) { setError('No se pudieron cargar las categorías desde el servidor.'); setLoading(false); } });
    return () => { active = false; };
  }, [attempt]);

  async function add() {
    const name = prompt('Nombre de la categoría');
    if (!name || !supabase) return;
    const { error } = await supabase.from('categories').insert({ name, sort_order: rows.length });
    if (error) setError(error.message);
    else setRows(await supabase.from('categories').select('*').order('sort_order').then(result => result.data ?? []));
  }

  return (
    <section>
      <div className="admin__head">
        <div>
          <h1>Categorías</h1>
          <p className="muted">Organiza el menú por tipo de plato.</p>
        </div>
        <button className="btn btn-primary" onClick={add}><Plus size={18} /> Agregar</button>
      </div>
      {error && <ErrorState message={error} onRetry={() => setAttempt(value => value + 1)} />}
      {loading ? <LoadingState label="Cargando categorías…" /> : rows.length && !error
        ? <ul className="admin-list">
            {rows.map(category => <li className="admin-row" key={category.id}>
              <span className="admin-row__main"><b>{category.name}</b></span>
              <span className={`pill ${category.active ? 'pill--ok' : ''}`}>{category.active ? 'Visible' : 'Oculta'}</span>
            </li>)}
          </ul>
        : !error && <p className="empty-state">No hay categorías guardadas en Supabase.</p>}
    </section>
  );
}

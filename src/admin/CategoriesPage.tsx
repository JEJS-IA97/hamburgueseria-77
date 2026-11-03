import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function CategoriesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase?.from('categories').select('*').order('sort_order').then(({ data, error }) => {
      if (error) setError(error.message);
      else setRows(data ?? []);
    });
  }, []);

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
      {error && <p className="alert">{error}</p>}
      {rows.length
        ? <ul className="admin-list">
            {rows.map(category => <li className="admin-row" key={category.id}>
              <span className="admin-row__main"><b>{category.name}</b></span>
              <span className={`pill ${category.active ? 'pill--ok' : ''}`}>{category.active ? 'Visible' : 'Oculta'}</span>
            </li>)}
          </ul>
        : <p className="empty-state">No hay categorías guardadas en Supabase.</p>}
    </section>
  );
}

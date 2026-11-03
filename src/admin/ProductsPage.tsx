import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { imageUrl, type Dish } from '../data';
import { deleteDish, getCategories, getDishes, saveDish } from '../api/catalog';
import { formatDishPrice } from '../lib';
import { Select } from '../components/ui/Select';

const emptyDish = (): Dish => ({
  id: crypto.randomUUID(), name: '', category: 'Hamburguesas', description: '', ingredients: [], price_clp: null, image: '',
  extras: [], available: true, size: '', code: '', product_type: 'dish', components: [], payment_conditions: '',
});

export function ProductsPage() {
  const [items, setItems] = useState<Dish[]>([]);
  const [categoryRows, setCategoryRows] = useState<{ name: string }[]>([]);
  const [edit, setEdit] = useState<Dish | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);

  async function reload() {
    const [dishes, categories] = await Promise.all([getDishes(), getCategories()]);
    setItems(dishes);
    setCategoryRows(categories);
  }
  useEffect(() => { reload().catch(e => setError(e.message)); }, []);
  useEffect(() => { if (edit) dialog.current?.showModal(); else dialog.current?.close(); }, [edit]);

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es');
    return items.filter(dish => (!category || dish.category === category) && (!term || `${dish.name} ${dish.size ?? ''}`.toLocaleLowerCase('es').includes(term)));
  }, [items, query, category]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edit) return;
    const f = new FormData(event.currentTarget);
    const dish: Dish = {
      ...edit,
      name: String(f.get('name')),
      category: String(f.get('category')) as Dish['category'],
      size: String(f.get('size')),
      code: String(f.get('code') ?? edit.code ?? ''),
      product_type: String(f.get('product_type')) as Dish['product_type'],
      description: String(f.get('description')),
      ingredients: String(f.get('ingredients')).split(',').map(x => x.trim()).filter(Boolean),
      price_clp: f.get('price') ? Number(f.get('price')) : null,
      image: String(f.get('image')),
      components: String(f.get('components')).split('\n').map(x => x.trim()).filter(Boolean),
      extra_selection_limit: Number(f.get('extra_selection_limit')) || 0,
      extras: String(f.get('extras')).split('\n').filter(Boolean).map(line => {
        const [name, price, included] = line.split(':');
        return { name: name.trim(), price_clp: Number(price) || 0, is_included: included === 'true' };
      }),
      available: f.get('available') === 'on',
    };
    setSaving(true);
    try {
      await saveDish(dish);
      await reload();
      setEdit(null);
      setError('');
    } catch (x) {
      setError(x instanceof Error ? x.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  async function remove(dish: Dish) {
    if (!confirm(`¿Eliminar ${dish.name}${dish.size ? ` ${dish.size}` : ''}?`)) return;
    await deleteDish(dish.id);
    reload();
  }

  return (
    <section>
      <div className="admin__head">
        <div>
          <h1>Platos y combos</h1>
          <p className="muted">Variantes, precio CLP, ingredientes, extras y disponibilidad.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEdit(emptyDish())}><Plus size={18} /> Nuevo plato</button>
      </div>
      {error && !edit && <p className="alert">{error}</p>}

      <div className="admin-filters">
        <label className="search-input">
          <Search size={18} aria-hidden="true" />
          <input className="input" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre" aria-label="Buscar platos" />
        </label>
        <Select value={category} onChange={e => setCategory(e.target.value)} aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          {categoryRows.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </Select>
      </div>
      <p className="admin-count muted">{visible.length} de {items.length} platos</p>

      <ul className="admin-list admin-list--scroll">
        {visible.map(dish => <li className="admin-row admin-row--dish" key={dish.id}>
          <span className="admin-row__thumb">{dish.image && <img src={imageUrl(dish.image, 120)} alt="" loading="lazy" />}</span>
          <span className="admin-row__main">
            <b className="truncate">{dish.name}{dish.size && ` · ${dish.size}`}</b>
            <small className="truncate">{dish.category}{dish.product_type === 'combo' && ' · Combo'} · {dish.ingredients.join(', ') || dish.components?.join(' · ') || 'Sin ingredientes'}</small>
          </span>
          <span className={`pill admin-row__state ${dish.available ? 'pill--ok' : 'pill--cancelado'}`}>{dish.available ? 'Disponible' : 'Agotado'}</span>
          <strong className="num admin-row__price">{formatDishPrice(dish)}</strong>
          <span className="admin-row__actions">
            <button className="icon-btn" onClick={() => setEdit(dish)} aria-label={`Editar ${dish.name}`}><Pencil size={18} /></button>
            <button className="icon-btn admin-danger" onClick={() => remove(dish)} aria-label={`Eliminar ${dish.name}`}><Trash2 size={18} /></button>
          </span>
        </li>)}
      </ul>

      <dialog className="admin-dialog" ref={dialog} onClose={() => setEdit(null)}>
        {edit && <form className="form" onSubmit={save}>
          <div className="admin-dialog__head">
            <h2>{edit.name ? 'Editar plato' : 'Nuevo plato'}</h2>
            <button type="button" className="icon-btn" onClick={() => setEdit(null)} aria-label="Cerrar"><X size={22} /></button>
          </div>
          <label className="field"><span>Nombre</span><input className="input" name="name" defaultValue={edit.name} required /></label>
          <div className="form-row">
            <label className="field"><span>Categoría</span>
              <Select name="category" defaultValue={edit.category}>{categoryRows.map(c => <option key={c.name}>{c.name}</option>)}</Select>
            </label>
            <label className="field"><span>Tamaño o variante</span><input className="input" name="size" defaultValue={edit.size} /></label>
          </div>
          <div className="form-row">
            <label className="field"><span>Precio CLP</span><input className="input" type="number" name="price" min="0" inputMode="numeric" defaultValue={edit.price_clp ?? ''} /></label>
            <label className="field"><span>Tipo</span>
              <Select name="product_type" defaultValue={edit.product_type ?? 'dish'}><option value="dish">Plato</option><option value="combo">Combo</option></Select>
            </label>
          </div>
          <label className="field"><span>Descripción</span><textarea className="input" name="description" defaultValue={edit.description} /></label>
          <label className="field"><span>Ingredientes</span><textarea className="input" name="ingredients" defaultValue={edit.ingredients.join(', ')} /><small>Separados por coma.</small></label>
          <label className="field"><span>Componentes incluidos</span><textarea className="input" name="components" defaultValue={(edit.components ?? []).join('\n')} /><small>Uno por línea.</small></label>
          <label className="field"><span>Extras</span><textarea className="input" name="extras" defaultValue={edit.extras.map(x => `${x.name}:${x.price_clp}:${x.is_included ?? false}`).join('\n')} /><small>Uno por línea: nombre:precio:incluido (true/false).</small></label>
          <div className="form-row">
            <label className="field"><span>Selecciones requeridas</span><input className="input" type="number" min="0" name="extra_selection_limit" defaultValue={edit.extra_selection_limit ?? 0} /><small>0 si no aplica.</small></label>
            <label className="field"><span>Imagen</span><input className="input" name="image" defaultValue={edit.image} placeholder="URL o identificador" /></label>
          </div>
          <label className="check"><input type="checkbox" name="available" defaultChecked={edit.available} /> Disponible</label>
          {error && <p className="alert">{error}</p>}
          <div className="admin-dialog__actions">
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setEdit(null)}>Cancelar</button>
          </div>
        </form>}
      </dialog>
    </section>
  );
}

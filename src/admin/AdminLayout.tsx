import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Login } from './Login';

export function AdminLayout() {
  const [session, setSession] = useState<any>(null);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function check() {
      if (!supabase || !session) { setAllowed(false); setLoading(false); return; }
      const { data, error } = await supabase.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle();
      setAllowed(!error && !!data);
      setLoading(false);
    }
    check();
  }, [session]);

  if (loading) return <main className="admin-center"><p className="muted">Cargando…</p></main>;
  if (!supabase) return <Login configMissing />;
  if (!session || !allowed) return <Login unauthorized={!!session} />;

  return (
    <div className="admin">
      <header className="admin__bar">
        <Link className="brand" to="/">
          <img src="/images/logo.jpeg" alt="" width={40} height={40} />
          <span>Admin <b>77</b></span>
        </Link>
        <nav aria-label="Administración">
          <NavLink to="/admin" end>Platos</NavLink>
          <NavLink to="/admin/orders">Pedidos</NavLink>
          <NavLink to="/admin/categories">Categorías</NavLink>
          <NavLink to="/admin/promotions">Promos</NavLink>
          <NavLink to="/admin/settings">Local</NavLink>
        </nav>
        <button className="btn btn-outline btn-sm" onClick={() => supabase?.auth.signOut()}><LogOut size={16} /> Salir</button>
      </header>
      <main className="admin__body"><Outlet /></main>
    </div>
  );
}

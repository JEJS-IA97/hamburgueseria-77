import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { ErrorState, LoadingState } from '../components/ui/LoadState';

const defaultAddress = 'C. 1 Nte. 0115, 4780000 Labranza, Temuco, Araucanía, Chile';

export function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [settings, setSettings] = useState<{ whatsapp_number?: string | null; instagram_url?: string | null; tiktok_url?: string | null; address?: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    if (!supabase) { setError('Supabase no está configurado.'); setLoading(false); return; }
    Promise.resolve(supabase.from('settings').select('*').eq('id', true).maybeSingle()).then(({ data, error }) => {
      if (!active) return;
      if (error) setError(error.message);
      else if (!data) setError('Todavía no hay datos del local guardados en Supabase.');
      else if (data) {
        setSettings(data);
        setError('');
      }
      setLoading(false);
    }).catch(() => { if (active) { setError('No se pudieron cargar los datos del local desde el servidor.'); setLoading(false); } });
    return () => { active = false; };
  }, [attempt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const f = new FormData(event.currentTarget);
    const values = {
      whatsapp_number: String(f.get('whatsapp_number') ?? ''),
      instagram_url: String(f.get('instagram_url') ?? ''),
      tiktok_url: String(f.get('tiktok_url') ?? ''),
      address: String(f.get('address') ?? defaultAddress),
    };
    const { error } = await supabase.from('settings').update(values).eq('id', true);
    if (error) setError(error.message);
    else { setError(''); setSaved(true); }
  }

  return (
    <section>
      <div className="admin__head">
        <div>
          <h1>Datos del local</h1>
          <p className="muted">Contacto, redes y ubicación que aparecen en la carta.</p>
        </div>
      </div>
      {loading ? <LoadingState label="Cargando los datos del local…" /> : error ? <ErrorState message={error} onRetry={() => setAttempt(value => value + 1)} /> : <form className="form-card admin-section" onSubmit={submit} onInput={() => setSaved(false)}>
        <label className="field"><span>WhatsApp</span><input className="input" name="whatsapp_number" inputMode="numeric" defaultValue={settings?.whatsapp_number ?? ''} placeholder="56912345678" /><small>Código de país + número, solo dígitos.</small></label>
        <div className="form-row">
          <label className="field"><span>Instagram</span><input className="input" name="instagram_url" type="url" defaultValue={settings?.instagram_url ?? ''} placeholder="https://instagram.com/…" /></label>
          <label className="field"><span>TikTok</span><input className="input" name="tiktok_url" type="url" defaultValue={settings?.tiktok_url ?? ''} placeholder="https://tiktok.com/@…" /></label>
        </div>
        <label className="field"><span>Dirección</span><input className="input" name="address" defaultValue={settings?.address ?? defaultAddress} /></label>
        {error && <p className="alert">{error}</p>}
        {saved && <p className="notice notice--ok">Datos guardados.</p>}
        <div className="admin-dialog__actions"><button className="btn btn-primary">Guardar datos</button></div>
      </form>}
    </section>
  );
}

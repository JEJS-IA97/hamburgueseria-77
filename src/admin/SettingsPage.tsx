import { useEffect, useRef, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

const defaultAddress = 'C. 1 Nte. 0115, 4780000 Labranza, Temuco, Araucanía, Chile';

export function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    supabase?.from('settings').select('*').eq('id', true).maybeSingle().then(({ data }) => {
      if (!form.current || !data) return;
      for (const [key, value] of Object.entries(data)) {
        const input = form.current.elements.namedItem(key) as HTMLInputElement | null;
        if (input && value != null) input.value = String(value);
      }
    });
  }, []);

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
    const { error } = await supabase.from('settings').upsert({ id: true, ...values });
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
      <form ref={form} className="form-card admin-section" onSubmit={submit} onInput={() => setSaved(false)}>
        <label className="field"><span>WhatsApp</span><input className="input" name="whatsapp_number" inputMode="numeric" placeholder="56912345678" /><small>Código de país + número, solo dígitos.</small></label>
        <div className="form-row">
          <label className="field"><span>Instagram</span><input className="input" name="instagram_url" type="url" placeholder="https://instagram.com/…" /></label>
          <label className="field"><span>TikTok</span><input className="input" name="tiktok_url" type="url" placeholder="https://tiktok.com/@…" /></label>
        </div>
        <label className="field"><span>Dirección</span><input className="input" name="address" defaultValue={defaultAddress} /></label>
        {error && <p className="alert">{error}</p>}
        {saved && <p className="notice notice--ok">Datos guardados.</p>}
        <div className="admin-dialog__actions"><button className="btn btn-primary">Guardar datos</button></div>
      </form>
    </section>
  );
}

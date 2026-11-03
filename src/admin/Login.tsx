import { useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Supabase responde en inglés; el equipo del local lee español.
const authError = (message: string) => {
  if (/invalid login credentials/i.test(message)) return 'Correo o contraseña incorrectos. Revisa que el correo sea el de la cuenta autorizada.';
  if (/email not confirmed/i.test(message)) return 'Esta cuenta aún no confirmó su correo. Revisa la invitación de Supabase.';
  if (/rate limit|too many/i.test(message)) return 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.';
  if (/fetch|network/i.test(message)) return 'No hay conexión con el servidor. Revisa internet o si el proyecto de Supabase está pausado.';
  return message;
};

export function Login({ configMissing = false, unauthorized = false }: { configMissing?: boolean; unauthorized?: boolean }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: String(form.get('email')).trim(), password: String(form.get('password')) });
    setBusy(false);
    setError(error ? authError(error.message) : '');
  }

  return (
    <main className="login-page">
      <aside className="login-page__brand" aria-hidden="true">
        <img className="login-page__bg" src="/images/hero-festin-callejero.png" alt="" />
        <div className="login-page__brand-copy">
          <img src="/images/logo.jpeg" alt="" width={88} height={88} />
          <p className="display">Panel del <em>local</em></p>
          <p>Platos, combos, pedidos y datos de Hamburguesería 77.</p>
        </div>
      </aside>

      <section className="login-page__form">
        <Link to="/" className="back-link"><ArrowLeft size={18} /> Volver a la carta</Link>
        <form className="login" onSubmit={submit} noValidate={false}>
          <img className="login__logo" src="/images/logo.jpeg" alt="" width={56} height={56} />
          <div className="login__head">
            <h1 className="display">Iniciar <em>sesión</em></h1>
            <p className="muted">{unauthorized ? 'Esta cuenta no tiene acceso de administrador. Entra con una cuenta autorizada.' : 'Solo para el equipo de Hamburguesería 77.'}</p>
          </div>
          {configMissing
            ? <p className="notice">Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para activar el panel.</p>
            : <>
                <label className="field"><span>Correo</span>
                  <input className="input" type="email" name="email" autoComplete="email" inputMode="email" required aria-invalid={!!error} />
                </label>
                <label className="field"><span>Contraseña</span>
                  <span className="login__password">
                    <input className="input" type={show ? 'text' : 'password'} name="password" autoComplete="current-password" required aria-invalid={!!error} />
                    <button type="button" className="icon-btn" onClick={() => setShow(value => !value)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </label>
                {error && <p className="alert" role="alert">{error}</p>}
                <button className="btn btn-primary btn-block login__submit" disabled={busy}>
                  {busy ? <><LoaderCircle size={18} className="spin" /> Entrando…</> : 'Entrar al panel'}
                </button>
              </>}
        </form>
      </section>
    </main>
  );
}

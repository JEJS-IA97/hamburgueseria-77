import { Link } from 'react-router-dom';

export function NotFound({ message = 'No encontramos esta página.' }: { message?: string }) {
  return <main className="container page not-found">
    <p className="not-found__code">404</p>
    <h1 className="display">Página no encontrada</h1>
    <p className="muted">{message}</p>
    <Link className="btn btn-primary" to="/#menu">Volver al menú</Link>
  </main>;
}

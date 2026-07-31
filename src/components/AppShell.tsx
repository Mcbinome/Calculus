import { Link, useLocation } from 'react-router-dom'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <p className="brand-name">Calcul Insuline</p>
            <p className="brand-sub">Dose repas &amp; rattrapage</p>
          </div>
        </div>
        <nav className="topnav" aria-label="Navigation">
          <Link
            to="/"
            className={pathname === '/' ? 'nav-link active' : 'nav-link'}
          >
            Calcul
          </Link>
          <Link
            to="/aliments"
            className={pathname === '/aliments' ? 'nav-link active' : 'nav-link'}
          >
            Aliments
          </Link>
          <Link
            to="/admin"
            className={pathname === '/admin' ? 'nav-link active' : 'nav-link'}
          >
            Paramètres
          </Link>
        </nav>
      </header>
      <main className="main">{children}</main>
      <p className="disclaimer">
        Outil d’aide au calcul selon le schéma médical. Vérifier toujours la dose
        avant injection.
      </p>
    </div>
  )
}

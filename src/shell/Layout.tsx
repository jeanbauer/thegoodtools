import { Link, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <>
      <header className="shell-header">
        <div className="shell-header-inner">
          <Link to="/" className="brand" aria-label="thegoodtools home">
            <span className="brand-mark" aria-hidden>
              t
            </span>
            <span>
              thegoodtools<span className="brand-dot">.</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
      <footer className="shell-footer">
        <div className="shell-footer-inner">
          <span>thegoodtools inc</span>
          <span>small tools that just work — free, fast, no sign-up</span>
        </div>
      </footer>
    </>
  )
}

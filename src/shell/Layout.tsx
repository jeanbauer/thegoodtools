import { Link, Outlet } from 'react-router-dom'
import { PaletteSwitcher } from './PaletteSwitcher'

const privacyPoints = [
  {
    icon: '🚪',
    title: 'No sign-up, ever',
    text: "There's no account to create — we wouldn't know what to do with one.",
  },
  {
    icon: '🏠',
    title: 'Your data stays home',
    text: 'Every tool runs entirely in your browser. Text you paste and files you drop never touch a server.',
  },
  {
    icon: '🧹',
    title: 'Nothing is stored',
    text: 'No databases, no logs of your content. Close the tab and it’s like you were never here.',
  },
]

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
          <PaletteSwitcher />
        </div>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
      <footer className="shell-footer">
        <div className="shell-footer-inner">
          <div className="privacy-strip" aria-label="Privacy promises">
            {privacyPoints.map((point) => (
              <div key={point.title} className="privacy-point">
                <span className="privacy-icon" aria-hidden>
                  {point.icon}
                </span>
                <div>
                  <h2>{point.title}</h2>
                  <p>{point.text}</p>
                </div>
              </div>
            ))}
            <Link to="/privacy" className="privacy-more">
              The full privacy story →
            </Link>
          </div>
          <div className="shell-footer-line">
            <span>thegoodtools inc</span>
            <span>small tools that just work</span>
          </div>
        </div>
      </footer>
    </>
  )
}

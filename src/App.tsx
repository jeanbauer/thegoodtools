import { Suspense, useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './shell/Layout'
import { Home } from './pages/Home'
import { Privacy } from './pages/Privacy'
import { tools } from './tools/registry'

function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Nothing lives at this address.</p>
      <Link to="/">Back to all tools</Link>
    </div>
  )
}

/** Keeps document.title and meta description in sync with the route. */
function RouteMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const base = 'thegoodtools — small tools that just work'
    const tool = tools.find((t) => pathname === `/tools/${t.id}`)
    const titles: Record<string, string> = {
      '/': base,
      '/privacy': 'Privacy — thegoodtools',
    }
    document.title = tool ? `${tool.name} — thegoodtools` : (titles[pathname] ?? base)

    const meta = document.querySelector('meta[name="description"]')
    if (meta && tool) {
      meta.setAttribute('content', `${tool.tagline} Free, fast, runs in your browser.`)
    } else if (meta) {
      meta.setAttribute(
        'content',
        'thegoodtools — a collection of small, fast, free web utilities that just work.',
      )
    }
  }, [pathname])

  return null
}

export default function App() {
  return (
    <>
      <RouteMeta />
      <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        {tools.map((tool) => (
          <Route
            key={tool.id}
            path={`/tools/${tool.id}`}
            element={
              <Suspense fallback={null}>
                <tool.component />
              </Suspense>
            }
          />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
      </Routes>
    </>
  )
}

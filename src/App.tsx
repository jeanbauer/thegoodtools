import { Suspense } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
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

export default function App() {
  return (
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
  )
}

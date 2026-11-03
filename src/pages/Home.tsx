import { Link } from 'react-router-dom'
import { tools } from '../tools/registry'

export function Home() {
  return (
    <>
      <section className="hero">
        <h1>
          Small tools that <em>just work</em>.
        </h1>
        <p>
          A growing collection of fast, free utilities. No sign-up, no
          uploads to a server — everything runs in your browser.
        </p>
      </section>

      {tools.length === 0 ? (
        <div className="empty-state">
          <p>
            The workshop is open and the first tools are being built.
            <br />
            Check back soon.
          </p>
        </div>
      ) : (
        <div className="tool-grid">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              to={`/tools/${tool.id}`}
              className="tool-card"
              // Warm the tool's chunk on hover so navigation feels instant.
              onMouseEnter={() => void tool.load()}
              onFocus={() => void tool.load()}
            >
              <div className="tool-card-icon" aria-hidden>
                {tool.icon}
              </div>
              <h2>{tool.name}</h2>
              <p>{tool.tagline}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

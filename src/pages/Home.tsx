import { Link } from 'react-router-dom'
import { tools } from '../tools/registry'

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

export function Home() {
  return (
    <>
      <section className="hero">
        <h1>
          Small tools that <em>just work</em>.
        </h1>
        <p>
          A growing collection of fast, free utilities that run entirely in
          your browser — no sign-up, no uploads, nothing stored.
        </p>
      </section>

      <section className="privacy-strip" aria-label="Privacy promises">
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

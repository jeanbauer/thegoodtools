export function Privacy() {
  return (
    <article className="privacy-page">
      <h1>The privacy story, in plain language</h1>
      <p className="lede">
        Short version: we can't see your data, because it never reaches us.
        Here's the slightly longer version.
      </p>

      <h2>Everything runs on your device</h2>
      <p>
        Every tool on thegoodtools is a small program that your browser
        downloads once and then runs locally — like a calculator app, not a
        website form. When you paste text, drop a file, or upload an image,
        it's processed by your own device. It is never sent over the network
        to us or anyone else.
      </p>

      <h2>Nothing is stored</h2>
      <p>
        There are no accounts, no databases of your content, and no server
        logs of what you paste or generate. We couldn't sell or leak your
        data even if we wanted to — we simply never have it. When you close
        the tab, everything you did is gone.
      </p>

      <h2>No tracking</h2>
      <p>
        No analytics cookies, no fingerprinting, no third-party trackers.
        The site is served as static files from GitHub Pages; GitHub's own
        infrastructure may keep standard server logs (like any web host),
        but those contain technical request metadata, never your tool input.
      </p>

      <h2>Want proof?</h2>
      <p>
        The whole site is open source — you can read every line that runs.
        Or open your browser's network inspector while using a tool: you'll
        see your data go exactly nowhere.
      </p>
    </article>
  )
}

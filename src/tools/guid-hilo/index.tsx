import { useState } from 'react'
import { ToolPage } from '../../shared/ToolPage'
import { CopyButton } from '../../shared/CopyButton'
import { guidToHiLo, hiLoToGuid, parseInt64 } from './guid-hilo'
import './guid-hilo.css'

export default function GuidHiloTool() {
  const [guidInput, setGuidInput] = useState('')
  const [hiInput, setHiInput] = useState('')
  const [loInput, setLoInput] = useState('')

  // Derived purely from input — errors are computed, not stored.
  let hilo: { hi: bigint; lo: bigint } | null = null
  let guidError: string | null = null
  if (guidInput.trim()) {
    try {
      hilo = guidToHiLo(guidInput)
    } catch {
      guidError =
        "That doesn't look like a GUID — expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
  }

  let guidResult: string | null = null
  let hiloError: string | null = null
  if (hiInput.trim() || loInput.trim()) {
    try {
      if (!hiInput.trim() || !loInput.trim()) throw new Error('both-required')
      guidResult = hiLoToGuid(parseInt64(hiInput), parseInt64(loInput))
    } catch (e) {
      hiloError =
        e instanceof Error && e.message === 'both-required'
          ? 'Both hi and lo are needed to rebuild the GUID.'
          : e instanceof Error && e.message === 'out-of-range'
            ? 'That number overflows a signed 64-bit integer.'
            : 'Whole numbers only — hi and lo are int64s.'
    }
  }

  return (
    <ToolPage
      name="GUID Hi-Lo Converter"
      tagline="Turn a GUID into the hi/lo int64 pair gRPC services use — and back again."
    >
      <div className="guid-layout">
        <section className="guid-panel">
          <h2>GUID → hi / lo</h2>
          <div className="guid-field">
            <label htmlFor="guid-input">GUID</label>
            <input
              id="guid-input"
              className="guid-input"
              placeholder="550e8400-e29b-41d4-a716-446655440000"
              spellCheck={false}
              value={guidInput}
              onChange={(e) => setGuidInput(e.target.value)}
            />
          </div>
          {guidError && (
            <p role="alert" className="form-error">
              {guidError}
            </p>
          )}
          {hilo && (
            <div className="guid-hilo-row">
              <div className="guid-field">
                <label>hi</label>
                <div className="guid-output">
                  <code>{hilo.hi.toString()}</code>
                  <CopyButton value={hilo.hi.toString()} />
                </div>
              </div>
              <div className="guid-field">
                <label>lo</label>
                <div className="guid-output">
                  <code>{hilo.lo.toString()}</code>
                  <CopyButton value={hilo.lo.toString()} />
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="guid-panel">
          <h2>hi / lo → GUID</h2>
          <div className="guid-hilo-row">
            <div className="guid-field">
              <label htmlFor="hi-input">hi</label>
              <input
                id="hi-input"
                className="guid-input"
                placeholder="4743665464302797824"
                spellCheck={false}
                inputMode="numeric"
                value={hiInput}
                onChange={(e) => setHiInput(e.target.value)}
              />
            </div>
            <div className="guid-field">
              <label htmlFor="lo-input">lo</label>
              <input
                id="lo-input"
                className="guid-input"
                placeholder="75133578647207"
                spellCheck={false}
                inputMode="numeric"
                value={loInput}
                onChange={(e) => setLoInput(e.target.value)}
              />
            </div>
          </div>
          {hiloError && (
            <p role="alert" className="form-error">
              {hiloError}
            </p>
          )}
          {guidResult && (
            <div className="guid-field">
              <label>GUID</label>
              <div className="guid-output">
                <code>{guidResult}</code>
                <CopyButton value={guidResult} />
              </div>
            </div>
          )}
        </section>

        <p className="guid-note">
          Convention: .NET byte layout (first three groups little-endian), then{' '}
          <code>hi</code> = first 8 bytes and <code>lo</code> = last 8 bytes as
          little-endian int64. Runs entirely in your browser.
        </p>
      </div>
    </ToolPage>
  )
}

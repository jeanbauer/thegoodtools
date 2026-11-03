import { useState } from 'react'

/** Shared copy-to-clipboard button with transient confirmation. */
export function CopyButton({ value, className = '' }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className={className || 'copy-btn'}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

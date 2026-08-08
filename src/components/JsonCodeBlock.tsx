import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}


function highlightJsonLine(line: string): string {
  const escaped = escapeHtml(line)
  return escaped.replace(
    /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match) => {
      if (match.startsWith('"')) {
        return /:\s*$/.test(match)
          ? `<span class="json-key">${match}</span>`
          : `<span class="json-string">${match}</span>`
      }
      if (match === 'true' || match === 'false') return `<span class="json-boolean">${match}</span>`
      if (match === 'null') return `<span class="json-null">${match}</span>`
      return `<span class="json-number">${match}</span>`
    },
  )
}


export default function JsonCodeBlock({
  value,
  emptyLabel = '(no content)',
}: {
  value: unknown
  emptyLabel?: string
}) {
  const [copied, setCopied] = useState(false)

  let text: string
  let isJson = true
  if (value === undefined || value === null || value === '') {
    text = emptyLabel
    isJson = false
  } else if (typeof value === 'string') {
    try {
      text = JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      text = value
      isJson = false
    }
  } else {
    text = JSON.stringify(value, null, 2)
  }

  const lines = text.split('\n')

  const handleCopy = () => {
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="json-code-block">
      <div className="json-code-block__toolbar">
        {isJson && <span className="json-code-block__format">JSON format</span>}
        <button type="button" className="json-code-block__copy" onClick={handleCopy}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="json-code-block__body" tabIndex={0} role="region" aria-label="JSON content, scrollable area">
        <code>
          {lines.map((line, i) => (
            <span key={i} className="json-code-block__line">
              <span className="json-code-block__lineno">{i + 1}</span>
              {isJson ? (
                <span
                  className="json-code-block__linecontent"
                  dangerouslySetInnerHTML={{ __html: highlightJsonLine(line) || '&nbsp;' }}
                />
              ) : (
                <span className="json-code-block__linecontent">{line || ' '}</span>
              )}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}

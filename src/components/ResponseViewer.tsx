import { useState } from 'react'
import { Check, Copy, RefreshCw, AlertTriangle } from 'lucide-react'
import { NOISY_HEADERS, STATUS_COLORS, type TestResult } from '../lib/mockTest'

function formatBody(body?: string): string {
	if (!body) return '(pas de contenu)'
	try {
		return JSON.stringify(JSON.parse(body), null, 2)
	} catch {
		return body
	}
}

export default function ResponseViewer({
	requestLabel,
	result,
	onRetry,
	retrying,
}: {
	requestLabel: string
	result: TestResult
	onRetry?: () => void
	retrying?: boolean
}) {
	const [copied, setCopied] = useState(false)

	if (result.error) {
		return (
			<div className="response-viewer__error" role="alert">
				<AlertTriangle size={18} />
				<span>{result.error}</span>
			</div>
		)
	}

	const formatted = formatBody(result.body)
	const meta =
		typeof result.status === 'number'
			? STATUS_COLORS[String(result.status)[0]] ?? STATUS_COLORS['5']
			: null
	const headers = Object.entries(result.headers ?? {}).filter(
		([key]) => !NOISY_HEADERS.has(key.toLowerCase()),
	)

	const handleCopy = () => {
		void navigator.clipboard.writeText(formatted)
		setCopied(true)
		setTimeout(() => setCopied(false), 1500)
	}

	return (
		<div className="response-viewer">
			<div className="response-viewer__meta">
				<span className="response-viewer__request">{requestLabel}</span>
				{meta && typeof result.status === 'number' && (
					<span
						className="response-viewer__status"
						style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
					>
						{result.status}
					</span>
				)}
				{typeof result.timeMs === 'number' && (
					<span className="response-viewer__time">{result.timeMs} ms</span>
				)}
				{onRetry && (
					<button
						type="button"
						className="response-viewer__retry"
						onClick={onRetry}
						disabled={retrying}
					>
						<RefreshCw size={13} />
						{retrying ? 'Test en cours…' : 'Relancer'}
					</button>
				)}
			</div>

			{headers.length > 0 && (
				<div className="response-viewer__headers">
					{headers.map(([key, value]) => (
						<div key={key} className="response-viewer__header-row">
							<span className="response-viewer__header-key">{key}</span>
							<span className="response-viewer__header-value">{value}</span>
						</div>
					))}
				</div>
			)}

			<div className="response-viewer__panel">
				<div className="response-viewer__panel-header">
					<span className="response-viewer__dots" aria-hidden="true">
						<span />
						<span />
						<span />
					</span>
					<span className="response-viewer__filename">response.json</span>
					<span className="response-viewer__size">
						{formatted.split('\n').length} lignes · {formatted.length} caractères
					</span>
					<button
						type="button"
						className={`response-viewer__copy ${copied ? 'response-viewer__copy--copied' : ''}`}
						onClick={handleCopy}
					>
						{copied ? <Check size={13} /> : <Copy size={13} />}
						{copied ? 'Copié' : 'Copier'}
					</button>
				</div>
				<pre
					className="response-viewer__body"
					tabIndex={0}
					role="region"
					aria-label="Corps de la réponse, zone défilable"
				>
					{formatted}
				</pre>
			</div>
		</div>
	)
}

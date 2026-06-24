import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

type SpecificationFormat = 'yaml' | 'yml' | 'json'

type SpecificationItem = {
	id: string
	name: string
	fileName: string
	format: SpecificationFormat
	content: string
	createdAt: string
	size: number
	summary: {
		endpointCount: number
		operationCount: number
	}
}

const apiBaseUrl = '/api/specifications'

type ParsedOperation = {
	path: string
	method: string
	summary?: string
	description?: string
	operationId?: string
	tags?: string[]
	parameters?: Array<{
		name: string
		in: string
		required?: boolean
		description?: string
		schema?: Record<string, unknown>
	}>
	requestBody?: {
		required?: boolean
		content?: Record<string, unknown>
	}
	responses?: Record<string, { description?: string; content?: Record<string, unknown> }>
	security?: Array<Record<string, string[]>>
	xControls?: Record<string, string>
}

type ParsedSpec = {
	title: string
	description?: string
	version: string
	servers?: Array<{ url: string; description?: string }>
	tags?: Array<{ name: string; description?: string }>
	operations: ParsedOperation[]
}

function parseOpenApiContent(content: string, format: SpecificationFormat): ParsedSpec | null {
	try {
		let raw: Record<string, unknown>

		if (format === 'json') {
			raw = JSON.parse(content) as Record<string, unknown>
		} else {
			try {
				// @ts-ignore
				if (typeof window !== 'undefined' && window.jsyaml) {
					// @ts-ignore
					raw = window.jsyaml.load(content) as Record<string, unknown>
				} else {
					return { title: 'Spécification YAML', version: 'inconnu', operations: [] }
				}
			} catch {
				return null
			}
		}

		const info = raw.info as Record<string, string> | undefined
		const paths = raw.paths as Record<string, Record<string, unknown>> | undefined
		const servers = raw.servers as Array<{ url: string; description?: string }> | undefined
		const tags = raw.tags as Array<{ name: string; description?: string }> | undefined

		const operations: ParsedOperation[] = []

		if (paths) {
			for (const [path, methods] of Object.entries(paths)) {
				for (const [method, opRaw] of Object.entries(methods)) {
					if (['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) {
						const op = opRaw as Record<string, unknown>
						const xControls: Record<string, string> = {}
						for (const [k, v] of Object.entries(op)) {
							if (k.startsWith('x-') && typeof v === 'string') xControls[k] = v
						}
						operations.push({
							path,
							method,
							summary: op.summary as string | undefined,
							description: op.description as string | undefined,
							operationId: op.operationId as string | undefined,
							tags: op.tags as string[] | undefined,
							parameters: op.parameters as ParsedOperation['parameters'],
							requestBody: op.requestBody as ParsedOperation['requestBody'],
							responses: op.responses as ParsedOperation['responses'],
							xControls,
						})
					}
				}
			}
		}

		return {
			title: info?.title ?? 'Sans titre',
			description: info?.description,
			version: info?.version ?? '—',
			servers,
			tags,
			operations,
		}
	} catch {
		return null
	}
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat('fr-FR', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value))
}

function formatSize(bytes: number) {
	if (bytes < 1024) return `${bytes} o`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
	return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export default function SpecificationViewPage() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [spec, setSpec] = useState<SpecificationItem | null>(null)
	const [parsed, setParsed] = useState<ParsedSpec | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')


	useEffect(() => {
		const load = async () => {
			setLoading(true)
			try {
				const response = await fetch(`${apiBaseUrl}/${id}`)
				if (!response.ok) throw new Error('Spécification introuvable.')
				const data = (await response.json()) as SpecificationItem
				setSpec(data)
				const p = parseOpenApiContent(data.content, data.format)
				setParsed(p)
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Erreur de chargement.')
			} finally {
				setLoading(false)
			}
		}
		void load()
	}, [id])



	if (loading) {
		return (
			<div className="app-shell">
				<Sidebar />
				<div className="app-main">
					<Navbar />
					<main className="app-stage">
						<div className="spec-empty spec-loading-full">
							<div className="spec-spinner" />
							Chargement de la spécification…
						</div>
					</main>
				</div>
			</div>
		)
	}

	if (error || !spec) {
		return (
			<div className="app-shell">
				<Sidebar />
				<div className="app-main">
					<Navbar />
					<main className="app-stage">
						<div className="alert alert-danger m-4">{error || 'Spécification introuvable.'}</div>
					</main>
				</div>
			</div>
		)
	}

	return (
		<div className="app-shell">
			<Sidebar />
			<div className="app-main">
				<Navbar />
				<main className="app-stage">
					<div className="spec-page">

						{/* ── Retour ── */}
						<button type="button" className="spec-back-btn" onClick={() => navigate('/specifications')}>
							<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
								<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
							</svg>
							Retour aux spécifications
						</button>

						<button type="button" className="spec-back-btn" onClick={() => navigate(`/specifications/${id}/endpoints`)}>
							<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
								<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
							</svg>
							Voir les endpoints
						</button>

						
{/* ── Détails ── */}
<section className="spec-card">
	<div className="panel-header">
		<div>
			<p className="section-kicker text-orange mb-1">
				Métadonnées
			</p>
			<h2 className="panel-title mb-0">
				Détails de la spécification
			</h2>
		</div>
	</div>

	<div className="spec-edit-meta-grid">

		<div className="form-group">
			<span>Nom</span>
			<div className="form-control">
				{parsed?.title || spec.name}
			</div>
		</div>

		<div className="form-group">
			<span>Nom du fichier</span>
			<div className="form-control">
				{spec.fileName}
			</div>
		</div>

		<div className="form-group">
			<span>Format</span>
			<div className="form-control">
				{spec.format.toUpperCase()}
			</div>
		</div>

		<div className="form-group">
			<span>Date d'ajout</span>
			<div className="form-control">
				{formatDate(spec.createdAt)}
			</div>
		</div>

		<div className="form-group">
			<span>Taille</span>
			<div className="form-control">
				{formatSize(spec.size)}
			</div>
		</div>

	</div>

</section>

<section className="spec-card spec-editor-card">
	<div className="panel-header">
		<div>
			<p className="section-kicker text-orange mb-1">
				Contenu
			</p>
			<h2 className="panel-title mb-0">
				Contenu du fichier
			</h2>
		</div>

		<div className="spec-editor-toolbar">

			<span className="spec-editor-stat">
				{spec.content.split('\n').length} lignes
			</span>

			{/* <span className="spec-editor-stat">
				{formatSize(spec.size)}
			</span> */}

			<span className={`spec-badge spec-badge--${spec.format}`}>
				{spec.format.toUpperCase()}
			</span>


		</div>
	</div>

	<div className="spec-code-editor">
		<pre
			className="spec-code-editor__textarea"
			style={{
				margin: 0,
				border: 0,
				resize: 'none',
				whiteSpace: 'pre-wrap',
				overflow: 'auto'
			}}
		>
			{spec.content}
		</pre>
	</div>
</section>

					</div>
				</main>
			</div>
		</div>
	)
}
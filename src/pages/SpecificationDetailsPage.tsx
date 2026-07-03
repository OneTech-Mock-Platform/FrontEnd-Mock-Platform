import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { getToken } from '../services/api'

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
/* 
type Endpoint = {
	id: string
	path: string
	method: string
	summary?: string
	responses?: Record<string, string>
}
 */


type EndpointDetails = {
  description?: string
  operationId?: string
  tags: string[]
  parameters: {
    name: string
    in: string
    required: boolean
    description?: string
  }[]
  requestBody?: {
    required: boolean
    contentType: string
  }
  responses: {
    statusCode: string
    description: string
    contentType?: string
  }[]
}

type Endpoint = {
  id: string
  path: string
  method: string
  summary?: string
  responses?: EndpointDetails
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

const methodColors: Record<string, { bg: string; text: string; border: string }> = {
	GET: { bg: 'rgba(34,197,94,0.12)', text: '#15803d', border: 'rgba(34,197,94,0.25)' },
	POST: { bg: 'rgba(59,130,246,0.12)', text: '#1d4ed8', border: 'rgba(59,130,246,0.25)' },
	PUT: { bg: 'rgba(234,179,8,0.12)', text: '#a16207', border: 'rgba(234,179,8,0.25)' },
	PATCH: { bg: 'rgba(168,85,247,0.12)', text: '#6d28d9', border: 'rgba(168,85,247,0.25)' },
	DELETE: { bg: 'rgba(239,68,68,0.12)', text: '#b91c1c', border: 'rgba(239,68,68,0.25)' },
	OPTIONS: { bg: 'rgba(107,114,128,0.12)', text: '#4b5563', border: 'rgba(107,114,128,0.25)' },
	HEAD: { bg: 'rgba(107,114,128,0.12)', text: '#4b5563', border: 'rgba(107,114,128,0.25)' },
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
							method: method.toUpperCase(),
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

export default function SpecificationViewPage() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [spec, setSpec] = useState<SpecificationItem | null>(null)
	const [parsed, setParsed] = useState<ParsedSpec | null>(null)
	const [endpoints, setEndpoints] = useState<Endpoint[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
	const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null)

	useEffect(() => {
		const load = async () => {
			setLoading(true)
			try {
				const token = getToken()
				const headers: Record<string, string> = {}
				if (token) {
					headers['Authorization'] = `Bearer ${token}`
				}

				const response = await fetch(`${apiBaseUrl}/${id}`, { headers })
				if (!response.ok) throw new Error('Spécification introuvable.')
				const data = (await response.json()) as SpecificationItem
				setSpec(data)
				const p = parseOpenApiContent(data.content, data.format)
				setParsed(p)

				// Load endpoints from API
				const endpointsResponse = await fetch(`${apiBaseUrl}/${id}/endpoints`, { headers })
				if (endpointsResponse.ok) {
					const endpointsData = await endpointsResponse.json()
					setEndpoints(endpointsData.items || [])
				}
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Erreur de chargement.')
			} finally {
				setLoading(false)
			}
		}
		void load()
	}, [id])

	const getMethodCount = (method: string) => {
		return endpoints.filter(e => e.method === method).length
	}

	const filteredEndpoints = selectedMethod
		? endpoints.filter(e => e.method === selectedMethod)
		: endpoints

	const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

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

						{/* ── Main Grid ── */}
						<div className="spec-details-grid">
							{/* Left Column - Details */}
							<div className="spec-details-left">
								{/* Metadata Card */}
								<section className="spec-card">
									<div className="panel-header">
										<div>
											<p className="section-kicker text-orange mb-1">Métadonnées</p>
											<h2 className="panel-title mb-0">Détails de la spécification</h2>
										</div>
									</div>

									<div className="spec-edit-meta-grid">
										<div className="form-group">
											<span>Nom</span>
											<div className="form-control">{parsed?.title || spec.name}</div>
										</div>

										<div className="form-group">
											<span>Nom du fichier</span>
											<div className="form-control">{spec.fileName}</div>
										</div>

										<div className="form-group">
											<span>Format</span>
											<div className="form-control">{spec.format.toUpperCase()}</div>
										</div>

										
										
									</div>
								</section>

								{/* Content Card */}
								<section className="spec-card spec-editor-card">
									<div className="panel-header">
										<div>
											<p className="section-kicker text-orange mb-1">Contenu</p>
											<h2 className="panel-title mb-0">Contenu du fichier</h2>
										</div>
										<div className="spec-editor-toolbar">
											<span className="spec-editor-stat">{spec.content.split('\n').length} lignes</span>
											<span className={`spec-badge spec-badge--${spec.format}`}>{spec.format.toUpperCase()}</span>
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

							{/* Right Column - Endpoints */}
							<div className="spec-endpoints-panel">
								<section className="spec-card spec-endpoints-card">
									<div className="panel-header">
										<div>
											<p className="section-kicker text-orange mb-1">Endpoints</p>
											<h2 className="panel-title mb-0">API Endpoints</h2>
										</div>
										<div className="spec-badge spec-badge--total">{endpoints.length} total</div>
									</div>

									{/* Method Filters */}
									<div className="spec-method-filters">
										<button
											className={`spec-method-btn ${selectedMethod === null ? 'is-active' : ''}`}
											onClick={() => setSelectedMethod(null)}
										>
											Tous
										</button>
										{methods.map(method => {
											const count = getMethodCount(method)
											if (count === 0) return null
											const colors = methodColors[method] || methodColors.GET
											return (
												<button
													key={method}
													className={`spec-method-btn ${selectedMethod === method ? 'is-active' : ''}`}
													onClick={() => setSelectedMethod(method)}
													style={{
														backgroundColor: selectedMethod === method ? colors.bg : 'transparent',
														color: selectedMethod === method ? colors.text : '#5e6475',
														borderColor: selectedMethod === method ? colors.border : '#e6e8f0'
													}}
												>
													{method}
													<span className="spec-method-count">{count}</span>
												</button>
											)
										})}
									</div>

									{/* Endpoints List */}
									<div className="spec-endpoints-list">
										{filteredEndpoints.length === 0 ? (
											<p className="spec-empty-text">Aucun endpoint trouvé</p>
										) : (
											filteredEndpoints.map(endpoint => {
												const colors = methodColors[endpoint.method] || methodColors.GET
												return (
													<div key={endpoint.id} className="spec-endpoint-item" onClick={() => setSelectedEndpoint(endpoint)}>
														<span
															className="spec-method-badge"
															style={{
																backgroundColor: colors.bg,
																color: colors.text,
																borderColor: colors.border
															}}
														>
															{endpoint.method}
														</span>
														<span className="spec-endpoint-path">{endpoint.path}</span>
														{endpoint.summary && (
															<span className="spec-endpoint-summary">{endpoint.summary}</span>
														)}
													</div>
												)
											})
										)}
									</div>
								</section>
							</div>
						</div>
					</div>
				</main>
			</div>

			{/* Endpoint Detail Modal */}
			{selectedEndpoint && (
				<div className="spec-modal-overlay" onClick={() => setSelectedEndpoint(null)}>
					<div className="spec-modal" onClick={(e) => e.stopPropagation()}>
						<div className="spec-modal__icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
							<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
							</svg>
						</div>
						<h3 className="spec-modal__title text-lg text-orange">Détails de l'endpoint</h3>
						<div className="spec-modal__body">
							<div style={{ marginBottom: '12px' }}>
								<strong>Méthode:</strong> {selectedEndpoint.method}
							</div>
							<div style={{ marginBottom: '12px' }}>
								<strong>Path:</strong> <code>{selectedEndpoint.path}</code>
							</div>
							{selectedEndpoint.summary && (
								<div style={{ marginBottom: '12px' }}>
									<strong>Summary:</strong> {selectedEndpoint.summary}
								</div>
							)}
						

							{selectedEndpoint.responses?.responses?.length ? (
  <div style={{ marginBottom: '12px' }}>
    <strong>Réponses:</strong>

    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {selectedEndpoint.responses.responses.map((res, index) => (
        <div
          key={index}
          style={{
            padding: '8px 10px',
            border: '1px solid #e6e8f0',
            borderRadius: '6px',
            background: '#f9fafb'
          }}
        >
          <div>
            <strong>Status:</strong> {res.statusCode}
          </div>

          <div>
            <strong>Description:</strong> {res.description}
          </div>

        
        </div>
      ))}
    </div>
  </div>
) : null}
						</div>
						<div className="spec-modal__actions">
							<button className="btn btn-secondary" onClick={() => setSelectedEndpoint(null)}>
								Fermer
							</button>
						</div>


	{/* <!-- Endpoint Detail Modal Actions -->*/}
<div className="spec-modal__actions">
  <button
    className="btn btn-orange"
    onClick={() => {
      navigate(`/endpoints/${selectedEndpoint!.id}/scenarios`)
      setSelectedEndpoint(null)
    }}
  >
    Voir les scénarios
  </button>
  <button
    className="btn btn-outline-secondary"
    onClick={() => setSelectedEndpoint(null)}
  >
    Fermer
  </button>
</div>


					</div>
				</div>
			)}
		</div>
	)
}
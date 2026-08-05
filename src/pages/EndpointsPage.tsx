import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { getToken } from '../services/api'

type Endpoint = {
	id: string
	path: string
	method: string
	summary?: string
}

const apiBaseUrl = '/api/endpoints'

const METHOD_META: Record<string, { color: string; bg: string; border: string; textColor: string }> = {
	GET:    { color: '#15803d', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   textColor: '#15803d' },
	POST:   { color: '#1d4ed8', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  textColor: '#1d4ed8' },
	PUT:    { color: '#a16207', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  textColor: '#a16207' },
	PATCH:  { color: '#6d28d9', bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.3)',  textColor: '#6d28d9' },
	DELETE: { color: '#b91c1c', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   textColor: '#b91c1c' },
}

const fallback = { color: '#4b5563', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)', textColor: '#4b5563' }

export default function EndpointsPage() {
	const { specId } = useParams<{ specId: string }>()
	const navigate = useNavigate()
	const [endpoints, setEndpoints] = useState<Endpoint[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [activeMethod, setActiveMethod] = useState<string | null>(null)
	const [search, setSearch] = useState('')

	useEffect(() => {
		const load = async () => {
			if (!specId) return
			setLoading(true)
			try {
				const token = getToken()
				const headers: Record<string, string> = {}
				if (token) {
					headers['Authorization'] = `Bearer ${token}`
				}

				const response = await fetch(`${apiBaseUrl}/specification/${specId}`, { headers })
				if (!response.ok) throw new Error('Impossible de charger les endpoints.')
				const data = (await response.json()) as { items: Endpoint[] }
				setEndpoints(data.items)
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Erreur de chargement.')
			} finally {
				setLoading(false)
			}
		}
		void load()
	}, [specId])

	const methodCounts = useMemo(() => {
		const counts: Record<string, number> = {}
		endpoints.forEach(ep => { counts[ep.method] = (counts[ep.method] || 0) + 1 })
		return counts
	}, [endpoints])

	const methodOrder = useMemo(
		() => Object.keys(methodCounts).sort((a, b) => (methodCounts[b] ?? 0) - (methodCounts[a] ?? 0)),
		[methodCounts]
	)

	const filtered = useMemo(() => {
		return endpoints.filter(ep => {
			const matchMethod = !activeMethod || ep.method === activeMethod
			const matchSearch = !search ||
				ep.path.toLowerCase().includes(search.toLowerCase()) ||
				ep.summary?.toLowerCase().includes(search.toLowerCase())
			return matchMethod && matchSearch
		})
	}, [endpoints, activeMethod, search])

	if (loading) {
		return (
			<div className="app-shell">
				<Sidebar />
				<div className="app-main">
					<Navbar />
					<main className="app-stage">
						<div className="spec-empty spec-loading-full">
							<div className="spec-spinner" />
							Chargement des endpoints…
						</div>
					</main>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="app-shell">
				<Sidebar />
				<div className="app-main">
					<Navbar />
					<main className="app-stage">
						<div className="alert alert-danger m-4">{error}</div>
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

						{/* Header */}
						<div className="spec-page__header">
							<div>
								<button type="button" className="spec-back-btn" onClick={() => navigate(-1)}>
									<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
										<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
									</svg>
									Retour
								</button>
								<p className="section-kicker text-orange mb-1">OpenAPI</p>
								<h1 className="page-title mb-0">Endpoints</h1>
							</div>
							<div className="metric-pill metric-pill--highlight">
								<span className="metric-pill__value">{endpoints.length}</span>
								<span className="metric-pill__label">endpoints</span>
							</div>
						</div>

					
						<div className="ep-layout">

						
							<div className="ep-filters spec-card">
								<p className="ep-filters__title">Méthodes</p>

								<button
									type="button"
									className={`ep-filter-btn ${!activeMethod ? 'ep-filter-btn--active' : ''}`}
									onClick={() => setActiveMethod(null)}
								>
									<span>Tous</span>
									<span className="ep-filter-count">{endpoints.length}</span>
								</button>

								<div className="ep-divider" />

								{methodOrder.map(method => {
									const meta = METHOD_META[method] ?? fallback
									const isActive = activeMethod === method
									return (
										<button
											key={method}
											type="button"
											className={`ep-filter-btn ${isActive ? 'ep-filter-btn--method-active' : ''}`}
											style={isActive ? {
												background: meta.bg,
												borderColor: meta.border,
												color: meta.textColor,
											} : undefined}
											onClick={() => setActiveMethod(isActive ? null : method)}
										>
											<span className="ep-filter-dot" style={{ background: meta.color }} />
											<span>{method}</span>
											<span className="ep-filter-count"
												style={isActive ? { background: meta.bg, color: meta.textColor } : undefined}>
												{methodCounts[method]}
											</span>
										</button>
									)
								})}
							</div>

							{/* Main content */}
							<div className="ep-content">

								{/* Search */}
								<div className="ep-search-wrap">
									<svg className="ep-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
									</svg>
									<input
										className="ep-search form-control"
										placeholder="Rechercher un endpoint ou une description…"
										value={search}
										onChange={e => setSearch(e.target.value)}
									/>
								</div>

								<p className="ep-result-count">
									{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
									{activeMethod && <> · <strong>{activeMethod}</strong></>}
									{search && <> · "<em>{search}</em>"</>}
								</p>

								{filtered.length === 0 ? (
									<div className="spec-empty">Aucun endpoint trouvé.</div>
								) : (
									<div className="ep-list">
										{filtered.map(endpoint => {
											const meta = METHOD_META[endpoint.method] ?? fallback
											return (
												<div key={endpoint.id} className="ep-item">
													<span
														className="spec-method-badge"
														style={{
															background: meta.bg,
															color: meta.textColor,
															border: `1px solid ${meta.border}`,
														}}
													>
														{endpoint.method}
													</span>
													<span className="ep-path">{endpoint.path}</span>
													{endpoint.summary && (
														<span className="ep-summary">{endpoint.summary}</span>
													)}
												</div>
											)
										})}
									</div>
								)}
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	)
}
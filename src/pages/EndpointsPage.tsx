import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

type Endpoint = {
	id: string
	path: string
	method: string
	summary?: string
}

const apiBaseUrl = '/api/endpoints'

const methodColors: Record<string, string> = {
	GET: 'badge-get',
	POST: 'badge-post',
	PUT: 'badge-put',
	PATCH: 'badge-patch',
	DELETE: 'badge-delete',
}

export default function EndpointsPage() {
	const { specId } = useParams<{ specId: string }>()
	const navigate = useNavigate()
	const [endpoints, setEndpoints] = useState<Endpoint[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		const load = async () => {
			if (!specId) return

			setLoading(true)
			try {
				const response = await fetch(`${apiBaseUrl}/specification/${specId}`)
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
						<button type="button" className="spec-back-btn" onClick={() => navigate(-1)}>
							<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
								<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
							</svg>
							Retour
						</button>

						<section className="spec-card">
							<div className="panel-header">
								<div>
									<p className="section-kicker text-orange mb-1">OpenAPI</p>
									<h2 className="panel-title mb-0">Endpoints de la spécification</h2>
								</div>
							</div>

							{endpoints.length === 0 ? (
								<p className="text-muted m-4">Aucun endpoint trouvé.</p>
							) : (
								<div className="endpoint-list">
									{endpoints.map((endpoint) => (
										<div key={endpoint.id} className="endpoint-item">
											<span className={`spec-badge ${methodColors[endpoint.method] || 'badge-get'}`}>
												{endpoint.method}
											</span>
											<span className="endpoint-path">{endpoint.path}</span>
											{endpoint.summary && <span className="endpoint-summary">{endpoint.summary}</span>}
										</div>
									))}
								</div>
							)}
						</section>
					</div>
				</main>
			</div>
		</div>
	)
}
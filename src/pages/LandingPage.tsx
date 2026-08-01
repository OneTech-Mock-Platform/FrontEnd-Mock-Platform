import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pie, Bar } from 'react-chartjs-2'
import {
	Chart as ChartJS,
	ArcElement,
	BarElement,
	CategoryScale,
	LinearScale,
	Tooltip,
	Legend,
} from 'chart.js'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { getToken } from '../services/api'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

type DashboardStats = {
	totals: {
		specs: number
		endpoints: number
		scenarios: number
		multiScenarioPercent: number
	}
	scenariosByFamily: { family: string; count: number }[]
	endpointsByMethod: { method: string; count: number }[]
	scenariosBySpec: { specId: string; specName: string; count: number }[]
	recentSpecs: {
		id: string
		name: string
		fileName: string
		createdAt: string
		endpointCount: number
	}[]
}

const FAMILY_COLORS: Record<string, string> = {
	'2xx': '#22c55e',
	'3xx': '#3b82f6',
	'4xx': '#eab308',
	'5xx': '#ef4444',
}

const METHOD_COLORS: Record<string, string> = {
	GET: '#3b82f6',
	POST: '#f7941d',
	PUT: '#8b5cf6',
	PATCH: '#14b8a6',
	DELETE: '#ef4444',
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat('fr-FR', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(new Date(value))
}

function authHeaders(): Record<string, string> {
	const headers: Record<string, string> = {}
	const token = getToken()
	if (token) headers['Authorization'] = `Bearer ${token}`
	return headers
}

function LandingPage() {
	const navigate = useNavigate()
	const [stats, setStats] = useState<DashboardStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		const load = async () => {
			setLoading(true)
			setError('')
			try {
				const res = await fetch('/api/dashboard/stats', { headers: authHeaders() })
				if (!res.ok) throw new Error('Impossible de charger les statistiques.')
				setStats(await res.json())
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Erreur de chargement.')
			} finally {
				setLoading(false)
			}
		}
		void load()
	}, [])

	return (
		<div className="app-shell">
			<Sidebar />
			<div className="app-main">
				<Navbar />
				<main className="app-stage">
					<div className="spec-page">
						<header className="spec-page__header">
							<div className="spec-page__header-text">
								<p className="section-kicker text-orange mb-1">Dashboard</p>
								<h1 className="spec-page__title">Vue d'ensemble</h1>
								<p className="spec-page__subtitle">
									Aperçu global de vos spécifications, endpoints et scénarios mock.
								</p>
							</div>
						</header>

						{error ? <div className="alert alert-danger">{error}</div> : null}

						{loading ? (
							<div className="spec-empty">
								<div className="spec-spinner" />
								Chargement du tableau de bord…
							</div>
						) : stats ? (
							<>
								<div className="dashboard-stats-grid">
									<div className="dashboard-stat-tile">
										<span className="dashboard-stat-tile__label">Spécifications importées</span>
										<strong className="dashboard-stat-tile__value">{stats.totals.specs}</strong>
									</div>
									<div className="dashboard-stat-tile">
										<span className="dashboard-stat-tile__label">Endpoints</span>
										<strong className="dashboard-stat-tile__value">{stats.totals.endpoints}</strong>
									</div>
									<div className="dashboard-stat-tile">
										<span className="dashboard-stat-tile__label">Scénarios générés</span>
										<strong className="dashboard-stat-tile__value">{stats.totals.scenarios}</strong>
									</div>
									
								</div>

								<div className="dashboard-charts-grid">
									<section className="spec-card dashboard-chart-card">
										<div className="panel-header">
											<h2 className="panel-title mb-0">Scénarios par famille de code</h2>
										</div>
										{stats.scenariosByFamily.length > 0 ? (
											<div className="dashboard-chart-canvas-wrap">
												<Pie
													data={{
														labels: stats.scenariosByFamily.map((f) => f.family),
														datasets: [
															{
																data: stats.scenariosByFamily.map((f) => f.count),
																backgroundColor: stats.scenariosByFamily.map(
																	(f) => FAMILY_COLORS[f.family] ?? '#94a3b8',
																),
																borderWidth: 0,
															},
														],
													}}
													options={{ plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false, responsive: true }}
												/>
											</div>
										) : (
											<div className="spec-empty">Aucun scénario pour l'instant.</div>
										)}
									</section>

									<section className="spec-card dashboard-chart-card">
										<div className="panel-header">
											<h2 className="panel-title mb-0">Endpoints par méthode HTTP</h2>
										</div>
										{stats.endpointsByMethod.length > 0 ? (
											<div className="dashboard-chart-canvas-wrap">
												<Pie
													data={{
														labels: stats.endpointsByMethod.map((m) => m.method),
														datasets: [
															{
																data: stats.endpointsByMethod.map((m) => m.count),
																backgroundColor: stats.endpointsByMethod.map(
																	(m) => METHOD_COLORS[m.method] ?? '#94a3b8',
																),
																borderWidth: 0,
															},
														],
													}}
													options={{ plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false, responsive: true }}
												/>
											</div>
										) : (
											<div className="spec-empty">Aucun endpoint pour l'instant.</div>
										)}
									</section>

									
								</div>

								<section className="spec-card">
									<div className="panel-header">
										<h2 className="panel-title mb-0">Dernières spécifications</h2>
									</div>
									{stats.recentSpecs.length === 0 ? (
										<div className="spec-empty">Aucune spécification importée pour l'instant.</div>
									) : (
										<div className="dashboard-recent-list">
											{stats.recentSpecs.map((spec) => (
												<button
													key={spec.id}
													type="button"
													className="dashboard-recent-item"
													onClick={() => navigate(`/specifications/${spec.id}/reference`)}
												>
													<div className="dashboard-recent-item__main">
														<strong>{spec.name}</strong>
														<span>{spec.fileName}</span>
													</div>
													<div className="dashboard-recent-item__meta">
														<span className="spec-badge">
															{spec.endpointCount} endpoint{spec.endpointCount !== 1 ? 's' : ''}
														</span>
														<span className="dashboard-recent-item__date">{formatDate(spec.createdAt)}</span>
													</div>
												</button>
											))}
										</div>
									)}
								</section>
							</>
						) : null}
					</div>
				</main>
			</div>
		</div>
	)
}
 
export default LandingPage
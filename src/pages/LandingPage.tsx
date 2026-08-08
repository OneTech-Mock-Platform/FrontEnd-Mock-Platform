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
	type Plugin,
} from 'chart.js'
import { AlertCircle, FileText, Link2, FlaskConical, Layers, ListChecks, ShieldCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { getToken } from '../services/api'

const centerTextPlugin: Plugin<'pie'> = {
	id: 'centerText',
	afterDraw(chart) {
		const opts = (chart.config.options?.plugins as any)?.centerText
		if (!opts) return
		const { ctx, chartArea } = chart
		const cx = (chartArea.left + chartArea.right) / 2
		const cy = (chartArea.top + chartArea.bottom) / 2
		ctx.save()
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		ctx.font = "700 24px system-ui, -apple-system, 'Segoe UI', sans-serif"
		ctx.fillStyle = '#1c1c3c'
		ctx.fillText(String(opts.value), cx, cy - 9)
		ctx.font = "600 11px system-ui, -apple-system, 'Segoe UI', sans-serif"
		ctx.fillStyle = '#8a90a2'
		ctx.fillText(opts.label, cx, cy + 13)
		ctx.restore()
	},
}

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, centerTextPlugin)

type DashboardStats = {
	totals: {
		specs: number
		endpoints: number
		scenarios: number
		multiScenarioPercent: number
		errorCoveragePercent: number
		avgScenariosPerEndpoint: number
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
	'2xx': '#0ca30c',
	'3xx': '#2a78d6',
	'4xx': '#fab219',
	'5xx': '#d03b3b',
}

const METHOD_COLORS: Record<string, string> = {
	GET: '#2a78d6',
	POST: '#eb6834',
	PUT: '#1baf7a',
	PATCH: '#eda100',
	DELETE: '#e34948',
}

const SERIES_BLUE = '#2a78d6'

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

function KpiTile({
	icon,
	label,
	value,
	hint,
	meterPercent,
}: {
	icon: React.ReactNode
	label: string
	value: string | number
	hint?: string
	meterPercent?: number
}) {
	return (
		<div className="kpi-tile">
			<span className="kpi-tile__icon">{icon}</span>
			<div className="kpi-tile__body">
				<span className="kpi-tile__label">{label}</span>
				<strong className="kpi-tile__value">{value}</strong>
				{hint && <span className="kpi-tile__hint">{hint}</span>}
				{meterPercent !== undefined && (
					<div className="kpi-tile__meter">
						<div className="kpi-tile__meter-fill" style={{ width: `${Math.min(100, meterPercent)}%` }} />
					</div>
				)}
			</div>
		</div>
	)
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

						{error ? (
							<div className="profile-alert profile-alert--error">
								<AlertCircle size={18} />
								{error}
							</div>
						) : null}

						{loading ? (
							<div className="spec-empty">
								<div className="spec-spinner" />
								Chargement du tableau de bord…
							</div>
						) : stats ? (
							<>
								<div className="dashboard-stats-grid">
									<KpiTile
										icon={<FileText size={18} />}
										label="Spécifications importées"
										value={stats.totals.specs}
									/>
									<KpiTile
										icon={<Link2 size={18} />}
										label="Endpoints"
										value={stats.totals.endpoints}
									/>
									<KpiTile
										icon={<FlaskConical size={18} />}
										label="Scénarios générés"
										value={stats.totals.scenarios}
									/>
									{/* <KpiTile
										icon={<Layers size={18} />}
										label="Scénarios / endpoint"
										value={stats.totals.avgScenariosPerEndpoint}
										hint="en moyenne"
									/> */}
									{/* <KpiTile
										icon={<ListChecks size={18} />}
										label="Endpoints multi-scénarios"
										value={`${stats.totals.multiScenarioPercent}%`}
										meterPercent={stats.totals.multiScenarioPercent}
									/> */}
									<KpiTile
										icon={<ShieldCheck size={18} />}
										label="Couverture des cas d'erreur"
										value={`${stats.totals.errorCoveragePercent}%`}
										hint="endpoints avec un scénario 4xx/5xx"
										meterPercent={stats.totals.errorCoveragePercent}
									/>
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
																borderWidth: 2,
																borderColor: '#ffffff',
																hoverOffset: 6,
															},
														],
													}}
													options={{
														cutout: '68%',
														plugins: {
															legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16, font: { size: 12 } } },
															centerText: { value: stats.totals.scenarios, label: 'scénarios' },
														},
														maintainAspectRatio: false,
														responsive: true,
													}}
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
																borderWidth: 2,
																borderColor: '#ffffff',
																hoverOffset: 6,
															},
														],
													}}
													options={{
														cutout: '68%',
														plugins: {
															legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16, font: { size: 12 } } },
															centerText: { value: stats.totals.endpoints, label: 'endpoints' },
														},
														maintainAspectRatio: false,
														responsive: true,
													}}
												/>
											</div>
										) : (
											<div className="spec-empty">Aucun endpoint pour l'instant.</div>
										)}
									</section>

									<section className="spec-card dashboard-chart-card dashboard-chart-card--wide">
										<div className="panel-header">
											<h2 className="panel-title mb-0">Scénarios par spécification</h2>
										</div>
										{stats.scenariosBySpec.length > 0 ? (
											<div className="dashboard-chart-canvas-wrap">
												<Bar
													data={{
														labels: stats.scenariosBySpec.map((s) => s.specName),
														datasets: [
															{
																data: stats.scenariosBySpec.map((s) => s.count),
																backgroundColor: SERIES_BLUE,
																borderRadius: 4,
																barThickness: 20,
															},
														],
													}}
													options={{
														indexAxis: 'y',
														plugins: { legend: { display: false } },
														scales: {
															x: { grid: { color: '#e1e0d9' }, ticks: { precision: 0 } },
															y: { grid: { display: false } },
														},
														maintainAspectRatio: false,
														responsive: true,
													}}
												/>
											</div>
										) : (
											<div className="spec-empty">Aucune spécification pour l'instant.</div>
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

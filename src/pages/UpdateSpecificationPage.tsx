import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
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

type SpecificationDraft = {
	name: string
	fileName: string
	format: SpecificationFormat
	content: string
}

const apiBaseUrl = '/api/specifications'

function countLines(text: string) {
	return text.split('\n').length
}

function IssueCard({ index, line, column, path, message, badge, onJumpToLine }: {
	index: number; line?: number; column?: number; path?: string; message: string; badge?: string
	onJumpToLine?: (line: number) => void
}) {
	return (
		<div className="spec-issue-card">
			<span className="spec-issue-card__index">{index}</span>
			<div className="spec-issue-card__body">
				<div className="spec-issue-card__meta">
					{line ? (
						onJumpToLine ? (
							<button type="button" className="spec-issue-card__line" onClick={() => onJumpToLine(line)}>
								Ligne {line}{column ? `, col. ${column}` : ''}
							</button>
						) : (
							<span className="spec-issue-card__line">
								Ligne {line}{column ? `, col. ${column}` : ''}
							</span>
						)
					) : null}
					{badge && <span className="spec-badge spec-badge--sm">{badge}</span>}
				</div>
				<p className="spec-issue-card__message">{message}</p>
				{path && <p className="spec-issue-card__path">{path}</p>}
			</div>
		</div>
	)
}

export default function SpecificationEditPage() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const textareaRef = useRef<HTMLTextAreaElement | null>(null)
	const lineNumbersRef = useRef<HTMLDivElement | null>(null)

	const [spec, setSpec] = useState<SpecificationItem | null>(null)
	const [draft, setDraft] = useState<SpecificationDraft>({
		name: '', fileName: '', format: 'json', content: '',
	})
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const [saveSuccess, setSaveSuccess] = useState(false)
	
	const [validationErrors, setValidationErrors] = useState<{ line?: number; column?: number; message: string }[]>([])
	
	const [strictWarnings, setStrictWarnings] = useState<{ line?: number; column?: number; message: string }[]>([])

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
				setDraft({
					name: data.name,
					fileName: data.fileName,
					format: data.format,
					content: data.content,
				})
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Erreur de chargement.')
			} finally {
				setLoading(false)
			}
		}
		void load()
	}, [id])

	const handleTextareaScroll = () => {
		if (lineNumbersRef.current && textareaRef.current) {
			lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
		}
	}

	const handleFieldChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target
		setDraft((prev) => ({ ...prev, [name]: value }))
		setSaveSuccess(false)
	}

	const handleSave = async () => {
		if (!spec) return
		setSaving(true)
		setError('')
		setValidationErrors([])
		setStrictWarnings([])
		setSaveSuccess(false)
		try {
			const token = getToken()
			const headers: Record<string, string> = { 'Content-Type': 'application/json' }
			if (token) {
				headers['Authorization'] = `Bearer ${token}`
			}

			const response = await fetch(`${apiBaseUrl}/${spec.id}`, {
				method: 'PATCH',
				headers,
				body: JSON.stringify(draft),
			})

			
			if (!response.ok) {
				const body = await response.json().catch(() => null)
				setValidationErrors(body?.errors ?? [{ message: body?.message ?? 'La sauvegarde a échoué.' }])
				return
			}

			const updated = (await response.json()) as SpecificationItem & { warnings?: { line?: number; column?: number; message: string }[] }
			setSpec(updated)
			setDraft({
				name: updated.name,
				fileName: updated.fileName,
				format: updated.format,
				content: updated.content,
			})
			setStrictWarnings(updated.warnings ?? [])
			setSaveSuccess(true)
			setTimeout(() => setSaveSuccess(false), 3000)
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Erreur de sauvegarde.')
		} finally {
			setSaving(false)
		}
	}


	function scrollToLine(line: number) {
		const ta = textareaRef.current
		if (!ta) return
		const linesArr = draft.content.split('\n')
		const charIndex = linesArr.slice(0, line - 1).reduce((sum, l) => sum + l.length + 1, 0)
		ta.focus()
		ta.setSelectionRange(charIndex, charIndex + (linesArr[line - 1]?.length ?? 0))
		const lineHeight = ta.scrollHeight / linesArr.length
		ta.scrollTop = Math.max(0, (line - 3) * lineHeight)
	}

	const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Tab') {
			e.preventDefault()
			const ta = e.currentTarget
			const start = ta.selectionStart
			const end = ta.selectionEnd
			const newValue = draft.content.substring(0, start) + '  ' + draft.content.substring(end)
			setDraft((prev) => ({ ...prev, content: newValue }))
			requestAnimationFrame(() => {
				ta.selectionStart = start + 2
				ta.selectionEnd = start + 2
			})
		}
	}

	const lines = countLines(draft.content || ' ')

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

	if (error && !spec) {
		return (
			<div className="app-shell">
				<Sidebar />
				<div className="app-main">
					<Navbar />
					<main className="app-stage">
						<div className="profile-alert profile-alert--error m-4">
								<AlertCircle size={18} />
								{error}
							</div>
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

						{/* ── En-tête ── */}
						<div className="spec-edit-header">
							{/* ── Retour ── */}
							<button type="button" className="spec-back-btn" onClick={() => navigate('/specifications')}>
								<span className="spec-back-btn__icon">
									<svg viewBox="0 0 24 24" aria-hidden="true">
										<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
									</svg>
								</span>
								Retour aux spécifications
							</button>
							<div className="spec-edit-header__right">
								<span aria-live="polite">
									{saveSuccess ? (
										<span className="spec-saved-badge">
											<CheckCircle2 size={14} />
											Enregistré
										</span>
									) : null}
								</span>
								<button
									type="button"
									className="spec-save-btn"
									onClick={handleSave}
									disabled={saving}
								>
									{saving ? (
										'Enregistrement…'
									) : (
										<>
											<svg viewBox="0 0 24 24" aria-hidden="true">
												<path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM15 9H6V5h9v4Z" />
											</svg>
											Enregistrer les modifications
										</>
									)}
								</button>
							</div>
						</div>

						{error ? (
							<div className="profile-alert profile-alert--error">
								<AlertCircle size={18} />
								{error}
							</div>
						) : null}

						{validationErrors.length > 0 && (
							<div className="spec-issues-banner spec-issues-banner--error">
								<div className="spec-issues-banner__header">
									<span className="spec-issues-banner__icon">
										<XCircle size={20} />
									</span>
									<div>
										<p className="spec-issues-banner__title">
											{validationErrors.length} erreur{validationErrors.length > 1 ? 's' : ''} trouvée{validationErrors.length > 1 ? 's' : ''}
										</p>
										<p className="spec-issues-banner__subtitle">Corrigez ces problèmes avant de pouvoir enregistrer.</p>
									</div>
								</div>
								<div className="spec-issues-banner__list">
									{validationErrors.map((err, i) => (
										<IssueCard
											key={i}
											index={i + 1}
											line={err.line}
											column={err.column}
											message={err.message}
											onJumpToLine={err.line ? scrollToLine : undefined}
										/>
									))}
								</div>
							</div>
						)}

						{strictWarnings.length > 0 && (
							<div className="spec-issues-banner spec-issues-banner--warning">
								<div className="spec-issues-banner__header">
									<span className="spec-issues-banner__icon">
										<AlertTriangle size={20} />
									</span>
									<div>
										<p className="spec-issues-banner__title">
											{strictWarnings.length} écart{strictWarnings.length > 1 ? 's' : ''} par rapport à la norme stricte OpenAPI
										</p>
										<p className="spec-issues-banner__subtitle">Purement informatif — la spécification a bien été enregistrée.</p>
									</div>
								</div>
								<div className="spec-issues-banner__list">
									{strictWarnings.map((w, i) => (
										<IssueCard key={i} index={i + 1} line={w.line} message={w.message} />
									))}
								</div>
								<p className="spec-issues-banner__footnote">
									Ces écarts n'empêchent ni la sauvegarde ni la génération de scénarios.
								</p>
							</div>
						)}

						{/* ── Métadonnées ── */}
						<section className="spec-card">
							<div className="panel-header">
								<h2 className="panel-title mb-0" style={{ color: '#e47f00' }}>Détails de la spécification</h2>
							</div>
							<div className="spec-edit-meta-grid">
								<label className="form-group">
									<span>Nom</span>
									<input
										className="form-control"
										name="name"
										value={draft.name}
										onChange={handleFieldChange}
										placeholder="Nom de la spécification"
									/>
								</label>
								<label className="form-group">
									<span>Nom du fichier</span>
									<input
										className="form-control"
										name="fileName"
										value={draft.fileName}
										onChange={handleFieldChange}
										placeholder="api.yaml"
									/>
								</label>
						
							</div>
						</section>

						{/* ── Éditeur ── */}
						<section className="spec-card spec-editor-card">
							<div className="panel-header">
								<div>
									<p className="section-kicker text-orange mb-1">Contenu</p>
									<h2 className="panel-title mb-0">Contenu du fichier</h2>
								</div>
								<div className="spec-editor-toolbar">
									<span className="spec-editor-stat">{lines} lignes</span>
									<span className={`spec-badge spec-badge--${draft.format}`}>
										{draft.format.toUpperCase()}
									</span>
									
								</div>
							</div>

							<div className="spec-code-editor">
								<div className="spec-code-editor__lines" ref={lineNumbersRef} aria-hidden="true">
									{Array.from({ length: lines }, (_, i) => (
										<div key={i + 1} className="spec-line-number">{i + 1}</div>
									))}
								</div>
							<textarea
								ref={textareaRef}
								className="spec-code-editor__textarea"
								name="content"
								value={draft.content}
								onChange={handleFieldChange}
								onScroll={handleTextareaScroll}
								onKeyDown={handleTextareaKeyDown}
								spellCheck={false}
								autoComplete="off"
								autoCorrect="off"
								autoCapitalize="off"
								placeholder={`Collez votre contenu OpenAPI ${draft.format.toUpperCase()} ici…`}
							/>
							</div>

							<div className="spec-editor-statusbar">
								<span>{draft.format.toUpperCase()}</span>
								<span>{lines} lignes · {draft.content.length} caractères</span>
								<span className={saveSuccess ? 'spec-status--clean' : ''}>
									{saveSuccess ? '✓ Enregistré' : ''}
								</span>
							</div>
						</section>

					</div>
				</main>
			</div>
		</div>
	)
}
import { useEffect, useRef, useState } from 'react'
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
	// Erreurs YAML/OpenAPI renvoyées par le backend (parsing.service.ts) sur un PATCH échoué :
	// line/column quand dispo (erreur de syntaxe YAML), sinon juste un message (erreur de
	// validation OpenAPI).
	const [validationErrors, setValidationErrors] = useState<{ line?: number; column?: number; message: string }[]>([])

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

			// Avant : cette vérification était commentée, donc un PATCH échoué (ex: YAML/OpenAPI
			// invalide) affichait quand même "Enregistré" en silence. On lit maintenant le corps
			// d'erreur structuré renvoyé par parsing.service.ts pour l'afficher au lieu de mentir
			// sur le succès.
			if (!response.ok) {
				const body = await response.json().catch(() => null)
				setValidationErrors(body?.errors ?? [{ message: body?.message ?? 'La sauvegarde a échoué.' }])
				return
			}

			const updated = (await response.json()) as SpecificationItem
			setSpec(updated)
			setDraft({
				name: updated.name,
				fileName: updated.fileName,
				format: updated.format,
				content: updated.content,
			})
			setSaveSuccess(true)
			setTimeout(() => setSaveSuccess(false), 3000)
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Erreur de sauvegarde.')
		} finally {
			setSaving(false)
		}
	}



	// Saute à la ligne d'une erreur YAML (bouton "Ligne N" dans la liste ci-dessous) : convertit
	// le numéro de ligne 1-indexé en index de caractère pour sélectionner la ligne dans le
	// textarea, et défile le textarea (approximation par hauteur de ligne moyenne, pas de vraie
	// API de "scroll to line" sur un <textarea>) pour la garder visible.
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
											<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
												<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
											</svg>
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

						{error ? <div className="alert alert-danger">{error}</div> : null}

						{/* Liste des erreurs YAML/OpenAPI renvoyées par le PATCH échoué, une par ligne ;
						    celles qui ont un numéro de ligne (erreurs de syntaxe YAML) offrent un lien
						    pour sauter directement dessus dans l'éditeur ci-dessous. */}
						{validationErrors.length > 0 && (
							<div className="alert alert-danger">
								<strong>La spécification contient des erreurs :</strong>
								<ul style={{ marginTop: 8, marginBottom: 0 }}>
									{validationErrors.map((err, i) => (
										<li key={i}>
											{err.line ? (
												<button type="button" className="spec-error-line-link" onClick={() => scrollToLine(err.line!)}>
													Ligne {err.line}{err.column ? `, col. ${err.column}` : ''}
												</button>
											) : null}
											{' '}{err.message}
										</li>
									))}
								</ul>
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
								{/* <label className="form-group">
									<span>Format</span>
									<select
										className="form-select"
										name="format"
										value={draft.format}
										onChange={handleFieldChange}
									>
										<option value="json">json</option>
										<option value="yaml">yaml</option>
										<option value="yml">yml</option>
									</select>
								</label> */}
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

						{/* ── Pied de page ── */}
						<div className="spec-edit-footer">
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
				</main>
			</div>
		</div>
	)
}
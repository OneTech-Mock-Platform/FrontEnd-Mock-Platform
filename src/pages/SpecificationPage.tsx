import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { getToken } from '../services/api'

type SpecificationFormat = 'yaml' | 'yml' | 'json'

type SpecificationSummary = {
	endpointCount: number
	operationCount: number
}

type SpecificationItem = {
	id: string
	name: string
	fileName: string
	format: SpecificationFormat
	content: string
	createdAt: string
	size: number
	summary: SpecificationSummary
}

type SpecificationResponse = {
	items: SpecificationItem[]
}

type SpecificationDraft = {
	name: string
	fileName: string
	format: SpecificationFormat
	content: string
}

const emptyDraft: SpecificationDraft = {
	name: '',
	fileName: '',
	format: 'json',
	content: '',
}

const apiBaseUrl = '/api/specifications'
const PAGE_SIZE = 6

function resolveFormat(fileName: string): SpecificationFormat {
	const extension = fileName.split('.').pop()?.toLowerCase()
	if (extension === 'yaml' || extension === 'yml') return extension
	return 'json'
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat('fr-FR', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(new Date(value))
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} o`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
	return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function authHeaders(): Record<string, string> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' }
	const token = getToken()
	if (token) {
		headers['Authorization'] = `Bearer ${token}`
	}
	return headers
}


export default function SpecificationPage() {
	const navigate = useNavigate()
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const [specs, setSpecs] = useState<SpecificationItem[]>([])
	const [importDraft, setImportDraft] = useState<SpecificationDraft>(emptyDraft)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const [importError, setImportError] = useState('')
	const [dragActive, setDragActive] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [deleteTarget, setDeleteTarget] = useState<SpecificationItem | null>(null)
	const deleteModalRef = useRef<HTMLDivElement | null>(null)
	const deleteCancelRef = useRef<HTMLButtonElement | null>(null)
	const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null)
	const [showImport, setShowImport] = useState(false)
	const [showPreview, setShowPreview] = useState(true)

	const totalPages = Math.ceil(specs.length / PAGE_SIZE)
	const paginated = specs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

	const loadSpecifications = async () => {
		setLoading(true)
		setError('')
		try {
			const response = await fetch(apiBaseUrl, {
				headers: authHeaders(),
			})
			if (!response.ok) throw new Error('Impossible de charger les spécifications.')
			const data = (await response.json()) as SpecificationResponse
			setSpecs(data.items ?? [])
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Erreur de chargement.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => { void loadSpecifications() }, [])

	const readFileAsDraft = async (file: File): Promise<SpecificationDraft> => {
		const content = await file.text()
		const format = resolveFormat(file.name)
		return {
			name: file.name.replace(/\.[^.]+$/, ''),
			fileName: file.name,
			format,
			content,
		}
	}

	const handleFileSelection = async (file: File | null | undefined) => {
		if (!file) return
		try {
			setImportError('')
			const draft = await readFileAsDraft(file)
			setImportDraft(draft)
			setShowPreview(true) 
		} catch {
			setImportError('Impossible de lire ce fichier.')
		}
	}

	const handleImportSubmit = async () => {
		if (!importDraft.fileName || !importDraft.content) {
			setImportError("Choisis un fichier OpenAPI YAML ou JSON avant l'import.")
			return
		}
		setSaving(true)
		setError('')
		try {
			const response = await fetch(apiBaseUrl, {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify(importDraft),
			})
			if (!response.ok) throw new Error("L'import a échoué.")
			const created = (await response.json()) as SpecificationItem
			setSpecs((prev) => [created, ...prev.filter((i) => i.id !== created.id)])
			setImportDraft(emptyDraft)
			if (fileInputRef.current) fileInputRef.current.value = ''
			setShowImport(false)
			setCurrentPage(1)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erreur lors de l'import.")
		} finally {
			setSaving(false)
		}
	}

	const handleDeleteConfirm = async () => {
		if (!deleteTarget) return
		setSaving(true)
		try {
			const response = await fetch(`${apiBaseUrl}/${deleteTarget.id}`, {
				method: 'DELETE',
				headers: authHeaders(),
			})
			if (!response.ok) throw new Error('La suppression a échoué.')
			setSpecs((prev) => prev.filter((i) => i.id !== deleteTarget.id))
			setDeleteSuccess(deleteTarget.name)
			setDeleteTarget(null)
			setTimeout(() => setDeleteSuccess(null), 3500)
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Erreur de suppression.')
		} finally {
			setSaving(false)
		}
	}

	useEffect(() => {
		if (!deleteTarget) return

		const previouslyFocused = document.activeElement as HTMLElement | null
		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		deleteCancelRef.current?.focus()

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setDeleteTarget(null)
				return
			}
			if (event.key === 'Tab' && deleteModalRef.current) {
				const focusable = deleteModalRef.current.querySelectorAll<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
				)
				if (focusable.length === 0) return
				const first = focusable[0]
				const last = focusable[focusable.length - 1]
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault()
					last.focus()
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault()
					first.focus()
				}
			}
		}
		window.addEventListener('keydown', onKeyDown)

		return () => {
			window.removeEventListener('keydown', onKeyDown)
			document.body.style.overflow = previousOverflow
			previouslyFocused?.focus()
		}
	}, [deleteTarget])

	const handleOpenPublicLink = (spec: SpecificationItem) => {
		window.open(`${window.location.origin}/public/${spec.id}`, '_blank', 'noopener,noreferrer')
	}

	const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		setDragActive(false)
		await handleFileSelection(event.dataTransfer.files?.[0])
	}

	const handleInputChange =
		(setter: React.Dispatch<React.SetStateAction<SpecificationDraft>>) =>
		(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
			const { name, value } = event.target
			setter((prev) => ({ ...prev, [name]: value }))
		}

	return (
		<div className="app-shell">
			<Sidebar />
			<div className="app-main">
				<Navbar />
				<main className="app-stage">
					<div className="spec-page">

						{/* ── Header ── */}
						<header className="spec-page__header">
							<div className="spec-page__header-text">
								<p className="section-kicker text-orange mb-1">Spécifications</p>
								<h1 className="spec-page__title">Vos spécifications OpenAPI</h1>
								<p className="spec-page__subtitle">
									Importez, consultez et gérez vos fichiers de spécification API en un seul endroit.
								</p>
							</div>

							<button
								type="button"
								className={`spec-import-trigger ${showImport ? 'is-active' : ''}`}
								onClick={() => setShowImport((v) => !v)}
								aria-expanded={showImport}
							>
								<svg className="spec-import-trigger__icon" viewBox="0 0 24 24" aria-hidden="true">
									<path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
								</svg>
								{showImport ? 'Fermer' : 'Importer une spécification'}
							</button>
						</header>



						{/* ── Alerts ── */}
						{error ? (
							<div className="profile-alert profile-alert--error">
								<AlertCircle size={18} />
								{error}
							</div>
						) : null}

						{/* ── Delete success toast ── */}
						{deleteSuccess ? (
							<div className="profile-alert profile-alert--success">
								<CheckCircle2 size={18} />
								<span><strong>{deleteSuccess}</strong> a été supprimé.</span>
							</div>
						) : null}

						{/* ── Import Panel ── */}
						{showImport ? (
							<section className="spec-card spec-import-panel">
								<div className="panel-header">
									<div>
										<p className="section-kicker text-orange mb-1">Import</p>
										<h2 className="panel-title mb-0">Fichier OpenAPI</h2>
									</div>
								</div>

								<div
									className={`import-dropzone ${dragActive ? 'is-active' : ''} ${importDraft.fileName ? 'has-file' : ''}`}
									onDragEnter={(e) => { e.preventDefault(); setDragActive(true) }}
									onDragOver={(e) => e.preventDefault()}
									onDragLeave={() => setDragActive(false)}
									onDrop={handleDrop}
									onClick={() => fileInputRef.current?.click()}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault()
											fileInputRef.current?.click()
										}
									}}
								>
									{importDraft.fileName ? (
										<>
											<div className="import-dropzone__icon import-dropzone__icon--file">
												<svg viewBox="0 0 24 24" aria-hidden="true">
													<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
												</svg>
											</div>
											<div className="import-dropzone__file-info">
												<strong className="import-dropzone__file-name">{importDraft.name}</strong>
												<span className="import-dropzone__file-meta">
													<span className={`spec-badge spec-badge--${importDraft.format}`}>
														{importDraft.format.toUpperCase()}
													</span>
													<span className="import-dropzone__file-size">{formatFileSize(new Blob([importDraft.content]).size)}</span>
												</span>
												<code className="import-dropzone__file-fullname">{importDraft.fileName}</code>
											</div>
											<button type="button" className="btn btn-outline-secondary import-dropzone__button">
												Changer de fichier
											</button>
										</>
									) : (
										<>
											<div className="import-dropzone__icon">
												<svg viewBox="0 0 24 24" aria-hidden="true">
													<path d="M19 15v4H5v-4H3v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4h-2Zm-8-1 3.59-3.59L16 12l-5 5-5-5 1.41-1.41L11 14.59V3h2v11Z" />
												</svg>
											</div>
											<strong>Glissez-déposez votre fichier</strong>
											<span>OpenAPI YAML ou JSON</span>
											<button type="button" className="btn btn-orange import-dropzone__button">
												Choisir un fichier
											</button>
										</>
									)}
									<input
										ref={fileInputRef}
										type="file"
										accept=".yaml,.yml,.json,application/json,text/yaml,text/plain"
										hidden
										onChange={async (e) => { await handleFileSelection(e.target.files?.[0]) }}
									/>
								</div>

								{importDraft.content ? (
									<div className="import-preview">
										<button
											type="button"
											className="import-preview__toggle"
											onClick={() => setShowPreview((v) => !v)}
											aria-expanded={showPreview}
										>
											<span className="import-preview__toggle-left">
												<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
													<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
												</svg>
												Aperçu du contenu
											</span>
											<span className="import-preview__toggle-right">
												<span className="import-preview__meta">
													{importDraft.content.split('\n').length} lignes 
												</span>
												<svg
													viewBox="0 0 24 24" width="16" height="16" fill="currentColor"
													style={{ transform: showPreview ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
												>
													<path d="M7 10l5 5 5-5H7z" />
												</svg>
											</span>
										</button>

										{showPreview ? (
											<div className="import-preview__body">
												<div className="import-preview__lines" aria-hidden="true">
													{importDraft.content.split('\n').map((_, i) => (
														<div key={i + 1} className="spec-line-number">{i + 1}</div>
													))}
												</div>
												<pre className="import-preview__code">{importDraft.content}</pre>
											</div>
										) : null}
									</div>
								) : null}

								{importError ? (
								<div className="profile-alert profile-alert--warning">
									<AlertTriangle size={18} />
									{importError}
								</div>
							) : null}

								<div className="spec-actions">
									<button type="button" className="btn btn-orange" onClick={handleImportSubmit} disabled={saving}>
										{saving ? 'Importation…' : 'Importer la spécification'}
									</button>
									<button type="button" className="btn btn-outline-secondary" onClick={() => {
										setImportDraft(emptyDraft)
										setImportError('')
										setShowPreview(true)
										if (fileInputRef.current) fileInputRef.current.value = ''
									}}>
										Réinitialiser
									</button>
								</div>
							</section>
						) : null}

						{/* ── Table ── */}
						<section className="spec-card spec-table-card">
							<div className="panel-header">
								<div>
									<h2 className="panel-title mb-0" style={{color: '#e47f00'}}>
										Toutes les spécifications
									</h2>
									<p className="spec-table-count-label">
							
									</p>
								</div>
							</div>

							{loading ? (
								<div className="spec-empty">
									<div className="spec-spinner" />
									Chargement des spécifications…
								</div>
							) : specs.length === 0 ? (
								<div className="spec-empty spec-empty--cta">
									<div className="spec-empty__icon">
										<svg viewBox="0 0 24 24" aria-hidden="true">
											<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
										</svg>
									</div>
									<strong>Aucune spécification importée</strong>
									<p>Importez un fichier YAML ou JSON pour commencer à explorer vos APIs.</p>
								</div>
							) : (
								<>
									<div className="spec-table-wrapper">
										<table className="spec-table">
											<thead>
												<tr>
													<th scope="col">Nom</th>
													<th scope="col">Fichier</th>
													<th scope="col">Format</th>
													<th scope="col">Date</th>
													<th scope="col" className="spec-table__actions-col">Actions</th>
												</tr>
											</thead>
											<tbody>
												{paginated.map((spec) => (
													<tr key={spec.id}>
														<td>
															<span className="spec-table__name">{spec.name}</span>
														</td>
														<td>
															<code className="spec-table__file">{spec.fileName}</code>
														</td>
														<td>
															<span className={`spec-badge spec-badge--${spec.format}`}>
																{spec.format.toUpperCase()}
															</span>
														</td>
														<td className="spec-table__date">{formatDate(spec.createdAt)}</td>
														
														<td>
															<div className="spec-table__action-btns" role="group" aria-label={`Actions pour ${spec.name}`}>
													
															    <button
																	type="button"
																	className="spec-icon-btn spec-icon-btn--link"
																	title="Ouvrir le lien public"
																	aria-label={`Ouvrir le lien public de ${spec.name}`}
																	onClick={() => handleOpenPublicLink(spec)}
																>
																	<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
																		<path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7ZM19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7Z"/>
																	</svg>
																</button>

																<button
																	type="button"
																	className="spec-icon-btn spec-icon-btn--view"
																	title="Voir les détails"
																	aria-label={`Voir les détails de ${spec.name}`}
																	onClick={() => navigate(`/specifications/${spec.id}/reference`)}
																>
																	<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
																		<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
																	</svg>
																</button>
																<button
																	type="button"
																	className="spec-icon-btn spec-icon-btn--edit"
																	title="Modifier la spécification"
																	aria-label={`Modifier ${spec.name}`}
																	onClick={() => navigate(`/specifications/${spec.id}/edit`)}
																>
																	<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
																		<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
																	</svg>
																</button>
																<button
																	type="button"
																	className="spec-icon-btn spec-icon-btn--delete"
																	title="Supprimer la spécification"
																	aria-label={`Supprimer ${spec.name}`}
																	onClick={() => setDeleteTarget(spec)}
																>
																	<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
																		<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
																	</svg>
																</button>
															</div>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>

									{/* Pagination */}
									{totalPages > 1 ? (
										<div className="spec-pagination">
											<button
												type="button"
												className="spec-page-btn"
												disabled={currentPage === 1}
												onClick={() => setCurrentPage((p) => p - 1)}
											>
												‹ Précédent
											</button>
											<div className="spec-page-numbers">
												{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
													<button
														key={page}
														type="button"
														className={`spec-page-num ${currentPage === page ? 'is-active' : ''}`}
														onClick={() => setCurrentPage(page)}
														aria-label={`Page ${page}`}
														aria-current={currentPage === page ? 'page' : undefined}
													>
														{page}
													</button>
												))}
											</div>
											<button
												type="button"
												className="spec-page-btn"
												disabled={currentPage === totalPages}
												onClick={() => setCurrentPage((p) => p + 1)}
											>
												Suivant ›
											</button>
											<span className="spec-page-info">
												{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, specs.length)} sur {specs.length}
											</span>
										</div>
									) : null}
								</>
							)}
						</section>
					</div>
				</main>
			</div>

			{/* ── Delete confirmation modal ── */}
			{deleteTarget ? (
				<div className="spec-modal-overlay" onClick={() => setDeleteTarget(null)}>
					<div
						className="spec-modal"
						role="dialog"
						aria-modal="true"
						aria-labelledby="delete-modal-title"
						aria-describedby="delete-modal-desc"
						ref={deleteModalRef}
						onClick={(e) => e.stopPropagation()}
					>
						<button
							type="button"
							ref={deleteCancelRef}
							className="spec-modal__close"
							onClick={() => setDeleteTarget(null)}
							aria-label="Fermer la fenêtre de confirmation"
						>
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71l-1.41-1.42L9.17 12 2.89 5.71 4.3 4.3l6.29 6.29 6.29-6.29z"/>
							</svg>
						</button>

						<div className="spec-modal__icon spec-modal__icon--danger">
							<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
								<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
							</svg>
						</div>

						<h3 className="spec-modal__title" id="delete-modal-title">Supprimer cette spécification ?</h3>
						<p className="spec-modal__body" id="delete-modal-desc">
							Vous êtes sur le point de supprimer définitivement <strong>{deleteTarget.name}</strong>.
						</p>

						<div className="spec-modal__warning">
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d="M12 2 1 21h22L12 2Zm0 5.5 6.53 11.5H5.47L12 7.5ZM11 10v4h2v-4h-2Zm0 5v2h2v-2h-2Z" />
							</svg>
							Cette action est irréversible.
						</div>

						<div className="spec-modal__actions">
							<button
								type="button"
								className="spec-modal__btn spec-modal__btn--danger"
								onClick={handleDeleteConfirm}
								disabled={saving}
							>
								{saving ? (
									'Suppression…'
								) : (
									<>
										<svg viewBox="0 0 24 24" aria-hidden="true">
											<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
										</svg>
										Supprimer définitivement
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	)
}
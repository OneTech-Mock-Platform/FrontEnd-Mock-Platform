import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
const PAGE_SIZE = 8

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
	const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null)
	const [showImport, setShowImport] = useState(false)

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
						<div className="spec-page__header">
						
							<button
								type="button"
								className="btn btn-orange"
								onClick={() => setShowImport((v) => !v)}
							>
								{showImport ? '✕ Fermer' : '+ Importer une spécification'}
							</button>
						</div>

						

						{/* ── Alerts ── */}
						{error ? <div className="alert alert-danger">{error}</div> : null}

						{/* ── Delete success toast ── */}
						{deleteSuccess ? (
							<div className="spec-toast spec-toast--success">
								<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
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
									className={`import-dropzone ${dragActive ? 'is-active' : ''}`}
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
									<input
										ref={fileInputRef}
										type="file"
										accept=".yaml,.yml,.json,application/json,text/yaml,text/plain"
										hidden
										onChange={async (e) => { await handleFileSelection(e.target.files?.[0]) }}
									/>
								</div>

								{importError ? <div className="alert alert-warning">{importError}</div> : null}

								<div className="spec-actions">
									<button type="button" className="btn btn-orange" onClick={handleImportSubmit} disabled={saving}>
										{saving ? 'Importation…' : 'Importer la spécification'}
									</button>
									<button type="button" className="btn btn-outline-secondary" onClick={() => {
										setImportDraft(emptyDraft)
										setImportError('')
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
									
									<h2 className="panel-title mb-0 text-orange">Spécifications importées</h2>
								</div>
								
							</div>

							{loading ? (
								<div className="spec-empty">
									<div className="spec-spinner" />
									Chargement des spécifications…
								</div>
							) : specs.length === 0 ? (
								<div className="spec-empty">
									Aucune spécification importée. Importez un fichier YAML ou JSON pour commencer.
								</div>
							) : (
								<>
									<div className="spec-table-wrapper">
										<table className="spec-table">
											<thead>
												<tr>
													<th>Nom</th>
													<th>Fichier</th>
													<th>Format</th>
													<th>Date</th>
													<th className="spec-table__actions-col">Actions</th>
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
															<div className="spec-table__action-btns">
																<button
																	type="button"
																	className="spec-icon-btn spec-icon-btn--view"
																	title="Voir les détails"
																	onClick={() => navigate(`/specifications/${spec.id}`)}
																>
																	<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
																		<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
																	</svg>
																	<span>Voir</span>
																</button>
																<button
																	type="button"
																	className="spec-icon-btn spec-icon-btn--edit"
																	title="Modifier la spécification"
																	onClick={() => navigate(`/specifications/${spec.id}/edit`)}
																>
																	<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
																		<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
																	</svg>
																	<span>Modifier</span>
																</button>
																<button
																	type="button"
																	className="spec-icon-btn spec-icon-btn--delete"
																	title="Supprimer la spécification"
																	onClick={() => setDeleteTarget(spec)}
																>
																	<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
																		<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
																	</svg>
																	<span>Supprimer</span>
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
					<div className="spec-modal" onClick={(e) => e.stopPropagation()}>
						<div className="spec-modal__icon spec-modal__icon--danger">
							<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
								<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
							</svg>
						</div>
						<h3 className="spec-modal__title">Confirmer la suppression</h3>
						<p className="spec-modal__body">
							Vous êtes sur le point de supprimer définitivement <strong>{deleteTarget.name}</strong>.<br />
							Cette action est irréversible.
						</p>
						<div className="spec-modal__actions">
							<button
								type="button"
								className="btn btn-outline-secondary"
								onClick={() => setDeleteTarget(null)}
							>
							annuler
							</button>
							<button
								type="button"
								className="btn btn-danger"
								onClick={handleDeleteConfirm}
							>
								supprimer
							</button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	)
}
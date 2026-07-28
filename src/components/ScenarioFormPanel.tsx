import { useState } from 'react'
import { Loader2, Sparkles, X } from 'lucide-react'
import { getToken } from '../services/api'

export type ScenarioFormSavePayload = {
	name: string
	description: string
	statusCode: number
	requestExample: string
	mockContent: string
}

export default function ScenarioFormPanel({
	endpointId,
	statusCodes,
	onClose,
	onSaved,
}: {
	endpointId: string
	statusCodes: string[]
	onClose: () => void
	onSaved: (payload: ScenarioFormSavePayload) => void | Promise<void>
}) {
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [statusCode, setStatusCode] = useState<number>(statusCodes.length ? Number(statusCodes[0]) : 400)
	const [requestExample, setRequestExample] = useState('{}')
	const [mockContent, setMockContent] = useState('{}')
	const [aiGenerated, setAiGenerated] = useState(false)
	const [generating, setGenerating] = useState(false)
	const [aiError, setAiError] = useState('')
	const [aiWarning, setAiWarning] = useState('')
	const [saving, setSaving] = useState(false)

	const handleGenerateAI = async () => {
		if (!name.trim()) return
		setGenerating(true)
		setAiError('')
		setAiWarning('')
		try {
			const res = await fetch(`/api/scenarios/endpoint/${endpointId}/generate-with-ai`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
				body: JSON.stringify({ name, description, statusCode }),
			})
			if (!res.ok) throw new Error()
			const data = await res.json()
			setRequestExample(JSON.stringify(data.requestExample, null, 2))
			setMockContent(JSON.stringify(data.mockContent, null, 2))
			setAiGenerated(true)
			if (data.warning) setAiWarning(data.warning)
		} catch {
			setAiError("Génération IA indisponible — remplis les champs manuellement.")
		} finally {
			setGenerating(false)
		}
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			await onSaved({ name, description, statusCode, requestExample, mockContent })
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="scenario-panel-overlay" onClick={onClose}>
			<div className="scenario-panel" onClick={(e) => e.stopPropagation()}>
				<div className="scenario-panel__header">
					<h3>Nouveau scénario</h3>
					<button type="button" className="scenario-panel__close" onClick={onClose} aria-label="Fermer">
						<X size={18} />
					</button>
				</div>

				<label className="form-group">
					<span>Nom du scénario</span>
					<input
						className="form-control"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Ex: Compte inexistant"
					/>
				</label>

				<label className="form-group">
					<span>Description</span>
					<input
						className="form-control"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Ex: Le compte fourni n'existe pas en base"
					/>
				</label>

				<label className="form-group">
					<span>Code de statut</span>
					<select
						className="form-select"
						value={statusCode}
						onChange={(e) => setStatusCode(Number(e.target.value))}
					>
						{statusCodes.length > 0 ? (
							statusCodes.map((code) => (
								<option key={code} value={code}>{code}</option>
							))
						) : (
							<option value={statusCode}>{statusCode}</option>
						)}
					</select>
				</label>

				<button
					type="button"
					className="scenario-ai-btn"
					onClick={handleGenerateAI}
					disabled={!name.trim() || generating}
					title={!name.trim() ? "Donne d'abord un nom au scénario" : ''}
				>
					{generating ? (
						<><Loader2 size={15} className="scenario-ai-btn__spin" /> Génération en cours…</>
					) : (
						<><Sparkles size={15} /> Générer avec l'IA</>
					)}
				</button>

				{aiError && <div className="alert alert-warning">{aiError}</div>}

				{aiWarning && <div className="alert alert-warning">⚠️ {aiWarning}</div>}

				{aiGenerated && (
					<div className="scenario-ai-badge"><Sparkles size={13} /> Généré par IA — vérifie avant d'enregistrer</div>
				)}

				<label className="form-group">
					<span>Corps de requête exemple</span>
					<textarea
						className="scenario-code-editor"
						value={requestExample}
						onChange={(e) => { setRequestExample(e.target.value); setAiGenerated(false) }}
						spellCheck={false}
					/>
				</label>

				<label className="form-group">
					<span>Contenu de la réponse</span>
					<textarea
						className="scenario-code-editor"
						value={mockContent}
						onChange={(e) => { setMockContent(e.target.value); setAiGenerated(false) }}
						spellCheck={false}
					/>
				</label>

				<div className="scenario-panel__footer">
					<button type="button" className="btn btn-outline-secondary" onClick={onClose}>
						Annuler
					</button>
					<button type="button" className="btn btn-orange" onClick={handleSave} disabled={saving}>
						{saving ? 'Enregistrement…' : 'Enregistrer'}
					</button>
				</div>
			</div>
		</div>
	)
}
 
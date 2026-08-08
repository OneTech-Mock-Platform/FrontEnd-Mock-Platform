import { useState } from 'react'
import { AlertCircle, AlertTriangle, Loader2, Sparkles, X } from 'lucide-react'
import { getToken } from '../services/api'

export type ScenarioFormSavePayload = {
	name: string
	description: string
	statusCode: number
	requestExample: string
	mockContent: string
}

export type ScenarioFormInitialData = {
	name?: string
	description?: string
	statusCode: number
	requestExample?: string
	mockContent?: string
}

export default function ScenarioFormPanel({
	endpointId,
	statusCodes,
	initialData,
	onClose,
	onSaved,
}: {
	endpointId: string
	statusCodes: string[]
	initialData?: ScenarioFormInitialData
	onClose: () => void
	onSaved: (payload: ScenarioFormSavePayload) => void | Promise<void>
}) {
	const isEditing = !!initialData
	const [name, setName] = useState(initialData?.name ?? '')
	const [description, setDescription] = useState(initialData?.description ?? '')
	const [statusCode, setStatusCode] = useState<number>(
		initialData?.statusCode ?? (statusCodes.length ? Number(statusCodes[0]) : 400),
	)
	const [requestExample, setRequestExample] = useState(initialData?.requestExample ?? '{}')
	const [mockContent, setMockContent] = useState(initialData?.mockContent ?? '{}')
	const [aiGenerated, setAiGenerated] = useState(false)
	const [generating, setGenerating] = useState(false)
	const [aiError, setAiError] = useState('')
	const [aiWarning, setAiWarning] = useState('')
	const [saving, setSaving] = useState(false)
	const [formError, setFormError] = useState('')

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
			setAiError('AI generation unavailable — fill in the fields manually.')
		} finally {
			setGenerating(false)
		}
	}

	const handleSave = async () => {
		setFormError('')

		if (!name.trim()) {
			setFormError('Scenario name is required.')
			return
		}
		if (!description.trim()) {
			setFormError('Description is required.')
			return
		}
		try {
			JSON.parse(requestExample)
		} catch {
			setFormError('The example request body must be valid JSON.')
			return
		}
		try {
			JSON.parse(mockContent)
		} catch {
			setFormError('The response content must be valid JSON.')
			return
		}

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
					<h3>{isEditing ? 'Edit scenario' : 'New scenario'}</h3>
					<button type="button" className="scenario-panel__close" onClick={onClose} aria-label="Close">
						<X size={18} />
					</button>
				</div>

				<label className="form-group">
					<span>Scenario name</span>
					<input
						className="form-control"
						value={name}
						onChange={(e) => { setName(e.target.value); setFormError('') }}
						placeholder="E.g.: Account not found"
					/>
				</label>

				<label className="form-group">
					<span>Description</span>
					<input
						className="form-control"
						value={description}
						onChange={(e) => { setDescription(e.target.value); setFormError('') }}
						placeholder="E.g.: The given account does not exist in the database"
					/>
				</label>

				<label className="form-group">
					<span>Status code</span>
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
					title={!name.trim() ? 'Give the scenario a name first' : ''}
				>
					{generating ? (
						<><Loader2 size={15} className="scenario-ai-btn__spin" /> Generating…</>
					) : (
						<><Sparkles size={15} /> Generate with AI</>
					)}
				</button>

				{aiError && (
					<div className="profile-alert profile-alert--warning">
						<AlertTriangle size={18} />
						{aiError}
					</div>
				)}

				{aiWarning && (
					<div className="profile-alert profile-alert--warning">
						<AlertTriangle size={18} />
						{aiWarning}
					</div>
				)}

				{aiGenerated && (
					<div className="scenario-ai-badge"><Sparkles size={13} /> Generated by AI — review before saving</div>
				)}

				{formError && (
					<div className="profile-alert profile-alert--error">
						<AlertCircle size={18} />
						{formError}
					</div>
				)}

				<label className="form-group">
					<span>Example request body</span>
					<textarea
						className="scenario-code-editor"
						value={requestExample}
						onChange={(e) => { setRequestExample(e.target.value); setAiGenerated(false); setFormError('') }}
						spellCheck={false}
					/>
				</label>

				<label className="form-group">
					<span>Response content</span>
					<textarea
						className="scenario-code-editor"
						value={mockContent}
						onChange={(e) => { setMockContent(e.target.value); setAiGenerated(false); setFormError('') }}
						spellCheck={false}
					/>
				</label>

				<div className="scenario-panel__footer">
					<button type="button" className="btn btn-outline-secondary" onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className="btn btn-orange"
						onClick={handleSave}
						disabled={saving || !name.trim() || !description.trim()}
					>
						{saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save'}
					</button>
				</div>
			</div>
		</div>
	)
}
 
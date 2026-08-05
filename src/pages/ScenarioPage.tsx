import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import RequestPayloadBlock from '../components/RequestPayloadBlock'
import ResponseViewer from '../components/ResponseViewer'
import { getToken } from '../services/api'
import { STATUS_COLORS, resolvePath, runMockTest, type TestResult } from '../lib/mockTest'

type Scenario = {
  id: string
  statusCode: number
  description?: string
  name?: string
  isDefault: boolean
  mockContent?: string
  requestExample?: Record<string, unknown> | null
  endpoint?: {
    specId: string
    path: string
    method: string
  }
}

export default function ScenarioPage() {
  const { endpointId } = useParams<{ endpointId: string }>()
  const navigate = useNavigate()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [activeTab, setActiveTab] = useState<'stored' | 'live'>('stored')
  const [pathParams, setPathParams] = useState<Record<string, string>>({})
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [testingScenarioId, setTestingScenarioId] = useState<string | null>(null)

  const specId = scenarios[0]?.endpoint?.specId
  const endpointPath = scenarios[0]?.endpoint?.path
  const endpointMethod = scenarios[0]?.endpoint?.method
  const dynamicParamNames = endpointPath
    ? Array.from(new Set((endpointPath.match(/\{[^}]+\}/g) ?? []).map((s) => s.slice(1, -1))))
    : []

  async function handleTest(sc: Scenario) {
    setSelectedScenario(sc)
    setActiveTab('live')
    if (!endpointPath || !endpointMethod || !specId) return
    setTestingScenarioId(sc.id)
    const result = await runMockTest({
      specId,
      method: endpointMethod,
      path: endpointPath,
      pathParams,
      scenarioId: sc.id,
      requestExample: sc.requestExample,
    })
    setTestResult(result)
    setTestingScenarioId(null)
  }

  useEffect(() => {
    if (!endpointId) return
    const load = async () => {
      setLoading(true)
      try {
        const token = getToken()
        const headers: Record<string, string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        const res = await fetch(`/api/scenarios/endpoint/${endpointId}`, { headers })
        if (!res.ok) throw new Error('Impossible de charger les scénarios.')
        const data = await res.json() as { items: Scenario[] }
        setScenarios(data.items)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [endpointId])

  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="app-main">
          <Navbar />
          <main className="app-stage">
            <div className="spec-empty spec-loading-full">
              <div className="spec-spinner" />
              Chargement des scénarios…
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

            <button
              type="button"
              className="spec-back-btn"
              onClick={() => navigate(-1)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Retour
            </button>

            {dynamicParamNames.length > 0 && (
              <section className="spec-card" style={{ marginBottom: 20 }}>
                <div className="panel-header">
                  <h2 className="panel-title mb-0">Paramètres du chemin</h2>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {dynamicParamNames.map((name) => (
                    <label key={name} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.82rem' }}>
                      {name}
                      <input
                        type="text"
                        className="form-control"
                        placeholder="test-id"
                        value={pathParams[name] ?? ''}
                        onChange={(e) => setPathParams((prev) => ({ ...prev, [name]: e.target.value }))}
                        style={{ minWidth: 160 }}
                      />
                    </label>
                  ))}
                </div>
              </section>
            )}

            <section className="spec-card">
              <div className="panel-header">
                <div>
                  <p className="section-kicker text-orange mb-1">Scénarios</p>
                  <h2 className="panel-title mb-0">Réponses HTTP disponibles</h2>
                </div>
                <span className="spec-badge">
                  {scenarios.length} scénario{scenarios.length !== 1 ? 's' : ''}
                </span>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

             
              {scenarios.length === 0 ? (
                <div className="spec-empty">
                  Aucun scénario généré. Réimportez votre fichier OpenAPI.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {scenarios.map((sc) => {
                    const group = String(sc.statusCode)[0]
                    const meta = STATUS_COLORS[group] ?? STATUS_COLORS['5']
                    return (
                      <div
                        key={sc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '16px 20px',
                          borderRadius: 12,
                          border: `1px solid ${meta.border}`,
                          background: meta.bg,
                        }}
                      >
                        {/* Code HTTP */}
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          color: meta.color,
                          minWidth: 44,
                        }}>
                          {sc.statusCode}
                        </span>

                        {/* Description */}
                        <span style={{ flex: 1, fontSize: '0.88rem', color: '#1c1c3c' }}>
                          {sc.description ?? '—'}
                        </span>

                       

      
                        <button
                          type="button"
                          className="btn btn-orange"
                          title="Affiche la donnée mock stockée en base (pas d'appel réseau)"
                          style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                          onClick={() => {
                            setSelectedScenario(sc)
                            setActiveTab('stored')
                          }}
                        >
                          📦 Voir le mock stocké
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled={testingScenarioId === sc.id}
                          title="Envoie une vraie requête HTTP au mock server et affiche la réponse reçue"
                          style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                          onClick={() => void handleTest(sc)}
                        >
                          {testingScenarioId === sc.id ? 'Test en cours…' : '🌐 Tester en direct'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {selectedScenario && (
              <section className="spec-card" style={{ marginTop: 20 }}>
                <div className="panel-header">
                  <h2 className="panel-title mb-0">Détails du scénario — {selectedScenario.statusCode}</h2>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button
                    type="button"
                    className={activeTab === 'stored' ? 'btn btn-orange' : 'btn btn-outline-secondary'}
                    style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                    onClick={() => setActiveTab('stored')}
                  >
                    📦 Stocké
                  </button>
                  <button
                    type="button"
                    className={activeTab === 'live' ? 'btn btn-orange' : 'btn btn-outline-secondary'}
                    style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                    onClick={() => setActiveTab('live')}
                  >
                    🌐 Testé en direct
                  </button>
                </div>

                {activeTab === 'stored' ? (
                  <>
                    <span className="spec-badge" style={{ display: 'inline-flex', marginBottom: 12 }}>
                      📦 Aperçu statique — aucun appel réseau
                    </span>
                    <RequestPayloadBlock requestExample={selectedScenario.requestExample} statusCode={selectedScenario.statusCode} />
                    {selectedScenario.mockContent ? (
                      <pre
                        tabIndex={0}
                        role="region"
                        aria-label="Contenu du mock, zone défilable"
                        style={{
                          background: '#0f172a',
                          color: '#e2e8f0',
                          borderRadius: 10,
                          padding: 16,
                          fontSize: '0.78rem',
                          lineHeight: 1.7,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          overflow: 'auto',
                          maxHeight: 450,
                          fontFamily: "'Fira Code', monospace",
                        }}>
                        {selectedScenario.mockContent}
                      </pre>
                    ) : (
                      <div className="spec-empty">
                        Aucune donnée mock disponible pour ce scénario.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 12px' }}>
                      Réponse réellement reçue d'une requête HTTP envoyée au mock server (<code>/mock/...</code>).
                    </p>

                    <RequestPayloadBlock requestExample={selectedScenario.requestExample} statusCode={selectedScenario.statusCode} />

                    {testResult?.scenarioId !== selectedScenario.id || !testResult ? (
                      <div className="spec-empty" style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                        Aucun test lancé pour ce scénario pour l'instant.
                        <button
                          type="button"
                          className="btn btn-orange"
                          disabled={testingScenarioId === selectedScenario.id}
                          style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                          onClick={() => void handleTest(selectedScenario)}
                        >
                          {testingScenarioId === selectedScenario.id ? 'Test en cours…' : '🌐 Tester en direct'}
                        </button>
                      </div>
                    ) : (
                      <ResponseViewer
                        requestLabel={`${endpointMethod ?? ''} ${endpointPath ? resolvePath(endpointPath, pathParams) : ''}`}
                        result={testResult}
                        onRetry={() => void handleTest(selectedScenario)}
                        retrying={testingScenarioId === selectedScenario.id}
                      />
                    )}
                  </>
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
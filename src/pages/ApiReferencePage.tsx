import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ChevronDown, Copy, FileJson, Plus, Search, Send } from 'lucide-react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import RequestPayloadBlock from '../components/RequestPayloadBlock'
import ResponseViewer from '../components/ResponseViewer'
import ScenarioFormPanel, { type ScenarioFormSavePayload } from '../components/ScenarioFormPanel'
import { getToken } from '../services/api'
import { STATUS_COLORS, resolvePath, runMockTest, type TestResult } from '../lib/mockTest'

type EndpointParameter = {
  name: string
  in: string
  required: boolean
  description?: string
}

type EndpointDetails = {
  description?: string
  operationId?: string
  tags: string[]
  parameters?: EndpointParameter[]
  responses: {
    statusCode: string
    description: string
    contentType?: string
  }[]
}

type EndpointWarning = { code: string; message: string }

type Endpoint = {
  id: string
  path: string
  method: string
  summary?: string
  responses?: EndpointDetails
  warnings?: EndpointWarning[]
}

type Scenario = {
  id: string
  statusCode: number
  description?: string
  name?: string
  isDefault: boolean
  mockContent?: string
  requestExample?: Record<string, unknown> | null
}

const methodColors: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: 'rgba(34,197,94,0.12)', text: '#15803d', border: 'rgba(34,197,94,0.25)' },
  POST: { bg: 'rgba(59,130,246,0.12)', text: '#1d4ed8', border: 'rgba(59,130,246,0.25)' },
  PUT: { bg: 'rgba(234,179,8,0.12)', text: '#a16207', border: 'rgba(234,179,8,0.25)' },
  PATCH: { bg: 'rgba(168,85,247,0.12)', text: '#6d28d9', border: 'rgba(168,85,247,0.25)' },
  DELETE: { bg: 'rgba(239,68,68,0.12)', text: '#b91c1c', border: 'rgba(239,68,68,0.25)' },
  OPTIONS: { bg: 'rgba(107,114,128,0.12)', text: '#4b5563', border: 'rgba(107,114,128,0.25)' },
  HEAD: { bg: 'rgba(107,114,128,0.12)', text: '#4b5563', border: 'rgba(107,114,128,0.25)' },
}

export default function ApiReferencePage() {
  const { specId, endpointId } = useParams<{ specId: string; endpointId?: string }>()
  const navigate = useNavigate()

  const [specName, setSpecName] = useState('')
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [loadingEndpoints, setLoadingEndpoints] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loadingScenarios, setLoadingScenarios] = useState(false)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showScenarioPanel, setShowScenarioPanel] = useState(false)

  const [activeTab, setActiveTab] = useState<'stored' | 'live'>('live')
  const [pathParams, setPathParams] = useState<Record<string, string>>({})
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [testing, setTesting] = useState(false)
  const [copied, setCopied] = useState(false)

  function authHeaders(): Record<string, string> {
    const token = getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // Charge les endpoints de la spec
  useEffect(() => {
    if (!specId) return
    const load = async () => {
      setLoadingEndpoints(true)
      try {
        const [specRes, endpointsRes] = await Promise.all([
          fetch(`/api/specifications/${specId}`, { headers: authHeaders() }),
          fetch(`/api/specifications/${specId}/endpoints`, { headers: authHeaders() }),
        ])
        if (specRes.ok) {
          const specData = await specRes.json()
          setSpecName(specData.name ?? '')
        }
        if (!endpointsRes.ok) throw new Error('Impossible de charger les endpoints.')
        const data = await endpointsRes.json()
        setEndpoints(data.items ?? [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur.')
      } finally {
        setLoadingEndpoints(false)
      }
    }
    void load()
  }, [specId])

  // Redirige vers le premier endpoint si aucun n'est sélectionné dans l'URL
  useEffect(() => {
    if (!loadingEndpoints && !endpointId && endpoints.length > 0 && specId) {
      navigate(`/specifications/${specId}/reference/${endpoints[0].id}`, { replace: true })
    }
  }, [loadingEndpoints, endpointId, endpoints, specId, navigate])

  const selectedEndpoint = useMemo(
    () => endpoints.find((e) => e.id === endpointId) ?? null,
    [endpoints, endpointId],
  )

  // Charge les scénarios de l'endpoint sélectionné (réutilisable après création manuelle)
  const loadScenarios = useCallback(async (selectId?: string) => {
    if (!endpointId) return
    setLoadingScenarios(true)
    try {
      const res = await fetch(`/api/scenarios/endpoint/${endpointId}`, { headers: authHeaders() })
      if (!res.ok) throw new Error('Impossible de charger les scénarios.')
      const data = await res.json() as { items: Scenario[] }
      const items = data.items ?? []
      setScenarios(items)
      const fallback = items.find((s) => s.isDefault) ?? items[0] ?? null
      setSelectedScenarioId(selectId ?? fallback?.id ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur.')
    } finally {
      setLoadingScenarios(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpointId])

  useEffect(() => {
    if (!endpointId) return
    setActiveTab('live') // 'stored'
    setTestResult(null)
    setPathParams({})
    void loadScenarios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpointId])

  async function handleScenarioSaved(payload: ScenarioFormSavePayload) {
    if (!endpointId) return
    let requestExampleParsed: Record<string, unknown> | undefined
    try {
      const trimmed = payload.requestExample.trim()
      requestExampleParsed = trimmed ? JSON.parse(trimmed) : undefined
    } catch {
      setError('Le corps de requête doit être un JSON valide.')
      return
    }

    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          endpointId,
          name: payload.name || undefined,
          description: payload.description || undefined,
          statusCode: payload.statusCode,
          requestExample: requestExampleParsed,
          mockContent: payload.mockContent,
        }),
      })
      if (!res.ok) throw new Error("La création du scénario a échoué.")
      const created = await res.json() as { id: string }
      setShowScenarioPanel(false)
      await loadScenarios(created.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur.')
    }
  }

  const filteredEndpoints = search.trim()
    ? endpoints.filter(
        (e) =>
          e.path.toLowerCase().includes(search.toLowerCase()) ||
          (e.summary ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : endpoints

  const groupedEndpoints = useMemo(() => {
    const groups = new Map<string, Endpoint[]>()
    for (const ep of filteredEndpoints) {
      const tag = ep.responses?.tags?.[0] || 'Autres'
      if (!groups.has(tag)) groups.set(tag, [])
      groups.get(tag)!.push(ep)
    }
    return Array.from(groups.entries())
  }, [filteredEndpoints])

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId) ?? null

  const dynamicParamNames = selectedEndpoint
    ? Array.from(new Set((selectedEndpoint.path.match(/\{[^}]+\}/g) ?? []).map((s) => s.slice(1, -1))))
    : []

  async function handleTest() {
    if (!selectedEndpoint || !selectedScenario || !specId) return
    setActiveTab('live')
    setTesting(true)
    const result = await runMockTest({
      specId,
      method: selectedEndpoint.method,
      path: selectedEndpoint.path,
      pathParams,
      scenarioId: selectedScenario.id,
      requestExample: selectedScenario.requestExample,
    })
    setTestResult(result)
    setTesting(false)
  }

  if (loadingEndpoints) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="app-main">
          <Navbar />
          <main className="app-stage">
            <div className="spec-empty spec-loading-full">
              <div className="spec-spinner" />
              Chargement de la référence API…
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Navbar />
        <main className="app-stage">
          <div className="spec-page">
            <div className="spec-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                type="button"
                className="spec-back-icon-btn"
                onClick={() => navigate('/specifications')}
                aria-label="Retour aux spécifications"
                title="Retour aux spécifications"
              >
                <ArrowLeft size={16} />
              </button>

              <div style={{ width: 1, alignSelf: 'stretch', background: '#e6e8f0' }} />

              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(247,148,29,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FileJson size={20} color="#f7941d" />
              </div>

              <div>
                <p className="section-kicker text-orange mb-0" style={{ fontSize: '0.72rem' }}>
                  Référence API
                </p>
                <h1 className="panel-title mb-0" style={{ fontSize: '1.15rem' }}>
                  {specName || 'Spécification'}
                </h1>
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="api-ref-grid">
              {/* Sidebar gauche : liste des endpoints, fixée et scrollable indépendamment de la page */}
              <div className="spec-endpoints-panel">
                <aside className="spec-card spec-endpoints-card">
                  <div className="panel-header" style={{ display: 'block' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={15} style={{ position: 'absolute', top: 10, left: 10, color: '#94a3b8' }} />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher un endpoint…"
                        aria-label="Rechercher un endpoint"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 32, fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div className="spec-endpoints-list">
                  {filteredEndpoints.length === 0 ? (
                    <p className="spec-empty-text">Aucun endpoint trouvé</p>
                  ) : (
                    groupedEndpoints.map(([tag, items]) => (
                      <div key={tag} style={{ marginBottom: 10 }}>
                        <p
                          className="section-kicker"
                          style={{ color: '#94a3b8', margin: '10px 4px 6px', fontSize: '0.7rem' }}
                        >
                          {tag}
                        </p>
                        {items.map((ep) => {
                          const colors = methodColors[ep.method] || methodColors.GET
                          const isActive = ep.id === endpointId
                          return (
                            <div
                              key={ep.id}
                              className="spec-endpoint-item"
                              style={
                                isActive
                                  ? { background: '#fff7ed', borderColor: '#fdba74', borderLeft: '3px solid #1d4ed8' }
                                  : { borderLeft: '3px solid transparent' }
                              }
                              onClick={() => navigate(`/specifications/${specId}/reference/${ep.id}`)}
                            >
                              <span
                                className="spec-method-badge"
                                style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                              >
                                {ep.method}
                              </span>
                              <span className="spec-endpoint-path">{ep.path}</span>
                            </div>
                          )
                        })}
                      </div>
                    ))
                  )}
                  </div>
                </aside>
              </div>

              {/* Contenu principal */}
              <section>
                {!selectedEndpoint ? (
                  <div className="spec-card">
                    <div className="spec-empty">Sélectionne un endpoint dans la liste à gauche.</div>
                  </div>
                ) : (
                  <>
                    <div className="spec-card" style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <span
                          className="spec-method-badge"
                          style={{
                            backgroundColor: (methodColors[selectedEndpoint.method] || methodColors.GET).bg,
                            color: (methodColors[selectedEndpoint.method] || methodColors.GET).text,
                            borderColor: (methodColors[selectedEndpoint.method] || methodColors.GET).border,
                            fontSize: '0.85rem',
                          }}
                        >
                          {selectedEndpoint.method}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#1c1c3c' }}>
                          {selectedEndpoint.path}
                        </span>
                      </div>
                      {selectedEndpoint.summary && (
                        <h2 className="panel-title mb-1" style={{ fontSize: '1.1rem' }}>{selectedEndpoint.summary}</h2>
                      )}
                      {selectedEndpoint.responses?.description && (
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                          {selectedEndpoint.responses.description}
                        </p>
                      )}

                      {/* Incohérences détectées dans la spec elle-même (pas des erreurs de test),
                          calculées à la volée côté backend depuis ce qui est déjà stocké — voir
                          spec-warnings.util.ts. */}
                      {selectedEndpoint.warnings && selectedEndpoint.warnings.length > 0 && (
                        <div className="spec-warning-banner">
                          {selectedEndpoint.warnings.map((w) => (
                            <div key={w.code}>⚠️ {w.message}</div>
                          ))}
                        </div>
                      )}

                      {selectedEndpoint.responses?.parameters && selectedEndpoint.responses.parameters.length > 0 && (
                        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #eef0f6' }}>
                          <p className="section-kicker" style={{ color: '#1d4ed8', marginBottom: 10 }}>
                            Paramètres de requête
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {selectedEndpoint.responses.parameters.map((param) => (
                              <div key={param.name}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <code style={{ fontWeight: 700, color: '#1c1c3c', fontSize: '0.85rem' }}>{param.name}</code>
                                  <span
                                    className="spec-badge"
                                    style={
                                      param.required
                                        ? { background: 'rgba(247,148,29,0.1)', color: '#f7941d', borderColor: 'rgba(247,148,29,0.2)', padding: '2px 8px', fontSize: '0.68rem' }
                                        : { padding: '2px 8px', fontSize: '0.68rem' }
                                    }
                                  >
                                    {param.required ? 'requis' : 'optionnel'}
                                  </span>
                                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{param.in}</span>
                                </div>
                                {param.description && (
                                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>{param.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="spec-card">
                      <div className="panel-header">
                        <h2 className="panel-title mb-0">Réponses</h2>
                      {<button
                          type="button"
                          className="btn btn-orange"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '7px 14px' }}
                          onClick={() => setShowScenarioPanel(true)}
                        >
                          <Plus size={15} /> Nouveau scénario
                        </button>}
                      </div>

                      {loadingScenarios ? (
                        <div className="spec-empty">Chargement des scénarios…</div>
                      ) : scenarios.length === 0 ? (
                        <div className="spec-empty">Aucun scénario généré pour cet endpoint.</div>
                      ) : (
                        <>
                          {/* Dropdown de sélection du code de statut, façon Beeceptor */}
                          <div style={{ position: 'relative', marginBottom: 18, display: 'inline-block' }}>
                            <button
                              type="button"
                              className="btn"
                              aria-haspopup="listbox"
                              aria-expanded={dropdownOpen}
                              aria-label="Choisir le code de statut de la réponse"
                              onClick={() => setDropdownOpen((v) => !v)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                padding: '8px 14px',
                                background: selectedScenario
                                  ? (STATUS_COLORS[String(selectedScenario.statusCode)[0]] ?? STATUS_COLORS['5']).bg
                                  : '#f4f6fb',
                                color: selectedScenario
                                  ? (STATUS_COLORS[String(selectedScenario.statusCode)[0]] ?? STATUS_COLORS['5']).color
                                  : '#1c1c3c',
                                border: `1px solid ${selectedScenario ? (STATUS_COLORS[String(selectedScenario.statusCode)[0]] ?? STATUS_COLORS['5']).border : '#e6e8f0'}`,
                              }}
                            >
                              {selectedScenario ? selectedScenario.statusCode : '—'}
                              <span style={{ fontFamily: 'inherit', fontWeight: 500, fontSize: '0.85rem' }}>
                             {/*    {selectedScenario?.description || selectedScenario?.name || ''} */}
                              </span>
                              <ChevronDown size={14} />
                            </button>

                            {dropdownOpen && (
                              <div className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 20 }}>
                                {scenarios
                                  .slice()
                                  .sort((a, b) => a.statusCode - b.statusCode)
                                  .map((sc) => {
                                    const meta = STATUS_COLORS[String(sc.statusCode)[0]] ?? STATUS_COLORS['5']
                                    return (
                                      <button
                                        key={sc.id}
                                        type="button"
                                        className="dropdown-item"
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left' }}
                                        onClick={() => {
                                          setSelectedScenarioId(sc.id)
                                          setDropdownOpen(false)
                                        }}
                                      >
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: meta.color, minWidth: 34 }}>
                                          {sc.statusCode}
                                        </span>
                                        <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                                        {/*   {sc.description || sc.name || ''} */}
                                        </span>
                                      </button>
                                    )
                                  })}
                              </div>
                            )}
                          </div>

                          {/* Onglets Stocké / Testé en direct */}
                          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            {/* 
                            <button
                              type="button"
                              className={activeTab === 'stored' ? 'btn btn-orange' : 'btn btn-outline-secondary'}
                              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                              onClick={() => setActiveTab('stored')}
                            >
                              📦 Stocké
                            </button>
                            */}
                            {/* 
                              type="button"
                              className={activeTab === 'live' ? 'btn btn-orange' : 'btn btn-outline-secondary'}
                              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                              onClick={() => setActiveTab('live')}
                            >
                              🌐 Testé
                            </button>
                            */}
                          </div>

                          {/* 
                          {activeTab === 'stored' && (
                            <>
                              <span className="spec-badge" style={{ display: 'inline-flex', marginBottom: 12 }}>
                                📦 Aperçu statique — aucun appel réseau
                              </span>
                              <RequestPayloadBlock requestExample={selectedScenario?.requestExample} statusCode={selectedScenario?.statusCode} />
                              {selectedScenario?.mockContent ? (
                                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #1e293b' }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '8px 14px',
                                    background: '#1e293b',
                                  }}>
                                    <span style={{ display: 'flex', gap: 5 }}>
                                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#475569' }} />
                                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#475569' }} />
                                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#475569' }} />
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                      response-{selectedScenario.statusCode}.json
                                    </span>
                                    {(() => {
                                      const meta = STATUS_COLORS[String(selectedScenario.statusCode)[0]] ?? STATUS_COLORS['5']
                                      return (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: meta.color }}>
                                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
                                          {selectedScenario.statusCode}
                                        </span>
                                      )
                                    })()}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        void navigator.clipboard.writeText(selectedScenario.mockContent ?? '')
                                        setCopied(true)
                                        setTimeout(() => setCopied(false), 1500)
                                      }}
                                      style={{
                                        marginLeft: 'auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        background: 'transparent',
                                        border: 'none',
                                        color: copied ? '#4ade80' : '#94a3b8',
                                        fontSize: '0.72rem',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {copied ? <Check size={13} /> : <Copy size={13} />}
                                      {copied ? 'Copié' : 'Copier'}
                                    </button>
                                  </div>
                                  <pre style={{
                                    background: '#0f172a',
                                    color: '#e2e8f0',
                                    margin: 0,
                                    padding: 16,
                                    fontSize: '0.78rem',
                                    lineHeight: 1.7,
                                    overflow: 'auto',
                                    maxHeight: 450,
                                    fontFamily: "'Fira Code', monospace",
                                  }}>
                                    {selectedScenario.mockContent}
                                  </pre>
                                </div>
                              ) : (
                                <div className="spec-empty">Aucune donnée mock disponible pour ce scénario.</div>
                              )}
                            </>
                          )}
                          */}
                          <>
                              {/* 
                              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 12px' }}>
                                Réponse réellement reçue d'une requête HTTP envoyée au mock server (<code>/mock/...</code>).
                              </p>
                              */}

                              <RequestPayloadBlock requestExample={selectedScenario?.requestExample} statusCode={selectedScenario?.statusCode} />

                           {/*    {dynamicParamNames.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
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
                              )} */}

                              {testResult?.scenarioId !== selectedScenario?.id || !testResult ? (
                                <div className="spec-empty" style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                                  Aucun test lancé pour ce scénario pour l'instant.
                                  <button
                                    type="button"
                                    className="btn btn-orange"
                                    disabled={testing}
                                    style={{ fontSize: '0.78rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                                    onClick={() => void handleTest()}
                                  >
                                    <Send size={13} />
                                    {testing ? 'Test en cours…' : 'Tester en direct'}
                                  </button>
                                </div>
                              ) : (
                                <ResponseViewer
                                  requestLabel={`${selectedEndpoint.method} ${resolvePath(selectedEndpoint.path, pathParams)}`}
                                  result={testResult}
                                  onRetry={() => void handleTest()}
                                  retrying={testing}
                                />
                              )}
                            </>
                        </>
                      )}
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>

    {showScenarioPanel && selectedEndpoint && (
      <ScenarioFormPanel
        endpointId={selectedEndpoint.id}
        statusCodes={(selectedEndpoint.responses?.responses ?? []).map((r) => r.statusCode)}
        onClose={() => setShowScenarioPanel(false)}
        onSaved={handleScenarioSaved}
      />
    )}
    </>
  )
}

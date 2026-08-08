import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import {
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  Star,
  Send,
  Clock,
  Link2,
  Check,
  AlertTriangle,
  Copy,
} from 'lucide-react'
import JsonCodeBlock from '../components/JsonCodeBlock'
import { resolvePath, NOISY_HEADERS, type TestResult } from '../lib/mockTest'
import logo from '../assets/images/onetech_Logo.png'
import './PublicMockPage.css'

type Scenario = {
  id: string
  statusCode: number
  name: string
  description?: string
  isDefault: boolean
  requestExample?: Record<string, unknown> | null
  delayMs?: number
}
type Endpoint = { id: string; path: string; method: string; summary?: string; responses?: { tags?: string[] }; scenarios: Scenario[] }
type SpecInfo = { id: string; name: string; version?: string; description?: string }


function scenarioLabel(sc: Scenario, method?: string, path?: string): string {
  const raw = sc.description || sc.name || ''
  let label = raw
  if (method && path) {
    const prefix = `${method} ${path} — `
    if (raw.startsWith(prefix)) label = raw.slice(prefix.length)
  }
  label = label.replace(/^\d+\s*—\s*/, '')
  return label === String(sc.statusCode) ? '' : label
}

const METHOD_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  GET: { bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0' },
  POST: { bg: '#dbeafe', color: '#2563eb', border: '#bfdbfe' },
  PUT: { bg: '#ffedd5', color: '#ea580c', border: '#fed7aa' },
  PATCH: { bg: '#ffedd5', color: '#ea580c', border: '#fed7aa' },
  DELETE: { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
}
function methodStyle(method: string) {
  return METHOD_COLORS[method] ?? METHOD_COLORS.GET
}

function familyStyle(code: number) {
  if (code < 300) return { bg: '#dcfce7', border: '#bbf7d0', color: '#16a34a' }
  if (code < 400) return { bg: '#dbeafe', border: '#bfdbfe', color: '#2563eb' }
  if (code < 500) return { bg: '#ffedd5', border: '#fed7aa', color: '#ea580c' }
  return { bg: '#fee2e2', border: '#fecaca', color: '#dc2626' }
}
function familyKey(code: number): string {
  return `${Math.floor(code / 100)}xx`
}
function familyLabel(code: number): string {
  if (code < 200) return 'Information'
  if (code < 300) return 'Success'
  if (code < 400) return 'Redirection'
  if (code < 500) return 'Client errors'
  return 'Server errors'
}

export default function PublicMockPage() {
  const { specId } = useParams<{ specId: string }>()
  const [spec, setSpec] = useState<SpecInfo | null>(null)
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)
  const [result, setResult] = useState<TestResult | null>(null)
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null)
  const [baseUrlCopied, setBaseUrlCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [headerCopied, setHeaderCopied] = useState(false)
  const [collapsedTags, setCollapsedTags] = useState<Set<string>>(new Set())
  const [collapsedFamilies, setCollapsedFamilies] = useState<Set<string>>(new Set())
  const [rightTab, setRightTab] = useState<'test' | 'details'>('test')
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'infos'>('body')

  const baseUrl = `${import.meta.env.VITE_MOCK_BASE_URL ?? window.location.origin}/mock/${specId}`

  useEffect(() => {
    const load = async () => {
      try {
        const [specRes, epRes] = await Promise.all([
          fetch(`/api/public/specs/${specId}`),
          fetch(`/api/public/specs/${specId}/endpoints`),
        ])
        if (!specRes.ok) throw new Error('This specification could not be found.')
        setSpec(await specRes.json())
        const items: Endpoint[] = (await epRes.json()).items
        setEndpoints(items)
        setSelectedId(items[0]?.id ?? null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Loading error.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [specId])

  const grouped = useMemo(() => {
    const filtered = endpoints.filter((e) => `${e.method} ${e.path} ${e.summary ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    const byTag = new Map<string, Endpoint[]>()
    for (const ep of filtered) {
      const tag = ep.responses?.tags?.[0] ?? 'Other'
      if (!byTag.has(tag)) byTag.set(tag, [])
      byTag.get(tag)!.push(ep)
    }
    return Array.from(byTag.entries())
  }, [endpoints, search])

  const totalFiltered = useMemo(() => grouped.reduce((sum, [, eps]) => sum + eps.length, 0), [grouped])

  const selected = endpoints.find((e) => e.id === selectedId)

  useEffect(() => {
    if (selected) {
      const def = selected.scenarios.find((s) => s.isDefault) ?? selected.scenarios[0]
      setSelectedScenarioId(def?.id ?? null)
      setResult(null)
    }
  }, [selectedId])

  const selectedScenario = selected?.scenarios.find((s) => s.id === selectedScenarioId)

  const scenarioFamilies = useMemo(() => {
    if (!selected) return []
    const byFamily = new Map<string, Scenario[]>()
    for (const sc of selected.scenarios) {
      const key = familyKey(sc.statusCode)
      if (!byFamily.has(key)) byFamily.set(key, [])
      byFamily.get(key)!.push(sc)
    }
    return Array.from(byFamily.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, scenarios]) => ({
        key,
        label: familyLabel(scenarios[0].statusCode),
        style: familyStyle(scenarios[0].statusCode),
        scenarios: scenarios.sort((a, b) => a.statusCode - b.statusCode),
      }))
  }, [selected])

  const testedUrl = selected ? `${baseUrl}${resolvePath(selected.path, {})}` : ''

  const testScenario = async (ep: Endpoint, sc: Scenario) => {
    setLoadingScenario(sc.id)
    setResponseTab('body')
    const url = `${baseUrl}${resolvePath(ep.path, {})}`
    const start = performance.now()
    try {
      const res = await fetch(url, { method: ep.method, headers: { Prefer: `scenario=${sc.id}` } })
      const timeMs = Math.round(performance.now() - start)
      const body = await res.text()
      const headers: Record<string, string> = {}
      res.headers.forEach((v, k) => { headers[k] = v })
      setResult({ scenarioId: sc.id, status: res.status, headers, body, timeMs })
    } catch {
      setResult({ scenarioId: sc.id, error: 'Could not reach the mock server (is the backend running?).' })
    } finally {
      setLoadingScenario(null)
    }
  }

  const toggleTag = (tag: string) => {
    setCollapsedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }
  const toggleFamily = (key: string) => {
    setCollapsedFamilies((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (loading) return <div className="pm-loading">Loading…</div>
  if (error) return <div className="pm-page-error">{error}</div>

  const activeResult = result && result.scenarioId === selectedScenarioId ? result : null
  const filteredHeaders = Object.entries(activeResult?.headers ?? {}).filter(([key]) => !NOISY_HEADERS.has(key.toLowerCase()))
  const responseBodySize = activeResult?.body ? new TextEncoder().encode(activeResult.body).length : 0

  return (
    <div className="pm-page">
      <div className="pm-topbar">
        <div className="pm-topbar__brand">
          <img src={logo} alt="OneTech" className="pm-topbar__logo" />
          <span className="pm-topbar__brand-name">Mock Server</span>
          <span className="pm-topbar__public-badge">Public</span>
        </div>

        <div className="pm-topbar__spec">
          <div className="pm-topbar__spec-info">
            <div className="pm-topbar__spec-icon"><FileText size={16} /></div>
            <div>
              <div className="pm-topbar__spec-title-row">
                <span className="pm-topbar__spec-title">{spec?.name}</span>
              </div>
            </div>
          </div>

          <div className="pm-topbar__actions">
            <button
              type="button"
              className="pm-topbar__copy-base-btn"
              onClick={() => { void navigator.clipboard.writeText(baseUrl); setBaseUrlCopied(true); setTimeout(() => setBaseUrlCopied(false), 1500) }}
            >
              {baseUrlCopied ? <Check size={14} /> : <Copy size={14} />}
              {baseUrlCopied ? 'Copied!' : 'Copy'}
            </button>
            <div className="pm-topbar__baseurl-chip">
              <span className="pm-topbar__baseurl-label">Base URL</span>
              <div className="pm-topbar__baseurl-row">
                <span className="pm-topbar__baseurl-value">{baseUrl}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pm-body">
        <aside className="pm-sidebar">
          <div className="pm-sidebar__search">
            <Search size={15} />
            <input placeholder="Search an endpoint…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <p className="pm-sidebar__header">Endpoints ({totalFiltered})</p>

          {grouped.length === 0 && <p className="pm-sidebar__empty">No endpoint matches this search.</p>}

          {grouped.map(([tag, eps]) => {
            const collapsed = collapsedTags.has(tag)
            return (
              <div key={tag} className="pm-sidebar__group">
                <button className="pm-sidebar__group-header" data-collapsed={collapsed} onClick={() => toggleTag(tag)}>
                  <ChevronDown size={14} />
                  <span>{tag}</span>
                  <span className="pm-sidebar__group-count">{eps.length}</span>
                </button>
                {!collapsed && eps.map((ep) => {
                  const meta = methodStyle(ep.method)
                  const active = ep.id === selectedId
                  return (
                    <button
                      key={ep.id}
                      className={`pm-sidebar__endpoint ${active ? 'pm-sidebar__endpoint--active' : ''}`}
                      onClick={() => setSelectedId(ep.id)}
                    >
                      <span className="pm-method-badge" style={{ background: meta.bg, color: meta.color }}>{ep.method}</span>
                      <span className="pm-sidebar__endpoint-path">{ep.path}</span>
                      <ChevronRight size={14} className="pm-sidebar__endpoint-chevron" />
                    </button>
                  )
                })}
              </div>
            )
          })}
        </aside>

        {selected && (
          <>
            <main className="pm-main">
              <div className="pm-main__title-row">
                <span className="pm-method-badge" style={{ background: methodStyle(selected.method).bg, color: methodStyle(selected.method).color }}>
                  {selected.method}
                </span>
                <code className="pm-main__path">{selected.path}</code>
              </div>
              {selected.summary && <p className="pm-main__description">{selected.summary}</p>}

              <p className="pm-main__section-label">Available scenarios</p>

              {scenarioFamilies.length === 0 && <p style={{ color: 'var(--pm-text-muted)', fontSize: '0.85rem' }}>No scenario available for this endpoint.</p>}

              {scenarioFamilies.map((family) => {
                const collapsed = collapsedFamilies.has(family.key)
                return (
                  <div
                    key={family.key}
                    className="pm-scenario-group"
                    style={{ '--pm-scenario-group-accent': family.style.color } as CSSProperties}
                  >
                    <button
                      className="pm-scenario-group__header"
                      data-collapsed={collapsed}
                      onClick={() => toggleFamily(family.key)}
                      style={{ color: family.style.color, background: family.style.bg }}
                    >
                      <ChevronDown size={14} />
                      <span>{family.key} — {family.label}</span>
                      <span className="pm-scenario-group__count" style={{ background: family.style.border, color: family.style.color }}>
                        {family.scenarios.length}
                      </span>
                    </button>
                    {!collapsed && family.scenarios.map((sc) => {
                      const style = familyStyle(sc.statusCode)
                      const label = scenarioLabel(sc, selected.method, selected.path)
                      return (
                        <button
                          key={sc.id}
                          className={`pm-scenario-card ${sc.id === selectedScenarioId ? 'pm-scenario-card--active' : ''}`}
                          onClick={() => { setSelectedScenarioId(sc.id); setResult(null) }}
                        >
                          <span className="pm-scenario-card__code" style={{ color: style.color }}>{sc.statusCode}</span>
                          <span className="pm-scenario-card__text">
                            <span className="pm-scenario-card__name">
                              {label || `${sc.statusCode}`}
                            </span>
                          </span>
                          <ChevronRight size={14} className="pm-scenario-card__chevron" />
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </main>

            <section className="pm-test">
              <div className="pm-test__tabs">
                <button className={`pm-test__tab ${rightTab === 'test' ? 'pm-test__tab--active' : ''}`} onClick={() => setRightTab('test')}>
                  Test the scenario
                </button>
                <button className={`pm-test__tab ${rightTab === 'details' ? 'pm-test__tab--active' : ''}`} onClick={() => setRightTab('details')}>
                  Endpoint details
                </button>
              </div>

              {rightTab === 'details' ? (
                <div className="pm-details-panel">
                  <div className="pm-details-panel__row">
                    <span className="pm-details-panel__label">Method</span>
                    <span className="pm-method-badge" style={{ background: methodStyle(selected.method).bg, color: methodStyle(selected.method).color }}>
                      {selected.method}
                    </span>
                  </div>
                  <div className="pm-details-panel__row">
                    <span className="pm-details-panel__label">Path</span>
                    <span className="pm-details-panel__value pm-details-panel__value--code">{selected.path}</span>
                  </div>
                  <div className="pm-details-panel__row">
                    <span className="pm-details-panel__label">Summary</span>
                    <span className="pm-details-panel__value">{selected.summary || '—'}</span>
                  </div>
                  <div className="pm-details-panel__row">
                    <span className="pm-details-panel__label">Group</span>
                    <span className="pm-details-panel__tag">{selected.responses?.tags?.[0] ?? 'Other'}</span>
                  </div>
                </div>
              ) : (
                <>
                  {selectedScenario?.requestExample && (
                    <div className="pm-test__section">
                      <p className="pm-test__section-title">Request</p>
                      <JsonCodeBlock value={selectedScenario.requestExample} />
                    </div>
                  )}

                  <div className="pm-test__section">
                    <p className="pm-test__section-title">Test with this scenario</p>

                    {selectedScenario && (
                      <div className="pm-header-hint">
                        <span className="pm-header-hint__label">
                          Header to add to target this scenario (Postman, curl…)
                        </span>
                        <div className="pm-header-hint__row">
                          <code className="pm-header-hint__code">Prefer: scenario={selectedScenario.id}</code>
                          <button
                            type="button"
                            className={`pm-icon-btn pm-header-hint__copy ${headerCopied ? 'pm-icon-btn--copied' : ''}`}
                            onClick={() => {
                              void navigator.clipboard.writeText(`Prefer: scenario=${selectedScenario.id}`)
                              setHeaderCopied(true)
                              setTimeout(() => setHeaderCopied(false), 1500)
                            }}
                            title="Copy header"
                            aria-label="Copy header"
                          >
                            {headerCopied ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>

                      </div>
                    )}

                    <div className="pm-test__run-row">
                      <button
                        className="pm-test__send-btn"
                        disabled={!selectedScenario || loadingScenario === selectedScenarioId}
                        onClick={() => selected && selectedScenario && void testScenario(selected, selectedScenario)}
                      >
                        <Send size={14} />
                        {loadingScenario === selectedScenarioId ? 'Sending…' : 'Send request'}
                      </button>
                    </div>
                  </div>

                  <div className="pm-test__section">
                    <p className="pm-test__section-title">Response</p>

                    {!activeResult && (
                      <div className="pm-test__empty">
                        No test run for this scenario yet. Click "Send request" to call the mock server live.
                      </div>
                    )}

                    {activeResult?.error && (
                      <div className="pm-test__error" role="alert">
                        <AlertTriangle size={18} />
                        <span>{activeResult.error}</span>
                      </div>
                    )}

                    {activeResult && !activeResult.error && (
                      <>
                        <div className="pm-response__status-row">
                          {typeof activeResult.status === 'number' && (
                            <span
                              className="pm-response__status-pill"
                              style={{
                                background: familyStyle(activeResult.status).bg,
                                color: familyStyle(activeResult.status).color,
                                borderColor: familyStyle(activeResult.status).border,
                              }}
                            >
                              {activeResult.status}
                            </span>
                          )}
                          {typeof activeResult.status === 'number' && (
                            <span className="pm-response__family-pill">{familyLabel(activeResult.status)}</span>
                          )}
                          <button
                            className={`pm-icon-btn ${linkCopied ? 'pm-icon-btn--copied' : ''}`}
                            style={{ marginLeft: typeof activeResult.status === 'number' ? 0 : 'auto' }}
                            onClick={() => { void navigator.clipboard.writeText(testedUrl); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1500) }}
                            title={linkCopied ? 'Link copied' : 'Copy tested link'}
                            aria-label={linkCopied ? 'Link copied' : 'Copy tested link'}
                          >
                            {linkCopied ? <Check size={14} /> : <Link2 size={14} />}
                          </button>
                          {typeof activeResult.timeMs === 'number' && (
                            <span className="pm-response__time">{activeResult.timeMs} ms</span>
                          )}
                        </div>

                        <div className="pm-response__tabs">
                          <button className={`pm-response__subtab ${responseTab === 'body' ? 'pm-response__subtab--active' : ''}`} onClick={() => setResponseTab('body')}>
                            Body
                          </button>
                          <button className={`pm-response__subtab ${responseTab === 'headers' ? 'pm-response__subtab--active' : ''}`} onClick={() => setResponseTab('headers')}>
                            Headers ({filteredHeaders.length})
                          </button>
                          <button className={`pm-response__subtab ${responseTab === 'infos' ? 'pm-response__subtab--active' : ''}`} onClick={() => setResponseTab('infos')}>
                            Info
                          </button>
                        </div>

                        {responseTab === 'body' && <JsonCodeBlock value={activeResult.body} />}

                        {responseTab === 'headers' && (
                          <div className="pm-response__headers">
                            {filteredHeaders.length === 0 && <div className="pm-response__header-row"><span className="pm-response__header-value">No notable headers.</span></div>}
                            {filteredHeaders.map(([key, value]) => (
                              <div key={key} className="pm-response__header-row">
                                <span className="pm-response__header-key">{key}</span>
                                <span className="pm-response__header-value">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {responseTab === 'infos' && (
                          <div className="pm-response__infos">
                            <div className="pm-response__header-row"><span className="pm-response__header-key">Method</span><span className="pm-response__header-value">{selected.method}</span></div>
                            <div className="pm-response__header-row"><span className="pm-response__header-key">Tested URL</span><span className="pm-response__header-value">{testedUrl}</span></div>
                            <div className="pm-response__header-row"><span className="pm-response__header-key">Status</span><span className="pm-response__header-value">{activeResult.status}</span></div>
                            <div className="pm-response__header-row"><span className="pm-response__header-key">Response time</span><span className="pm-response__header-value">{activeResult.timeMs} ms</span></div>
                          </div>
                        )}

                        <div className="pm-response__footer">
                          <span><Clock size={13} /> Response time: {activeResult.timeMs} ms</span>
                          <span>Size: {responseBodySize} B</span>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

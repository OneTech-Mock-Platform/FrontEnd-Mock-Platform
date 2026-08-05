import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

type Scenario = { id: string; statusCode: number; name: string; isDefault: boolean; requestExample?: unknown }
type Endpoint = { id: string; path: string; method: string; summary?: string; responses?: { tags?: string[] }; scenarios: Scenario[] }
type TestResult = { requestMethod: string; requestUrl: string; requestBody?: unknown; status: number; body: string }

const METHOD_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  GET:    { bg: 'rgba(34,197,94,0.08)',  color: '#15803d', border: 'rgba(34,197,94,0.25)' },
  POST:   { bg: 'rgba(59,130,246,0.08)', color: '#1d4ed8', border: 'rgba(59,130,246,0.25)' },
  PUT:    { bg: 'rgba(234,179,8,0.08)',  color: '#a16207', border: 'rgba(234,179,8,0.25)' },
  PATCH:  { bg: 'rgba(234,179,8,0.08)',  color: '#a16207', border: 'rgba(234,179,8,0.25)' },
  DELETE: { bg: 'rgba(239,68,68,0.08)',  color: '#b91c1c', border: 'rgba(239,68,68,0.25)' },
}

function statusFamilyStyle(code: number) {
  if (code < 300) return { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' }
  if (code < 400) return { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' }
  if (code < 500) return { bg: '#fffbeb', border: '#fde68a', color: '#a16207' }
  return { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c' }
}

export default function PublicMockPage() {
  const { specId } = useParams<{ specId: string }>()
  const [specName, setSpecName] = useState('')
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)
  const [result, setResult] = useState<TestResult | null>(null)
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const baseUrl = `${import.meta.env.VITE_MOCK_BASE_URL ?? window.location.origin}/mock/${specId}`

  useEffect(() => {
    const load = async () => {
      try {
        const [specRes, epRes] = await Promise.all([
          fetch(`/api/public/specs/${specId}`),
          fetch(`/api/public/specs/${specId}/endpoints`),
        ])
        if (!specRes.ok) throw new Error('Cette spécification est introuvable.')
        setSpecName((await specRes.json()).name)
        const items: Endpoint[] = (await epRes.json()).items
        setEndpoints(items)
        setSelectedId(items[0]?.id ?? null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement.')
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
      const tag = ep.responses?.tags?.[0] ?? 'Autres'
      if (!byTag.has(tag)) byTag.set(tag, [])
      byTag.get(tag)!.push(ep)
    }
    return Array.from(byTag.entries())
  }, [endpoints, search])

  const selected = endpoints.find((e) => e.id === selectedId)

  useEffect(() => {
    if (selected) {
      const def = selected.scenarios.find((s) => s.isDefault) ?? selected.scenarios[0]
      setSelectedScenarioId(def?.id ?? null)
    }
  }, [selectedId])

  const selectedScenario = selected?.scenarios.find((s) => s.id === selectedScenarioId)

  const testScenario = async (ep: Endpoint, sc: Scenario) => {
    setLoadingScenario(sc.id)
    const url = `${baseUrl}${ep.path.replace(/\{[^}]+\}/g, 'test-id')}`
    try {
      const res = await fetch(url, { method: ep.method, headers: { Prefer: `scenario=${sc.id}` } })
      const raw = await res.text()
      let formatted = raw
      try { formatted = JSON.stringify(JSON.parse(raw), null, 2) } catch { /* pas du JSON, on garde le texte brut */ }
      setResult({ requestMethod: ep.method, requestUrl: url, requestBody: sc.requestExample, status: res.status, body: formatted })
    } finally {
      setLoadingScenario(null)
    }
  }

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#64748b' }}>Chargement…</div>
  if (error) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: '#b91c1c' }}>{error}</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: '#0f172a', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f7941d', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700 }}>M</div>
        <span style={{ color: 'white', fontWeight: 600 }}>Mock Platform</span>
        <span style={{ color: '#64748b', marginLeft: 8 }}>/ {specName}</span>
      </header>

   
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>URL de base :</span>
        <code style={{ flex: 1, fontSize: '0.8rem', background: '#0f172a', color: '#e2e8f0', borderRadius: 6, padding: '6px 12px', maxWidth: 600, overflow: 'auto', whiteSpace: 'nowrap' }}>
          {baseUrl}
        </code>
        <button
          onClick={() => { void navigator.clipboard.writeText(baseUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          style={{ background: '#f7941d', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}
        >
          {copied ? '✓ Copié' : 'Copier'}
        </button>
      </div>

      
      <div style={{ display: 'flex', height: 'calc(100vh - 108px)' }}>

      
        <aside style={{ width: 320, borderRight: '1px solid #e2e8f0', background: 'white', overflowY: 'auto', padding: 16, flexShrink: 0 }}>
          <input
            placeholder="Rechercher un endpoint…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: '0.85rem' }}
          />
          {grouped.map(([tag, eps]) => (
            <div key={tag} style={{ marginBottom: 16 }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>{tag}</p>
              {eps.map((ep) => {
                const meta = METHOD_COLORS[ep.method] ?? METHOD_COLORS.GET
                const active = ep.id === selectedId
                return (
                  <button
                    key={ep.id}
                    onClick={() => { setSelectedId(ep.id); setResult(null); setDropdownOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                      padding: '8px 10px', borderRadius: 8, border: active ? '1px solid #f7941d' : '1px solid transparent',
                      background: active ? 'rgba(247,148,29,0.08)' : 'transparent', cursor: 'pointer', marginBottom: 4,
                    }}
                  >
                    <span style={{ background: meta.bg, color: meta.color, fontWeight: 700, fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, minWidth: 42, textAlign: 'center' }}>
                      {ep.method}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ep.path}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </aside>

     
        <main style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          {selected && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <span style={{ background: (METHOD_COLORS[selected.method] ?? METHOD_COLORS.GET).bg, color: (METHOD_COLORS[selected.method] ?? METHOD_COLORS.GET).color, fontWeight: 700, fontSize: '0.8rem', padding: '5px 12px', borderRadius: 6 }}>
                  {selected.method}
                </span>
                <code style={{ fontSize: '1rem' }}>{selected.path}</code>
              </div>
              {selected.summary && <p style={{ color: '#64748b', marginBottom: 24 }}>{selected.summary}</p>}

              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>
                Scénario
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      padding: '10px 14px', borderRadius: 8,
                      border: `1px solid ${selectedScenario ? statusFamilyStyle(selectedScenario.statusCode).border : '#e2e8f0'}`,
                      background: selectedScenario ? statusFamilyStyle(selectedScenario.statusCode).bg : 'white',
                      color: selectedScenario ? statusFamilyStyle(selectedScenario.statusCode).color : '#334155',
                      fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedScenario ? statusFamilyStyle(selectedScenario.statusCode).color : '#94a3b8' }} />
                      <span>{selectedScenario ? selectedScenario.statusCode : '—'}</span>
                    </span>
                    <ChevronDown size={14} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                  </button>

                  {dropdownOpen && selected && (
                    <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 20 }}>
                      {selected.scenarios.map((sc) => {
                        const style = statusFamilyStyle(sc.statusCode)
                        return (
                          <button
                            key={sc.id}
                            onClick={() => { setSelectedScenarioId(sc.id); setDropdownOpen(false); setResult(null) }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                              padding: '10px 14px', border: 'none', background: sc.id === selectedScenarioId ? '#f8fafc' : 'white',
                              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: style.color,
                            }}
                          >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: style.color }} />
                            {sc.statusCode}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => selected && selectedScenario && void testScenario(selected, selectedScenario)}
                  disabled={loadingScenario === selectedScenarioId}
                  style={{ background: '#f7941d', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {loadingScenario === selectedScenarioId ? 'Test en cours…' : '▶ Tester'}
                </button>
              </div>

              {result && (
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 700, marginBottom: 16, color: result.status < 400 ? '#15803d' : '#b91c1c' }}>
                    Statut {result.status}
                  </div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Requête envoyée</p>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, marginBottom: 6, fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    {result.requestMethod} {result.requestUrl}
                  </div>
                  {result.requestBody != null && (
                    <pre style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: '0.75rem', overflow: 'auto', maxHeight: 160, marginBottom: 18 }}>
                      {JSON.stringify(result.requestBody, null, 2)}
                    </pre>
                  )}
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Réponse reçue</p>
                  <pre style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: '0.75rem', overflow: 'auto', maxHeight: 320 }}>
                    {result.body || '(pas de contenu)'}
                  </pre>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

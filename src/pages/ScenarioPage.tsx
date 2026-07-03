// src/pages/ScenarioPage.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { getToken } from '../services/api'

type Scenario = {
  id: string
  statusCode: number
  description?: string
  name?: string
  isDefault: boolean
}

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  '2': { color: '#15803d', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)'  },
  '3': { color: '#1d4ed8', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
  '4': { color: '#a16207', bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.25)'  },
  '5': { color: '#b91c1c', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)'  },
}

export default function ScenarioPage() {
  const { endpointId } = useParams<{ endpointId: string }>()
  const navigate = useNavigate()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        const data = await res.json() as Scenario[]
        setScenarios(data)
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


                        {/* Bouton tester — sera branché sur Prism */}
                        {/* <button
                          type="button"
                          className="btn btn-orange"
                          style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                          onClick={() => {
                         
                          }}
                        >
                          Tester
                        </button> */}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
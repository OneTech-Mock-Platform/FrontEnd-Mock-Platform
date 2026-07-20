// import { isCauseDeterminable } from '../lib/mockTest' // désactivé temporairement, cf. commentaire plus bas

export default function RequestPayloadBlock({
  requestExample,
  statusCode,
}: {
  requestExample?: Record<string, unknown> | null
  statusCode?: number
}) {
  if (!requestExample) return null
  return (
    <div style={{ marginBottom: 16 }}>
      <p className="section-kicker" style={{ color: '#1d4ed8', marginBottom: 8, fontSize: '0.7rem' }}>
        Corps de la requête
      </p>
      {/* 
      {typeof statusCode === 'number' && !isCauseDeterminable(statusCode) && (
        <p style={{ fontSize: '0.75rem', color: '#a16207', margin: '0 0 8px' }}>
          ⚠️ Cause non déterminable automatiquement depuis le schéma (auth/droits, ressource ou panne serveur) — exemple générique.
        </p>
      )}
      */}
      <pre
        tabIndex={0}
        role="region"
        aria-label="Corps de la requête, zone défilable"
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
          maxHeight: 300,
          fontFamily: "'Fira Code', monospace",
        }}>
        {JSON.stringify(requestExample, null, 2)}
      </pre>
    </div>
  )
}

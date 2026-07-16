export type TestResult = {
  scenarioId: string
  status?: number
  headers?: Record<string, string>
  body?: string
  timeMs?: number
  error?: string
}

export const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  '2': { color: '#15803d', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)'  },
  '3': { color: '#1d4ed8', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
  '4': { color: '#a16207', bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.25)'  },
  '5': { color: '#b91c1c', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)'  },
}

export const NOISY_HEADERS = new Set([
  'connection',
  'etag',
  'vary',
  'x-powered-by',
  'date',
  'content-length',
  'keep-alive',
  'transfer-encoding',
  'access-control-allow-credentials',
  'access-control-allow-origin',
])

// Codes pour lesquels la cause d'échec est déductible du schéma de la requête (champ manquant, format invalide...).
// Pour les autres (401/403/404/500/503...), la cause est côté auth/droits/ressource/serveur — pas du schéma.
const DETERMINABLE_CAUSE_CODES = new Set([200, 201, 202, 400, 422])

export function isCauseDeterminable(statusCode: number): boolean {
  return DETERMINABLE_CAUSE_CODES.has(statusCode)
}

export function resolvePath(path: string, params: Record<string, string>): string {
  return path
    .split('/')
    .map((seg) =>
      seg.startsWith('{') && seg.endsWith('}')
        ? encodeURIComponent(params[seg.slice(1, -1)] || 'test-id')
        : seg,
    )
    .join('/')
}

export async function runMockTest(params: {
  specId: string
  method: string
  path: string
  pathParams: Record<string, string>
  scenarioId: string
  requestExample?: Record<string, unknown> | null
}): Promise<TestResult> {
  const { specId, method, path, pathParams, scenarioId, requestExample } = params
  const url = `/mock/${specId}${resolvePath(path, pathParams)}`
  const hasBody = requestExample !== undefined && requestExample !== null
  const start = performance.now()
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Prefer: `scenario=${scenarioId}`,
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      },
      body: hasBody ? JSON.stringify(requestExample) : undefined,
    })
    const timeMs = Math.round(performance.now() - start)
    const text = await res.text()
    const responseHeaders: Record<string, string> = {}
    res.headers.forEach((v, k) => {
      responseHeaders[k] = v
    })
    return { scenarioId, status: res.status, headers: responseHeaders, body: text, timeMs }
  } catch {
    return { scenarioId, error: 'Impossible de contacter le mock server (backend démarré ?).' }
  }
}

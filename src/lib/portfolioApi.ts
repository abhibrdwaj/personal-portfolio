export type ChatRole = 'user' | 'assistant'

export type ChatMessagePayload = { role: ChatRole; content: string }

export type ChatResponsePayload = {
  reply: string
  citations: { chunk_id: string; title: string }[]
}

export type JdFitRowPayload = {
  requirement: string
  fit: 'strong' | 'partial' | 'gap' | 'unknown'
  rationale: string
  source_chunk_ids: string[]
}

export type JdFitResponsePayload = {
  summary: string
  match_rows: JdFitRowPayload[]
  disclaimers: string[]
}

const getBaseUrl = (): string => {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (typeof raw !== 'string' || !raw.trim()) {
    return ''
  }
  return raw.replace(/\/$/, '')
}

const buildUrl = (path: string): string => {
  const base = getBaseUrl()
  if (!base) {
    throw new Error('VITE_API_BASE_URL is not set. Add it to .env for local dev.')
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export const postChat = async (
  messages: ChatMessagePayload[],
  sessionId?: string
): Promise<ChatResponsePayload> => {
  const response = await fetch(buildUrl('/v1/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, session_id: sessionId }),
  })
  if (!response.ok) {
    const detail = response.status === 429 ? 'rate_limit_exceeded' : `http_${response.status}`
    throw new Error(`Chat request failed: ${detail}`)
  }
  return response.json() as Promise<ChatResponsePayload>
}

export const postJdFit = async (jdText: string): Promise<JdFitResponsePayload> => {
  const response = await fetch(buildUrl('/v1/jd-fit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jd_text: jdText }),
  })
  if (!response.ok) {
    const detail = response.status === 429 ? 'rate_limit_exceeded' : `http_${response.status}`
    throw new Error(`JD fit request failed: ${detail}`)
  }
  return response.json() as Promise<JdFitResponsePayload>
}

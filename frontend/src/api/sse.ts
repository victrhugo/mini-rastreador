import { API_URL, ApiError, notifyUnauthorized } from './client'

export interface SseMessage {
  event: string
  data: string
}

/**
 * Separa as mensagens completas de um trecho de stream SSE. Mensagens terminam
 * com linha em branco; o que sobrar volta em `rest` para juntar ao próximo trecho.
 * Linhas de comentário (": ping") são ignoradas.
 */
export function parseSse(buffer: string): { messages: SseMessage[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, '\n')
  const blocks = normalized.split('\n\n')
  const rest = blocks.pop() ?? ''

  const messages = blocks.flatMap((block) => {
    let event = 'message'
    const data: string[] = []
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
    }
    return data.length > 0 ? [{ event, data: data.join('\n') }] : []
  })

  return { messages, rest }
}

/**
 * Abre um stream SSE com fetch (o EventSource nativo não envia o header Authorization).
 * Resolve quando o servidor encerra o stream; rejeita em erro de rede ou HTTP.
 */
export async function readEventStream(
  path: string,
  options: { token?: string | null; signal: AbortSignal; onMessage: (message: SseMessage) => void },
) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: 'text/event-stream',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    signal: options.signal,
  })

  if (response.status === 401) {
    notifyUnauthorized()
    throw new ApiError(401, 'Sessão expirada.')
  }
  if (!response.ok || !response.body) {
    throw new ApiError(response.status, 'Não foi possível abrir a conexão em tempo real.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return
    buffer += decoder.decode(value, { stream: true })
    const { messages, rest } = parseSse(buffer)
    buffer = rest
    messages.forEach(options.onMessage)
  }
}

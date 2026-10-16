const API_URL = import.meta.env.VITE_API_URL ?? ''

/** Erro no formato ProblemDetail devolvido pela API. */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

let token: string | null = null
let onUnauthorized: () => void = () => {}

export function setAuthToken(value: string | null) {
  token = value
}

/** Chamado quando uma requisição autenticada recebe 401 (token expirado ou inválido). */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

export function getAuthToken() {
  return token
}

/** Para chamadas feitas fora de api() (ex.: stream de eventos) que recebem 401. */
export function notifyUnauthorized() {
  onUnauthorized()
}

export { API_URL }

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new ApiError(0, 'Não foi possível conectar à API. Verifique se o back-end está rodando.')
  }

  if (response.status === 401 && token) {
    onUnauthorized()
  }

  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    throw new ApiError(
      response.status,
      problem?.detail ?? `Erro ${response.status}`,
      problem?.errors ?? {},
    )
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

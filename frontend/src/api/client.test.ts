import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError } from './client'

afterEach(() => vi.unstubAllGlobals())

describe('api', () => {
  it('explica quando a API está fora do ar (502 sem corpo, ex.: reiniciando)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Bad Gateway', { status: 502 })))

    const error = await api('/api/orders').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).message).toBe('A API está fora do ar ou reiniciando. Tente de novo em alguns segundos.')
  })

  it('usa a mensagem da API quando ela responde com ProblemDetail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'Pedido não encontrado.' }), { status: 404 })),
    )

    await expect(api('/api/orders/9')).rejects.toThrow('Pedido não encontrado.')
  })
})

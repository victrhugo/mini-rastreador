import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useZipCodeLookup } from './useZipCodeLookup'

const PAULISTA = { zipCode: '01310-100', street: 'Avenida Paulista', district: 'Bela Vista', city: 'São Paulo', state: 'SP' }

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('useZipCodeLookup', () => {
  it('não consulta enquanto o CEP estiver incompleto', () => {
    const fetchMock = mockFetch(200, PAULISTA)
    const { result } = renderHook(() => useZipCodeLookup('01310-10', vi.fn()))

    expect(result.current.status).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('consulta com 8 dígitos e entrega o endereço encontrado', async () => {
    const fetchMock = mockFetch(200, PAULISTA)
    const onFound = vi.fn()
    const { result } = renderHook(() => useZipCodeLookup('01310-100', onFound))

    await waitFor(() => expect(result.current.status).toBe('found'))
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/address/cep/01310100')
    expect(onFound).toHaveBeenCalledWith(PAULISTA)
  })

  it('indica CEP inexistente quando a API responde 404', async () => {
    mockFetch(404, { detail: 'CEP não encontrado.' })
    const onFound = vi.fn()
    const { result } = renderHook(() => useZipCodeLookup('99999-999', onFound))

    await waitFor(() => expect(result.current.status).toBe('not-found'))
    expect(onFound).not.toHaveBeenCalled()
  })

  it('indica falha quando os serviços de CEP estão fora do ar', async () => {
    mockFetch(503, { detail: 'Não foi possível consultar o CEP agora.' })
    const { result } = renderHook(() => useZipCodeLookup('01310-100', vi.fn()))

    await waitFor(() => expect(result.current.status).toBe('error'))
  })

  it('volta ao estado inicial quando o CEP é apagado', async () => {
    mockFetch(200, PAULISTA)
    const { result, rerender } = renderHook(({ zip }) => useZipCodeLookup(zip, vi.fn()), {
      initialProps: { zip: '01310-100' },
    })
    await waitFor(() => expect(result.current.status).toBe('found'))

    rerender({ zip: '0131' })
    expect(result.current.status).toBe('idle')
  })
})

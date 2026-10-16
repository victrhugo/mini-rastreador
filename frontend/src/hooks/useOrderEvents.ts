import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getAuthToken } from '../api/client'
import { orderKeys } from '../api/orders'
import { readEventStream } from '../api/sse'
import { setLiveStatus } from '../live'

/** Espera entre reconexões: rápida no começo, até 15s se a API continuar fora. */
const RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 15_000]

/**
 * Mantém a conexão SSE dos operadores aberta enquanto o painel estiver na tela.
 * Cada evento recarrega lista e detalhe; ao reconectar, recarrega também, para
 * não perder mudanças feitas enquanto a conexão estava fora.
 */
export function useOrderEvents() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const controller = new AbortController()
    let attempt = 0

    async function run() {
      while (!controller.signal.aborted) {
        setLiveStatus('connecting')
        try {
          await readEventStream('/api/orders/stream', {
            token: getAuthToken(),
            signal: controller.signal,
            onMessage: (message) => {
              if (message.event === 'ready') {
                attempt = 0
                setLiveStatus('live')
                queryClient.invalidateQueries({ queryKey: orderKeys.all })
              } else if (message.event === 'order') {
                queryClient.invalidateQueries({ queryKey: orderKeys.all })
              }
            },
          })
        } catch {
          if (controller.signal.aborted) return
        }
        setLiveStatus('offline')
        const delay = RETRY_DELAYS_MS[Math.min(attempt++, RETRY_DELAYS_MS.length - 1)]
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    run()
    return () => {
      controller.abort()
      setLiveStatus('connecting')
    }
  }, [queryClient])
}

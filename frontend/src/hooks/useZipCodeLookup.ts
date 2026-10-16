import { useEffect, useRef, useState } from 'react'
import { lookupZipCode } from '../api/address'
import { ApiError } from '../api/client'
import type { AddressLookup } from '../types'

export type ZipCodeLookup =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; address: AddressLookup }
  | { status: 'not-found' }
  | { status: 'error'; message: string }

/**
 * Consulta o endereço assim que o CEP tem 8 dígitos e chama onFound com o resultado.
 * Uma consulta em andamento é cancelada se o CEP mudar.
 */
export function useZipCodeLookup(zipCode: string, onFound: (address: AddressLookup) => void): ZipCodeLookup {
  const digits = zipCode.replace(/\D/g, '')
  const [state, setState] = useState<ZipCodeLookup>({ status: 'idle' })
  const onFoundRef = useRef(onFound)

  useEffect(() => {
    onFoundRef.current = onFound
  })

  useEffect(() => {
    if (digits.length !== 8) {
      setState({ status: 'idle' })
      return
    }

    const controller = new AbortController()
    setState({ status: 'loading' })

    lookupZipCode(digits, controller.signal)
      .then((address) => {
        setState({ status: 'found', address })
        onFoundRef.current(address)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 404) {
          setState({ status: 'not-found' })
        } else {
          setState({ status: 'error', message: error instanceof Error ? error.message : 'Falha ao consultar o CEP.' })
        }
      })

    return () => controller.abort()
  }, [digits])

  return state
}

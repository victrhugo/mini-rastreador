import type { AddressLookup } from '../types'
import { api } from './client'

export function lookupZipCode(digits: string, signal?: AbortSignal) {
  return api<AddressLookup>(`/api/address/cep/${digits}`, { signal })
}

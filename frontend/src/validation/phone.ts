/** DDDs em uso no Brasil (mesma lista validada pela API). */
const VALID_DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48,
  49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
])

/**
 * Descreve o problema de um telefone, ou retorna null se estiver certo (ou vazio).
 * Espelha a validação da API para dar retorno antes do envio.
 */
export function phoneProblem(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (!digits) return null
  if (digits.length !== 10 && digits.length !== 11) return 'Telefone deve ter DDD e 8 ou 9 dígitos'
  if (!VALID_DDDS.has(Number(digits.slice(0, 2)))) return `DDD ${digits.slice(0, 2)} não existe`
  const first = digits[2]
  if (digits.length === 11 && first !== '9') return 'Celular deve começar com 9 depois do DDD'
  if (digits.length === 10 && (first < '2' || first > '5')) {
    return 'Telefone fixo deve começar com 2, 3, 4 ou 5 depois do DDD'
  }
  return null
}

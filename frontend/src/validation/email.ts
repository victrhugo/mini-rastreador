/** Domínios mais usados no Brasil; base para sugerir correção de digitação. */
const COMMON_DOMAINS = [
  'gmail.com',
  'hotmail.com',
  'hotmail.com.br',
  'outlook.com',
  'outlook.com.br',
  'live.com',
  'yahoo.com',
  'yahoo.com.br',
  'icloud.com',
  'uol.com.br',
  'bol.com.br',
  'terra.com.br',
  'globo.com',
  'proton.me',
  'protonmail.com',
]

/** Distância de edição (inserções, remoções e trocas de letra). */
function distance(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0]
    previous[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j]
      previous[j] = Math.min(above + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1))
      diagonal = above
    }
  }
  return previous[b.length]
}

/**
 * Sugere a correção de um domínio digitado errado ("ana@gmial.com" -> "ana@gmail.com").
 * Retorna null quando o domínio parece certo ou não há sugestão confiável.
 */
export function suggestEmail(email: string): string | null {
  const at = email.lastIndexOf('@')
  if (at < 1) return null

  const user = email.slice(0, at)
  const domain = email.slice(at + 1).trim().toLowerCase()
  if (domain.length < 4 || !domain.includes('.') || COMMON_DOMAINS.includes(domain)) return null

  let best: string | null = null
  let bestDistance = Infinity
  for (const candidate of COMMON_DOMAINS) {
    const d = distance(domain, candidate)
    if (d < bestDistance) {
      best = candidate
      bestDistance = d
    }
  }
  if (best && bestDistance <= 2) return `${user}@${best}`

  // Erro comum no final do domínio: ".con", ".cmo", ".comm".
  const fixedTld = domain.replace(/\.(con|cmo|comm|cm|vom)$/, '.com')
  return fixedTld !== domain ? `${user}@${fixedTld}` : null
}

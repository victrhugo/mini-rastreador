import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Os testes rodam a partir da pasta frontend/.
describe('Content-Security-Policy', () => {
  it('libera exatamente o script de tema embutido no index.html', () => {
    const html = readFileSync('index.html', 'utf8')
    const headers = readFileSync('security-headers.conf', 'utf8')
    const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1])

    expect(inline).toHaveLength(1)
    const hash = createHash('sha256').update(inline[0]).digest('base64')
    expect(headers).toContain(`'sha256-${hash}'`)
  })
})

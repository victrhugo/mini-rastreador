import { describe, expect, it } from 'vitest'
import { parseSse } from './sse'

describe('parseSse', () => {
  it('lê eventos completos e guarda o resto para o próximo trecho', () => {
    const { messages, rest } = parseSse('event:ready\ndata:ok\n\nevent:order\ndata:{"id":1}\n\nevent:or')

    expect(messages).toEqual([
      { event: 'ready', data: 'ok' },
      { event: 'order', data: '{"id":1}' },
    ])
    expect(rest).toBe('event:or')
  })

  it('ignora comentários de heartbeat', () => {
    expect(parseSse(':ping\n\n').messages).toEqual([])
  })

  it('aceita quebras de linha \\r\\n e espaço depois de "data:"', () => {
    expect(parseSse('event: order\r\ndata: {"id":2}\r\n\r\n').messages).toEqual([{ event: 'order', data: '{"id":2}' }])
  })

  it('usa "message" quando o evento não tem nome', () => {
    expect(parseSse('data:oi\n\n').messages).toEqual([{ event: 'message', data: 'oi' }])
  })
})

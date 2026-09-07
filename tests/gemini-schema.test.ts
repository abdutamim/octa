import { describe, expect, it } from 'vitest'
import { sanitizeSchema } from '../electron/cloud/gemini-chat'

describe('tool schema sanitising', () => {
  it('drops the keyword that broke every assistant question', () => {
    // A single `exclusiveMinimum` on one parameter of one tool made Gemini
    // reject the whole request with a 400, so nothing the assistant was asked
    // ever got an answer.
    const cleaned = sanitizeSchema({
      type: 'object',
      properties: { gb: { type: 'number', exclusiveMinimum: 0, maximum: 10_000 } }
    }) as Record<string, never>
    expect(JSON.stringify(cleaned)).not.toContain('exclusiveMinimum')
  })

  it('keeps the bound as the nearest supported one instead of widening it', () => {
    const cleaned = sanitizeSchema({ type: 'number', exclusiveMinimum: 5 }) as {
      minimum?: number
    }
    expect(cleaned.minimum).toBe(5)
  })

  it('never invents a bound over an explicit one', () => {
    const cleaned = sanitizeSchema({ type: 'number', minimum: 1, exclusiveMinimum: 99 }) as {
      minimum?: number
    }
    expect(cleaned.minimum).toBe(1)
  })

  it('keeps the fields Gemini does understand', () => {
    const cleaned = sanitizeSchema({
      type: 'object',
      description: 'a tool',
      properties: { period: { type: 'string', enum: ['today', 'week'] } },
      required: ['period']
    }) as Record<string, never>
    expect(cleaned).toEqual({
      type: 'object',
      description: 'a tool',
      properties: { period: { type: 'string', enum: ['today', 'week'] } },
      required: ['period']
    })
  })

  it('does not mistake a property named like a keyword for a keyword', () => {
    // "type" and "enum" are legitimate parameter NAMES; filtering them out would
    // silently drop arguments the tool needs.
    const cleaned = sanitizeSchema({
      type: 'object',
      properties: { type: { type: 'string' }, enum: { type: 'string' } }
    }) as { properties: Record<string, unknown> }
    expect(Object.keys(cleaned.properties)).toEqual(['type', 'enum'])
  })

  it('reaches into nested object and array schemas', () => {
    const cleaned = sanitizeSchema({
      type: 'object',
      properties: {
        items: { type: 'array', items: { type: 'number', exclusiveMaximum: 10 } }
      }
    })
    expect(JSON.stringify(cleaned)).not.toContain('exclusiveMaximum')
    expect(JSON.stringify(cleaned)).toContain('"maximum":10')
  })
})

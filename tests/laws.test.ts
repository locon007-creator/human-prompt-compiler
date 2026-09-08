import { describe, expect, it } from 'vitest'
import { snapshotInput } from '../src/input.js'
import type { SemanticDraft } from '../src/extract.js'
import { applyCoreLaws } from '../src/laws.js'

const baseDraft = (overrides: Partial<SemanticDraft> = {}): SemanticDraft => ({
  product: 'personal timesheet',
  primaryJob: 'record work start and end times',
  workflow: [],
  primaryViews: [],
  navigation: [],
  behaviorUnits: [],
  visualDirection: [],
  boundaries: [],
  buildRequirements: [],
  unresolved: [],
  sourceUnits: [],
  ...overrides,
})

const androidInput = snapshotInput({
  idea: 'Build a personal timesheet.',
  buildType: 'App / Web App',
  creationFormat: 'Android App',
  visualStyle: 'Premium Modern',
})

describe('applyCoreLaws', () => {
  it('selects one expert role without adding features', () => {
    const result = applyCoreLaws(baseDraft(), androidInput)
    expect(result.role).toMatch(/senior Android product designer/i)
    expect(result.role).not.toMatch(/GPS|payroll|analytics|subscription/i)
  })

  it('deduplicates repeated meaning while retaining the more complete sentence', () => {
    const result = applyCoreLaws(baseDraft({
      visualDirection: [
        'Use strong visual hierarchy.',
        'Use strong visual hierarchy with clear spacing and typography.',
      ],
    }), androidInput)

    expect(result.visualDirection.join(' ')).toMatch(/strong visual hierarchy with clear spacing and typography/i)
  })

  it('turns premium style into one concise finished-product visual signal without adding functionality', () => {
    const result = applyCoreLaws(baseDraft({
      product: 'reading tracker',
      primaryJob: 'track books and reading progress',
      visualDirection: [
        'Use a calm mobile interface with strong hierarchy, clean spacing, and thumb-friendly controls.',
      ],
    }), androidInput)

    expect(result.visualDirection).toHaveLength(1)
    expect(result.visualDirection[0]).toMatch(/finished premium product, not a prototype/i)
    expect(result.visualDirection[0]).toMatch(/purposeful composition/i)
    expect(result.visualDirection[0]).toMatch(/strong hierarchy/i)
    expect(result.visualDirection[0]).toMatch(/thumb-friendly controls/i)
    expect(result.criticalBehavior).toEqual([])
  })

  it('preserves optionality language', () => {
    const result = applyCoreLaws(baseDraft({
      behaviorUnits: ['Trailer number is optional.'],
    }), androidInput)

    expect(result.criticalBehavior[0]?.action).toMatch(/optional/i)
  })

  it('keeps boundaries out of behavior', () => {
    const result = applyCoreLaws(baseDraft({
      boundaries: ['Do not add GPS tracking.'],
      behaviorUnits: ['Save completed days locally.'],
    }), androidInput)

    expect(result.boundaries).toContain('Do not add GPS tracking.')
    expect(result.criticalBehavior.map((rule) => rule.action).join(' ')).not.toMatch(/GPS tracking/i)
  })

  it('does not use visualStyle to add functionality', () => {
    const input = snapshotInput({
      idea: 'Build a simple grocery list.',
      buildType: 'App / Web App',
      creationFormat: 'Android App',
      visualStyle: 'Premium Modern Financial Dashboard',
    })
    const result = applyCoreLaws(baseDraft({
      product: 'grocery list',
      primaryJob: 'keep a simple shopping list',
    }), input)

    expect(result.criticalBehavior).toEqual([])
    expect(result.workflow).toEqual([])
    expect(result.boundaries).toEqual([])
  })

  it('keeps separate rules when conditions differ', () => {
    const result = applyCoreLaws(baseDraft({
      behaviorUnits: [
        'If the bill amount is missing, ask for the actual amount and save it for this cycle.',
        'If the income amount is missing, ask for the actual amount and save it for this pay period.',
      ],
    }), androidInput)

    expect(result.criticalBehavior).toHaveLength(2)
  })

  it('preserves unresolved meaningful content instead of dropping it', () => {
    const result = applyCoreLaws(baseDraft({
      unresolved: ['Use a private local archive for completed entries.'],
    }), androidInput)

    expect(result.criticalBehavior.map((rule) => rule.action).join(' ')).toMatch(
      /Use a private local archive for completed entries/i,
    )
  })

  it('preserves source order across behavior and unresolved functional instructions', () => {
    const first = 'Current appointments remain visible in a compact list.'
    const second = 'Pressing Add Appointment opens provider search.'
    const third = 'Completed appointments remain in the local archive.'

    const result = applyCoreLaws(baseDraft({
      behaviorUnits: [second],
      unresolved: [first, third],
      sourceUnits: [first, second, third],
    }), androidInput)

    expect(result.criticalBehavior.map((rule) => rule.action)).toEqual([
      'Current appointments remain visible in a compact list',
      'Pressing Add Appointment opens provider search',
      'Completed appointments remain in the local archive',
    ])
  })
})

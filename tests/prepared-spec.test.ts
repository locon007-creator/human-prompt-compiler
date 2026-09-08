import { describe, expect, it } from 'vitest'
import { createPreparedSpec } from '../src/prepared-spec.js'
import type { LawfulDraft } from '../src/laws.js'

const makeDraft = (overrides: Partial<LawfulDraft> = {}): LawfulDraft => ({
  role: 'You are a senior Android product designer, mobile UI/UX specialist, and full-stack app engineer.',
  product: 'personal timesheet',
  primaryJob: 'record work start and end times',
  targetUser: 'one worker',
  platform: 'Android App',
  workflow: ['Home', 'Punch In', 'Active Shift', 'Punch Out', 'Saved Day'],
  criticalBehavior: [
    {
      trigger: 'When the user taps Punch In',
      action: 'start the active shift timer',
      result: ['save the active shift state locally'],
    },
  ],
  visualDirection: ['Use strong visual hierarchy with clear spacing and typography.'],
  boundaries: ['Do not add teams or GPS tracking.'],
  buildRequirements: ['Build the first version as one self-contained index.html with inline CSS and JavaScript.'],
  ...overrides,
})

describe('createPreparedSpec', () => {
  it('copies strict semantic ownership without reinterpreting fields', () => {
    const draft = makeDraft()
    const spec = createPreparedSpec(draft)

    expect(spec.workflow).toEqual(['Home', 'Punch In', 'Active Shift', 'Punch Out', 'Saved Day'])
    expect(spec.criticalBehavior.map((rule) => rule.action).join(' ')).not.toMatch(/teams|GPS/i)
    expect(spec.buildRequirements.join(' ')).not.toMatch(/visual hierarchy|typography/i)
    expect(spec.boundaries).toEqual(['Do not add teams or GPS tracking.'])
    expect(spec.visualDirection).toEqual(['Use strong visual hierarchy with clear spacing and typography.'])
  })

  it('creates copies instead of sharing mutable arrays with the lawful draft', () => {
    const draft = makeDraft()
    const spec = createPreparedSpec(draft)

    expect(spec.workflow).not.toBe(draft.workflow)
    expect(spec.criticalBehavior).not.toBe(draft.criticalBehavior)
    expect(spec.criticalBehavior[0]).not.toBe(draft.criticalBehavior[0])
    expect(spec.visualDirection).not.toBe(draft.visualDirection)
    expect(spec.boundaries).not.toBe(draft.boundaries)
    expect(spec.buildRequirements).not.toBe(draft.buildRequirements)
  })

  it('deep-freezes the final semantic contract', () => {
    const spec = createPreparedSpec(makeDraft({
      criticalBehavior: [{
        trigger: 'Beginning Thursday after 6 PM',
        condition: ['tomorrow is payday', 'the amount is missing'],
        action: 'ask for the expected amount',
        result: ['save it for the pay period', 'update current calculations'],
      }],
    }))

    expect(Object.isFrozen(spec)).toBe(true)
    expect(Object.isFrozen(spec.workflow)).toBe(true)
    expect(Object.isFrozen(spec.criticalBehavior)).toBe(true)
    expect(Object.isFrozen(spec.criticalBehavior[0])).toBe(true)
    expect(Object.isFrozen(spec.criticalBehavior[0]?.condition)).toBe(true)
    expect(Object.isFrozen(spec.criticalBehavior[0]?.result)).toBe(true)
    expect(Object.isFrozen(spec.visualDirection)).toBe(true)
    expect(Object.isFrozen(spec.boundaries)).toBe(true)
    expect(Object.isFrozen(spec.buildRequirements)).toBe(true)
  })
})

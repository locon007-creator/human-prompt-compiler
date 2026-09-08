import { describe, expect, it } from 'vitest'
import { groupBehaviorUnits } from '../src/relationships.js'
import { freezePreparedSpec, type PreparedSpec } from '../src/prepared-spec.js'

describe('groupBehaviorUnits', () => {
  it('keeps trigger condition action and results in one rule', () => {
    const rules = groupBehaviorUnits([
      'Beginning Thursday after 6 PM, if tomorrow is the saved payday and the amount has not been entered, ask how much the user expects to receive.',
      'Save the amount for that pay period and immediately update current calculations.',
    ])

    expect(rules).toHaveLength(1)
    expect(rules[0]).toMatchObject({
      trigger: 'Beginning Thursday after 6 PM',
      action: expect.stringMatching(/ask how much/i),
      condition: expect.arrayContaining([
        expect.stringMatching(/tomorrow is the saved payday/i),
        expect.stringMatching(/amount has not been entered/i),
      ]),
      result: expect.arrayContaining([
        expect.stringMatching(/save the amount for that pay period/i),
        expect.stringMatching(/update current calculations/i),
      ]),
    })
  })

  it('does not merge independent conditional rules', () => {
    const rules = groupBehaviorUnits([
      'When the user arrives, record the arrival time.',
      'When the user departs, record the departure time.',
    ])

    expect(rules).toHaveLength(2)
  })
})

describe('freezePreparedSpec', () => {
  it('deep-freezes arrays, behavior rules, and nested rule arrays', () => {
    const spec: PreparedSpec = {
      role: 'Role',
      product: 'Product',
      primaryJob: 'Primary job',
      workflow: ['Home', 'Work'],
      criticalBehavior: [{
        trigger: 'When work starts',
        condition: ['the user is ready'],
        action: 'start the timer',
        result: ['save the active shift'],
      }],
      visualDirection: ['Premium modern mobile UI'],
      boundaries: ['No teams'],
      buildRequirements: ['Build one complete app'],
    }

    const frozen = freezePreparedSpec(spec)

    expect(Object.isFrozen(frozen)).toBe(true)
    expect(Object.isFrozen(frozen.workflow)).toBe(true)
    expect(Object.isFrozen(frozen.criticalBehavior)).toBe(true)
    expect(Object.isFrozen(frozen.criticalBehavior[0])).toBe(true)
    expect(Object.isFrozen(frozen.criticalBehavior[0]?.condition)).toBe(true)
    expect(Object.isFrozen(frozen.criticalBehavior[0]?.result)).toBe(true)
  })
})

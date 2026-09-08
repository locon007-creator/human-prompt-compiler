import { describe, expect, it } from 'vitest'
import { compile } from '../src/compiler.js'

const baseInput = {
  idea: [
    'Build a personal timesheet.',
    'The app has one job: record work start and end times.',
    'Main flow: Home → Punch In → Active Shift → Punch Out → Saved Day.',
    'Use premium spacing and typography.',
    'Do not add teams or GPS tracking.',
  ].join(' '),
  buildType: 'App / Web App',
  creationFormat: 'Android App',
  visualStyle: 'Premium Modern',
}

describe('compile', () => {
  it('runs the full pipeline from a fresh current input snapshot', () => {
    const result = compile(baseInput)
    expect(result.prompt).toMatch(/personal timesheet/i)
    expect(result.prompt).toMatch(/Home → Punch In → Active Shift → Punch Out → Saved Day/)
  })

  it('returns both immutable PreparedSpec and final prompt', () => {
    const result = compile(baseInput)
    expect(Object.isFrozen(result.spec)).toBe(true)
    expect(typeof result.prompt).toBe('string')
    expect(result.prompt.length).toBeGreaterThan(0)
  })

  it('does not retain module-level generation state', () => {
    const first = compile(baseInput)
    const second = compile({
      idea: 'Build a simple recipe app. The app has one job: keep weeknight recipes in one place. Use a calm premium visual hierarchy.',
      buildType: 'App / Web App',
      creationFormat: 'Android App',
      visualStyle: 'Premium Modern',
    })

    expect(first.prompt).toMatch(/timesheet/i)
    expect(second.prompt).toMatch(/recipe/i)
    expect(second.prompt).not.toMatch(/Punch In|GPS tracking|timesheet/i)
  })
})

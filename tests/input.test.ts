import { describe, expect, it } from 'vitest'
import { snapshotInput } from '../src/input'

describe('snapshotInput', () => {
  it('requires all four current-generation inputs', () => {
    expect(() => snapshotInput({
      idea: '',
      buildType: 'App / Web App',
      creationFormat: 'Android App',
      visualStyle: 'Premium Modern',
    })).toThrow(/idea/i)
  })

  it('returns an immutable trimmed current-generation snapshot', () => {
    const result = snapshotInput({
      idea: '  Build a personal timesheet.  ',
      buildType: ' App / Web App ',
      creationFormat: ' Android App ',
      visualStyle: ' Premium Modern ',
    })

    expect(result).toEqual({
      idea: 'Build a personal timesheet.',
      buildType: 'App / Web App',
      creationFormat: 'Android App',
      visualStyle: 'Premium Modern',
    })
    expect(Object.isFrozen(result)).toBe(true)
  })
})

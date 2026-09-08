import { describe, expect, it } from 'vitest'
import { snapshotInput } from '../src/input.js'
import { extractSemantics } from '../src/extract.js'

const makeInput = (idea: string) => snapshotInput({
  idea,
  buildType: 'App / Web App',
  creationFormat: 'Android App',
  visualStyle: 'Premium Modern',
})

describe('extractSemantics', () => {
  it('preserves explicit arrow workflow order', () => {
    const draft = extractSemantics(makeInput(
      'Build a personal timesheet. The app has one job: record work time. Main flow: Home → Punch In → Active Shift → Punch Out → Saved Day.'
    ))

    expect(draft.workflow).toEqual(['Home', 'Punch In', 'Active Shift', 'Punch Out', 'Saved Day'])
  })

  it('classifies explicit no/do not/without language as boundaries', () => {
    const draft = extractSemantics(makeInput(
      'Build a personal timesheet. No teams. Do not add GPS. Keep it useful without payroll processing.'
    ))

    expect(draft.boundaries.join(' ')).toMatch(/no teams/i)
    expect(draft.boundaries.join(' ')).toMatch(/do not add gps/i)
    expect(draft.boundaries.join(' ')).toMatch(/without payroll processing/i)
    expect(draft.behaviorUnits.join(' ')).not.toMatch(/gps/i)
  })

  it('does not invent a workflow when none is present', () => {
    const draft = extractSemantics(makeInput(
      'Build a grocery list app for one person. It should save items locally and feel calm and minimal.'
    ))

    expect(draft.workflow).toEqual([])
  })

  it('keeps optional language intact', () => {
    const draft = extractSemantics(makeInput(
      'Build Drop & Hook Assistant. Trailer number is optional. Save the truck number locally.'
    ))

    expect([...draft.behaviorUnits, ...draft.unresolved].join(' ')).toMatch(/trailer number is optional/i)
  })

  it('preserves unknown meaningful clauses in unresolved', () => {
    const draft = extractSemantics(makeInput(
      'Build a personal journal. Use a private local archive for completed entries.'
    ))

    expect(draft.unresolved).toContain('Use a private local archive for completed entries.')
  })

  it('does not classify visual style as functionality', () => {
    const draft = extractSemantics(makeInput(
      'Build a recipe app. Use strong hierarchy, generous spacing, polished typography, and subtle transitions.'
    ))

    expect(draft.visualDirection.join(' ')).toMatch(/strong hierarchy/i)
    expect(draft.visualDirection.join(' ')).toMatch(/subtle transitions/i)
    expect(draft.behaviorUnits.join(' ')).not.toMatch(/typography|transitions/i)
  })
})

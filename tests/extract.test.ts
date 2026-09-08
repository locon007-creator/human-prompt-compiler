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

  it('takes platform experience from buildType instead of creationFormat', () => {
    const input = snapshotInput({
      idea: 'Build a personal finance assistant.',
      buildType: 'Android App',
      creationFormat: 'Single-file HTML',
      visualStyle: 'Premium Modern',
    })

    const draft = extractSemantics(input)
    expect(draft.platform).toBe('Android App')
  })

  it('turns Single-file HTML creationFormat into a hard delivery requirement', () => {
    const input = snapshotInput({
      idea: 'Build a personal finance assistant.',
      buildType: 'Android App',
      creationFormat: 'Single-file HTML',
      visualStyle: 'Premium Modern',
    })

    const draft = extractSemantics(input)
    const requirement = draft.buildRequirements.join(' ')
    expect(requirement).toMatch(/one self-contained index\.html/i)
    expect(requirement).toMatch(/inline css/i)
    expect(requirement).toMatch(/inline javascript/i)
    expect(requirement).toMatch(/do not use react/i)
    expect(requirement).toMatch(/vite/i)
    expect(requirement).toMatch(/npm/i)
    expect(requirement).toMatch(/jsx/i)
    expect(requirement).toMatch(/extra source files/i)
  })

  it('extracts primary persistent views separately from the workflow', () => {
    const draft = extractSemantics(makeInput(
      'Build a personal timesheet. Main flow: Home → Punch In → Active Shift → Punch Out → Saved Day. Primary views: Home, Weekly, Monthly, History, Settings.'
    ))

    expect(draft.workflow).toEqual(['Home', 'Punch In', 'Active Shift', 'Punch Out', 'Saved Day'])
    expect(draft.primaryViews).toEqual(['Home', 'Weekly', 'Monthly', 'History', 'Settings'])
  })

  it('preserves explicit navigation instructions as app structure instead of behavior noise', () => {
    const draft = extractSemantics(makeInput(
      'Build a personal timesheet. Primary views: Home, Weekly, Monthly, History, Settings. Navigation: Use persistent bottom navigation between Home, Weekly, Monthly, and History, with Settings in the top-right menu.'
    ))

    expect(draft.navigation.join(' ')).toMatch(/persistent bottom navigation/i)
    expect(draft.navigation.join(' ')).toMatch(/Settings in the top-right menu/i)
    expect(draft.behaviorUnits.join(' ')).not.toMatch(/bottom navigation/i)
  })

  it('recognizes natural navigation sentences without requiring a Navigation label', () => {
    const draft = extractSemantics(makeInput(
      'Build a reading tracker. Primary views: Library, Discover, Saved, Profile. Use persistent bottom navigation for Library, Discover, and Saved, with Profile available from the top-right menu.'
    ))

    expect(draft.navigation.join(' ')).toMatch(/persistent bottom navigation/i)
    expect(draft.navigation.join(' ')).toMatch(/Profile available from the top-right menu/i)
    expect(draft.behaviorUnits.join(' ')).not.toMatch(/bottom navigation/i)
    expect(draft.visualDirection.join(' ')).not.toMatch(/bottom navigation/i)
  })

  it('forbids simulated phone and operating-system chrome for Single-file HTML', () => {
    const input = snapshotInput({
      idea: 'Build Drop & Hook Assistant.',
      buildType: 'Android App',
      creationFormat: 'Single-file HTML',
      visualStyle: 'Premium Modern',
    })

    const requirement = extractSemantics(input).buildRequirements.join(' ')
    expect(requirement).toMatch(/do not draw or simulate/i)
    expect(requirement).toMatch(/status bar/i)
    expect(requirement).toMatch(/battery/i)
    expect(requirement).toMatch(/wi-?fi/i)
    expect(requirement).toMatch(/notch/i)
    expect(requirement).toMatch(/bezel/i)
    expect(requirement).toMatch(/device frame/i)
  })
})

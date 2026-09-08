import { describe, expect, it } from 'vitest'
import type { InputSnapshot } from '../src/input.js'
import { createPreparedSpec } from '../src/prepared-spec.js'
import { validateCompile } from '../src/validator.js'

const input: Readonly<InputSnapshot> = Object.freeze({
  idea: 'Build a premium personal timesheet. Main flow: Home → Punch In → Active Shift → Punch Out → Saved Day. Beginning Thursday after 6 PM, if tomorrow is payday and the amount is missing, ask for the amount. Optional notes may be added. Do not add GPS tracking.',
  buildType: 'App / Web App',
  creationFormat: 'Android App',
  visualStyle: 'Premium Modern',
})

const makeSpec = () => createPreparedSpec({
  role: 'You are a senior Android product designer, mobile UI/UX specialist, and full-stack app engineer.',
  product: 'personal timesheet',
  primaryJob: 'record work start and end times',
  platform: 'Android App',
  workflow: ['Home', 'Punch In', 'Active Shift', 'Punch Out', 'Saved Day'],
  criticalBehavior: [
    {
      trigger: 'Beginning Thursday after 6 PM',
      condition: ['tomorrow is payday', 'the amount is missing'],
      action: 'ask for the amount',
    },
    { action: 'Optional notes may be added' },
  ],
  visualDirection: ['Use premium Android hierarchy, spacing, typography, and thumb-friendly controls.'],
  boundaries: ['Do not add GPS tracking.'],
  buildRequirements: ['Build the first version as one self-contained index.html with inline CSS and JavaScript.'],
})

const validOutput = `You are a senior Android product designer, mobile UI/UX specialist, and full-stack app engineer.

Build a personal timesheet. Its one job is to record work start and end times.

Keep the main flow: Home → Punch In → Active Shift → Punch Out → Saved Day.

Beginning Thursday after 6 PM, if tomorrow is payday and the amount is missing, ask for the amount.

Optional notes may be added.

Use premium Android hierarchy, spacing, typography, and thumb-friendly controls.

Do not add GPS tracking.

Build the first version as one self-contained index.html with inline CSS and JavaScript.`

describe('validateCompile', () => {
  it('accepts a valid rendered prompt', () => {
    expect(() => validateCompile(input, makeSpec(), validOutput)).not.toThrow()
  })

  it('rejects a missing workflow step', () => {
    expect(() => validateCompile(input, makeSpec(), validOutput.replace(' → Active Shift', ''))).toThrow(/workflow/i)
  })

  it('rejects altered timing', () => {
    expect(() => validateCompile(input, makeSpec(), validOutput.replace('after 6 PM', 'after 8 PM'))).toThrow(/timing|trigger/i)
  })

  it('rejects optional becoming required', () => {
    expect(() => validateCompile(input, makeSpec(), validOutput.replace('Optional notes may be added.', 'Notes are required.'))).toThrow(/optional/i)
  })

  it('rejects boundary inversion', () => {
    expect(() => validateCompile(input, makeSpec(), validOutput.replace('Do not add GPS tracking.', 'Add GPS tracking.'))).toThrow(/boundary|scope/i)
  })

  it('rejects duplicate semantic paragraphs', () => {
    const duplicated = `${validOutput}\n\nOptional notes may be added.`
    expect(() => validateCompile(input, makeSpec(), duplicated)).toThrow(/duplicate/i)
  })

  it('rejects orphan fragments', () => {
    expect(() => validateCompile(input, makeSpec(), `${validOutput}\n\nShow:.`)).toThrow(/fragment/i)
  })

  it('rejects unrelated domain contamination', () => {
    expect(() => validateCompile(input, makeSpec(), `${validOutput}\n\nTrack investment portfolios and stock trades.`)).toThrow(/contamination|unrelated|scope/i)
  })

  it('rejects missing role', () => {
    expect(() => validateCompile(input, makeSpec(), validOutput.replace(/^You are[^\n]+\n\n/, ''))).toThrow(/role/i)
  })

  it('rejects missing premium visual guidance for premium input', () => {
    expect(() => validateCompile(input, makeSpec(), validOutput.replace(/\n\nUse premium Android hierarchy[^\n]+/, ''))).toThrow(/visual|premium/i)
  })

  it('accepts a compressed pressing instruction only when target and effect both survive', () => {
    const spec = createPreparedSpec({
      role: 'You are a senior Android product designer, mobile UI/UX specialist, and full-stack app engineer.',
      product: 'reading tracker',
      primaryJob: 'track books and reading progress',
      platform: 'Android App',
      workflow: [],
      criticalBehavior: [
        { action: 'Library starts with an Add Book button' },
        { action: 'Pressing Add Book turns the page into title and author search' },
      ],
      visualDirection: ['Use premium Android hierarchy, spacing, typography, and thumb-friendly controls.'],
      boundaries: [],
      buildRequirements: [],
    })

    const compressed = `You are a senior Android product designer, mobile UI/UX specialist, and full-stack app engineer.

Build reading tracker. Its one job is to track books and reading progress.

Library starts with an Add Book button that turns the page into title and author search.

Use premium Android hierarchy, spacing, typography, and thumb-friendly controls.`

    expect(() => validateCompile(input, spec, compressed)).not.toThrow()
    expect(() => validateCompile(input, spec, compressed.replace('title and author search', 'a blank page'))).toThrow(/behavior|critical/i)
  })
})

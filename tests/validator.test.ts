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

const compressedSpec = (criticalBehavior: { action: string }[]) => createPreparedSpec({
  role: 'You are a senior Android product designer, mobile UI/UX specialist, and full-stack app engineer.',
  product: 'reading tracker',
  primaryJob: 'track books and reading progress',
  platform: 'Android App',
  workflow: [],
  criticalBehavior,
  visualDirection: ['Use premium Android hierarchy, spacing, typography, and thumb-friendly controls.'],
  boundaries: [],
  buildRequirements: [],
})

const compressedOutput = (behavior: string) => `You are a senior Android product designer, mobile UI/UX specialist, and full-stack app engineer.

Build reading tracker. Its one job is to track books and reading progress.

${behavior}

Use premium Android hierarchy, spacing, typography, and thumb-friendly controls.`

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
    const spec = compressedSpec([
      { action: 'Library starts with an Add Book button' },
      { action: 'Pressing Add Book turns the page into title and author search' },
    ])
    const compressed = compressedOutput(
      'Library starts with an Add Book button that turns the page into title and author search.'
    )

    expect(() => validateCompile(input, spec, compressed)).not.toThrow()
    expect(() => validateCompile(input, spec, compressed.replace('title and author search', 'a blank page'))).toThrow(/behavior|critical/i)
  })

  it('accepts the shorter named-control briefing only when its exact effect survives', () => {
    const spec = compressedSpec([
      { action: 'Library starts with an Add Book button' },
      { action: 'Pressing Add Book turns the page into title and author search' },
    ])
    const compressed = compressedOutput('Library: Add Book turns the page into title and author search.')

    expect(() => validateCompile(input, spec, compressed)).not.toThrow()
    expect(() => validateCompile(input, spec, compressed.replace('title and author search', 'a blank page'))).toThrow(/behavior|critical/i)
  })

  it('accepts compact search-experience control fusion only when the named control and search target survive', () => {
    const spec = compressedSpec([
      { action: 'Visit Setup starts with an Add Visit button' },
      { action: 'Pressing Add Visit turns the page into a provider search experience' },
    ])
    const compressed = compressedOutput('Visit Setup: Add Visit opens provider search.')

    expect(() => validateCompile(input, spec, compressed)).not.toThrow()
    expect(() => validateCompile(input, spec, compressed.replace('provider search', 'calendar'))).toThrow(/behavior|critical/i)
  })

  it('accepts safe immediate control pronoun compression only when the effect survives', () => {
    const spec = compressedSpec([
      { action: 'Include an Edit Book button at top-right' },
      { action: 'Pressing it opens a compact edit sheet' },
    ])
    const compressed = compressedOutput(
      'Include an Edit Book button at top-right that opens a compact edit sheet.'
    )

    expect(() => validateCompile(input, spec, compressed)).not.toThrow()
    expect(() => validateCompile(input, spec, compressed.replace('opens a compact edit sheet', 'stays idle'))).toThrow(/behavior|critical/i)
  })

  it('accepts section-content compression only when the exact contents survive', () => {
    const spec = compressedSpec([
      { action: 'Attach one collapsible Book Details section directly to the active card' },
      { action: 'It contains exactly Title, Author, Progress, and Notes' },
    ])
    const compressed = compressedOutput(
      'Attach one collapsible Book Details section directly to the active card containing exactly Title, Author, Progress, and Notes.'
    )

    expect(() => validateCompile(input, spec, compressed)).not.toThrow()
    expect(() => validateCompile(input, spec, compressed.replace(', Progress, and Notes', ''))).toThrow(/behavior|critical/i)
  })

  it('accepts screen-title compression only when the screen and detail both survive', () => {
    const spec = compressedSpec([
      { action: 'Library shows the current book, progress, and last-read date' },
      { action: 'Show Reading Now near the Library title' },
    ])
    const compressed = compressedOutput(
      'Library shows the current book, progress, and last-read date, with Reading Now near the title.'
    )

    expect(() => validateCompile(input, spec, compressed)).not.toThrow()
    expect(() => validateCompile(input, spec, compressed.replace('Reading Now', 'Different Label'))).toThrow(/behavior|critical/i)
  })

  it('accepts compact spatial screen-title fusion only when placement and label survive', () => {
    const spec = compressedSpec([
      { action: 'Visit Mode shows the current business name at top-left, address underneath, Check In at top-right, and arrival and departure times below' },
      { action: 'Show Active Visit near the Visit Mode title' },
    ])
    const compressed = compressedOutput(
      'Visit Mode: business top-left, address below; Check In top-right; arrival/departure below; Active Visit near title.'
    )

    expect(() => validateCompile(input, spec, compressed)).not.toThrow()
    expect(() => validateCompile(input, spec, compressed.replace('Active Visit', 'Different Label'))).toThrow(/behavior|critical/i)
  })
})
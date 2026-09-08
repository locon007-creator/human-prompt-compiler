import { describe, expect, it } from 'vitest'
import { createPreparedSpec } from '../src/prepared-spec.js'
import { renderPrompt } from '../src/renderer.js'
import type { LawfulDraft } from '../src/laws.js'

const makeDraft = (overrides: Partial<LawfulDraft> = {}): LawfulDraft => ({
  role: 'You are a senior Android product designer, mobile UI/UX specialist, and full-stack app engineer.',
  product: 'personal timesheet',
  primaryJob: 'record work start and end times, daily hours, and a simple weekly total',
  targetUser: 'one worker',
  platform: 'Android App',
  workflow: ['Home', 'Punch In', 'Active Shift', 'Punch Out', 'Saved Day'],
  criticalBehavior: [{
    trigger: 'When a shift is active',
    action: 'show a live elapsed timer',
    result: ['persist the active shift so the timer survives close and reopen'],
  }],
  visualDirection: [
    'Use a premium Android-first interface with strong hierarchy and generous spacing.',
    'Use thumb-friendly controls, clear typography, and polished transitions.',
  ],
  boundaries: ['Do not add teams, GPS tracking, employer dashboards, or payroll processing.'],
  buildRequirements: ['Build the first version as one self-contained index.html with inline CSS and JavaScript.'],
  ...overrides,
})

describe('renderPrompt', () => {
  it('starts with exactly one role sentence', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft()))
    const firstParagraph = output.split(/\n\n/)[0] ?? ''
    expect(firstParagraph).toBe(makeDraft().role)
    expect(output.match(/You are a senior/g)?.length).toBe(1)
  })

  it('states product and one job before workflow details', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft()))
    expect(output.indexOf('personal timesheet')).toBeLessThan(output.indexOf('Home → Punch In'))
    expect(output).toMatch(/one job is to record work start and end times/i)
  })

  it('renders each BehaviorRule as a complete natural paragraph', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft({
      criticalBehavior: [{
        trigger: 'Beginning Thursday after 6 PM',
        condition: ['tomorrow is the saved payday', 'the amount has not been entered'],
        action: 'ask the user how much they expect to receive',
        result: ['save the amount for that pay period', 'immediately update current calculations'],
      }],
    })))

    expect(output).toMatch(/Beginning Thursday after 6 PM, if tomorrow is the saved payday and the amount has not been entered, ask the user how much they expect to receive\./i)
    expect(output).toMatch(/Save the amount for that pay period and immediately update current calculations\./i)
  })

  it('uses decisive language and avoids weak suggestion wording', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft()))
    expect(output).not.toMatch(/\bconsider\b|\bcould\b|\bperhaps\b|you may want to/i)
  })

  it('does not print parser labels', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft()))
    expect(output).not.toMatch(/Critical Behavior:|PreparedSpec|Primary Job:|Visual Direction:/i)
  })

  it('places boundaries before the final build requirement', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft()))
    expect(output.indexOf('Do not add teams')).toBeLessThan(output.indexOf('Build the first version'))
  })

  it('does not mention a phone frame or mockup unless present in the spec', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft()))
    expect(output).not.toMatch(/phone frame|device frame|mockup|bezel/i)
  })

  it('renders explicit primary views separately from the workflow', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft({
      primaryViews: ['Home', 'Weekly', 'Monthly', 'History', 'Settings'],
    })))

    expect(output).toMatch(/primary views: Home, Weekly, Monthly, History, and Settings/i)
    expect(output).toMatch(/persistent navigation between Home, Weekly, Monthly, History, and Settings/i)
  })

  it('uses explicit navigation instructions instead of inventing a navigation pattern', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft({
      primaryViews: ['Home', 'Weekly', 'Monthly', 'History', 'Settings'],
      navigation: ['Use persistent bottom navigation between Home, Weekly, Monthly, and History, with Settings in the top-right menu.'],
    })))

    expect(output).toMatch(/persistent bottom navigation between Home, Weekly, Monthly, and History/i)
    expect(output).toMatch(/Settings in the top-right menu/i)
    expect(output).not.toMatch(/persistent navigation between Home, Weekly, Monthly, History, and Settings/i)
  })

  it('compresses primary views and explicit navigation into one human structure paragraph', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft({
      primaryViews: ['Home', 'Weekly', 'Monthly', 'History', 'Settings'],
      navigation: ['Use persistent bottom navigation for Home, Weekly, Monthly, and History, with Settings available from the top-right menu.'],
    })))

    const paragraphs = output.split(/\n\n/)
    const structureParagraphs = paragraphs.filter((paragraph) =>
      /Home, Weekly, Monthly, History/i.test(paragraph) || /bottom navigation/i.test(paragraph)
    )

    expect(structureParagraphs).toHaveLength(1)
    expect(structureParagraphs[0]).toMatch(/Home, Weekly, Monthly, History, and Settings/i)
    expect(structureParagraphs[0]).toMatch(/bottom navigation/i)
    expect(structureParagraphs[0]).toMatch(/top-right menu/i)
  })

  it('fuses a direct action and its pressing behavior into one stronger human sentence', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft({
      product: 'appointment planner',
      primaryJob: 'book and track personal appointments',
      workflow: [],
      primaryViews: [],
      navigation: [],
      criticalBehavior: [
        { action: 'Appointments starts with an Add Appointment action' },
        { action: 'Pressing Add Appointment opens provider and service search' },
        {
          trigger: 'When reminder time arrives',
          action: 'notify the user about the upcoming appointment',
        },
      ],
    })))

    expect(output).toMatch(/Appointments starts with an Add Appointment action that opens provider and service search\./i)
    expect(output).not.toMatch(/Pressing Add Appointment opens provider and service search\./i)

    const paragraphs = output.split(/\n\n/)
    const reminderParagraph = paragraphs.find((paragraph) => /When reminder time arrives/i.test(paragraph))
    expect(reminderParagraph).toBeTruthy()
    expect(reminderParagraph).not.toMatch(/Appointments starts with/i)
  })

  it('fuses named turn interactions without repeating the control name', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft({
      product: 'reading tracker',
      primaryJob: 'track books and reading progress',
      workflow: [],
      primaryViews: [],
      navigation: [],
      criticalBehavior: [
        { action: 'Library starts with an Add Book button' },
        { action: 'Pressing Add Book turns the page into title and author search' },
      ],
    })))

    expect(output).toMatch(/Library starts with an Add Book button that turns the page into title and author search\./i)
    expect(output).not.toMatch(/Pressing Add Book turns/i)
  })

  it('never guesses an ambiguous pressing pronoun from a substring match', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft({
      product: 'reading tracker',
      primaryJob: 'track books and reading progress',
      workflow: [],
      primaryViews: [],
      navigation: [],
      criticalBehavior: [
        { action: 'Show Current List near the page title' },
        { action: 'Pressing it opens a compact edit panel' },
      ],
    })))

    expect(output).toMatch(/Show Current List near the page title\./i)
    expect(output).toMatch(/Pressing it opens a compact edit panel\./i)
    expect(output).not.toMatch(/page title that opens a compact edit panel/i)
  })

  it('safely fuses an immediate button introduction with Pressing it', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft({
      product: 'appointment planner',
      primaryJob: 'manage personal appointments',
      workflow: [],
      primaryViews: [],
      navigation: [],
      criticalBehavior: [
        { action: 'Include an Edit Appointment button at top-right' },
        { action: 'Pressing it opens a compact edit sheet' },
      ],
    })))

    expect(output).toMatch(/Include an Edit Appointment button at top-right that opens a compact edit sheet\./i)
    expect(output).not.toMatch(/Pressing it opens/i)
  })

  it('fuses an attached section with its exact contents', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft({
      product: 'reading tracker',
      primaryJob: 'track reading progress',
      workflow: [],
      primaryViews: [],
      navigation: [],
      criticalBehavior: [
        { action: 'Attach one collapsible Book Details section directly to the active card' },
        { action: 'It contains exactly Title, Author, Progress, and Notes' },
      ],
    })))

    expect(output).toMatch(/Attach one collapsible Book Details section directly to the active card containing exactly Title, Author, Progress, and Notes\./i)
    expect(output).not.toMatch(/It contains exactly/i)
  })

  it('fuses a screen description with a nearby title detail', () => {
    const output = renderPrompt(createPreparedSpec(makeDraft({
      product: 'reading tracker',
      primaryJob: 'track reading progress',
      workflow: [],
      primaryViews: [],
      navigation: [],
      criticalBehavior: [
        { action: 'Library shows the current book, progress, and last-read date' },
        { action: 'Show Reading Now near the Library title' },
      ],
    })))

    expect(output).toMatch(/Library shows the current book, progress, and last-read date, with Reading Now near the title\./i)
    expect(output).not.toMatch(/Show Reading Now near the Library title\./i)
  })
})

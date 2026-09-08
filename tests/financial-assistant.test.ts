import { describe, expect, it } from 'vitest'
import { compile } from '../src/compiler.js'

const financialAssistantInput = {
  idea: `Build Personal Financial Assistant for one person.
The app has one job: keep the user's real money picture accurate by remembering schedules and asking for actual amounts only when they matter.
Main flow: Welcome → Income Setup → Bills Setup → Setup Complete → Home.
Allow income to be fixed or variable and save the user's payday schedule.
For fixed income, save the normal amount and reuse it for expected calculations.
For variable income, never assume the next paycheck matches the last one.
Beginning the evening before payday after 6 PM, if the next income amount is still missing, ask the user how much they expect to receive.
Save that amount for the current pay period and immediately update the app's calculations.
Allow bills to be fixed or variable and save each bill name and due date.
For fixed bills, reuse the normal saved amount for expected calculations.
A few days before a variable bill is due, if the current-cycle amount is still missing, ask the user for the actual amount.
Save that variable bill amount only for the current cycle and immediately update the remaining-money calculations.
Show Home with actual income received this month, upcoming and paid bills, remaining expected expenses, current money remaining, next payday, and only the unanswered money questions that currently need attention.
Persist saved schedules, entered amounts, payment status, notification preferences, current-cycle answers, and history locally.
Use a premium calm Android-style mobile interface with strong hierarchy, clean spacing, polished typography, thumb-friendly controls, bottom sheets, selectors, date pickers, subtle status states, and one obvious primary action per screen.
Do not add investments, trading, business bookkeeping, payroll, teams, social features, spreadsheets, or accounting-heavy workflows.`,
  buildType: 'Android App',
  creationFormat: 'Single-file HTML',
  visualStyle: 'Premium Modern',
}

describe('Personal Financial Assistant benchmark', () => {
  it('preserves financial timing, persistence, scope, delivery, and human prompt quality', () => {
    const result = compile(financialAssistantInput)

    expect(result.spec.platform).toBe('Android App')
    expect(result.spec.workflow).toEqual([
      'Welcome',
      'Income Setup',
      'Bills Setup',
      'Setup Complete',
      'Home',
    ])

    const behavior = result.spec.criticalBehavior
      .flatMap((rule) => [
        rule.trigger ?? '',
        ...(rule.condition ?? []),
        rule.action,
        ...(rule.result ?? []),
      ])
      .join(' ')

    expect(behavior).toMatch(/evening before payday after 6 PM/i)
    expect(behavior).toMatch(/next income amount is still missing/i)
    expect(behavior).toMatch(/current pay period/i)
    expect(behavior).toMatch(/few days before a variable bill is due/i)
    expect(behavior).toMatch(/current-cycle amount is still missing/i)
    expect(behavior).toMatch(/current cycle/i)

    const delivery = result.spec.buildRequirements.join(' ')
    expect(delivery).toMatch(/one self-contained index\.html only/i)
    expect(delivery).toMatch(/inline css/i)
    expect(delivery).toMatch(/inline javascript/i)
    expect(delivery).toMatch(/No React, Vite, npm, JSX/i)
    expect(delivery).toMatch(/extra source files/i)
    expect(delivery).toMatch(/No simulated device chrome/i)
    expect(delivery).toMatch(/status bar/i)
    expect(delivery).toMatch(/device frame/i)

    expect(result.prompt).toMatch(/^You are a senior Android product designer/i)
    expect(result.prompt).toMatch(/Android/i)
    expect(result.prompt).not.toMatch(/as an Android app/i)
    expect(result.prompt).toMatch(/Welcome → Income Setup → Bills Setup → Setup Complete → Home/)
    expect(result.prompt).toMatch(/evening before payday after 6 PM/i)
    expect(result.prompt).toMatch(/current pay period/i)
    expect(result.prompt).toMatch(/variable bill is due/i)
    expect(result.prompt).toMatch(/current cycle/i)
    expect(result.prompt).toMatch(/one self-contained index\.html/i)
    expect(result.prompt).toMatch(/No React, Vite, npm, JSX/i)
    expect(result.prompt).toMatch(/No simulated device chrome/i)
    expect(result.prompt).toMatch(/device frame/i)
    expect(result.prompt).not.toMatch(/Critical Behavior:|PreparedSpec/i)

    console.log('\n--- FINANCIAL ASSISTANT COMPILED PROMPT ---\n')
    console.log(result.prompt)
    console.log('\n--- END COMPILED PROMPT ---\n')
  })
})

import { describe, expect, it } from 'vitest'
import { compile } from '../src/compiler.js'

const input = {
  idea: `Build Personal Timesheet for one worker.
The app has one job: record work start and end times, daily hours, and a simple weekly total.
Main flow: Home → Punch In → Active Shift → Punch Out → Saved Day.
Show today's date, shift status, a live elapsed timer, today's hours, and one large Punch In or Punch Out action on Home.
The live elapsed timer must survive closing and reopening the app during an active shift.
Show a primary Weekly view for the Sunday–Friday workweek with each day's hours and the total hours for the week.
Persist saved days and the active shift locally.
Use a premium calm Android-style mobile interface with strong hierarchy, clean spacing, polished typography, thumb-friendly controls, and one obvious primary action per screen.
Do not add teams, GPS, scheduling, an employer dashboard, payroll processing, or employee management.`,
  buildType: 'Android App',
  creationFormat: 'Single-file HTML',
  visualStyle: 'Premium Modern',
}

describe('Personal Timesheet benchmark', () => {
  it('preserves workflow, timer persistence, weekly totals, scope, and Arena-safe delivery', () => {
    const result = compile(input)

    expect(result.spec.workflow).toEqual(['Home', 'Punch In', 'Active Shift', 'Punch Out', 'Saved Day'])
    expect(result.prompt).toMatch(/^You are a senior Android product designer/i)
    expect(result.prompt).toMatch(/Home → Punch In → Active Shift → Punch Out → Saved Day/)
    expect(result.prompt).toMatch(/live elapsed timer/i)
    expect(result.prompt).toMatch(/closing and reopening/i)
    expect(result.prompt).toMatch(/Sunday–Friday/i)
    expect(result.prompt).toMatch(/one self-contained index\.html only/i)
    expect(result.prompt).toMatch(/Do not use React, Vite, npm, JSX/i)
    expect(result.prompt).not.toMatch(/fleet|dispatch|recipe|payday|variable bill/i)

    console.log('\n--- TIMESHEET COMPILED PROMPT ---\n')
    console.log(result.prompt)
    console.log('\n--- END TIMESHEET COMPILED PROMPT ---\n')
  })
})

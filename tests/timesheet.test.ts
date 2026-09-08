import { describe, expect, it } from 'vitest'
import { compile } from '../src/compiler.js'

const input = {
  idea: `Build Personal Timesheet for one worker.
The app has one job: track work time from punch-in through weekly and monthly totals while keeping pay estimates easy to understand.
Main flow: Home → Punch In → Active Shift → Punch Out → Saved Day.
Primary views: Home, Weekly, Monthly, History, Settings.
Use persistent bottom navigation for Home, Weekly, Monthly, and History, with Settings available from the top-right menu.
Home shows today's date, shift status, a real live elapsed timer, today's hours, and one large Punch In or Punch Out action.
When the worker punches in, save the exact start time and keep the active shift running even if the app closes or reloads.
When the worker punches out, save the end time, calculate the day's worked hours, and move the completed day into History.
Weekly covers the Sunday–Friday workweek and shows each day's hours, total weekly hours, hourly rate, gross pay, configurable deductions, and estimated net pay.
Monthly uses a calendar view that shows worked days, each day's hours, holidays, and the total hours for the selected month.
History lists saved completed days with date, punch-in time, punch-out time, and total hours, and lets the user open and edit a saved day.
Settings lets the user set hourly rate, configure deduction names and values, manage holidays, choose 12-hour or 24-hour time, and clear local data with confirmation.
If a saved day is edited, immediately recalculate its daily hours plus affected weekly and monthly totals.
Persist the active shift, saved days, hourly rate, deductions, holidays, time format, and history locally.
Use a premium calm Android-style mobile interface with strong hierarchy, clean spacing, polished typography, thumb-friendly controls, clear persistent navigation, and distinct active, completed, and historical states.
Do not add teams, GPS, employee scheduling, employer dashboards, payroll processing, clock-in approval, messaging, or employee management.`,
  buildType: 'Android App',
  creationFormat: 'Single-file HTML',
  visualStyle: 'Premium Modern',
}

describe('Personal Timesheet complexity benchmark', () => {
  it('preserves multi-view structure, navigation, calculations, persistence, editing, scope, and Arena-safe delivery', () => {
    const result = compile(input)

    expect(result.spec.workflow).toEqual(['Home', 'Punch In', 'Active Shift', 'Punch Out', 'Saved Day'])
    expect(result.spec.primaryViews).toEqual(['Home', 'Weekly', 'Monthly', 'History', 'Settings'])
    expect(result.spec.navigation.join(' ')).toMatch(/persistent bottom navigation/i)
    expect(result.spec.navigation.join(' ')).toMatch(/Settings available from the top-right menu/i)

    expect(result.prompt).toMatch(/^You are a senior Android product designer/i)
    expect(result.prompt).toMatch(/Home → Punch In → Active Shift → Punch Out → Saved Day/)
    expect(result.prompt).toMatch(/Home, Weekly, Monthly, History, and Settings/i)
    expect(result.prompt).toMatch(/persistent bottom navigation/i)
    expect(result.prompt).toMatch(/live elapsed timer/i)
    expect(result.prompt).toMatch(/app closes or reloads/i)
    expect(result.prompt).toMatch(/Sunday–Friday/i)
    expect(result.prompt).toMatch(/hourly rate/i)
    expect(result.prompt).toMatch(/gross pay/i)
    expect(result.prompt).toMatch(/configurable deductions/i)
    expect(result.prompt).toMatch(/estimated net pay/i)
    expect(result.prompt).toMatch(/calendar view/i)
    expect(result.prompt).toMatch(/holidays/i)
    expect(result.prompt).toMatch(/open and edit a saved day/i)
    expect(result.prompt).toMatch(/12-hour or 24-hour/i)
    expect(result.prompt).toMatch(/recalculate/i)
    expect(result.prompt).toMatch(/one self-contained index\.html only/i)
    expect(result.prompt).toMatch(/No React, Vite, npm, JSX/i)
    expect(result.prompt).toMatch(/No simulated device chrome/i)
    expect(result.prompt).not.toMatch(/fleet|dispatch|recipe|payday|variable bill/i)

    console.log('\n--- COMPLEX TIMESHEET COMPILED PROMPT ---\n')
    console.log(result.prompt)
    console.log('\n--- END COMPILED PROMPT ---\n')
  })
})

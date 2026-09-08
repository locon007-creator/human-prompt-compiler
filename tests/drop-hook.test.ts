import { describe, expect, it } from 'vitest'
import { compile } from '../src/compiler.js'

const input = {
  idea: `Build Drop & Hook Assistant for one truck driver completing multiple drop-and-hook stops in one workday.
The app has one job: keep equipment, route stops, trailer changes, arrival and departure times, mileage, and daily progress organized with as little friction as possible.
Main flow: Home → Start My Day → Day Setup → Create Route → Start Route → Work Mode → Day Complete → Navigate Home → Ending Mileage → Finish Day.
Day Setup requires truck number and starting mileage, with trailer number optional and previously used trailer numbers available as suggestions.
Create Route uses an Add Stop button; pressing it opens facility and address search, then lets the driver add, edit, remove, and reorder stops.
In Work Mode, show the business name at top-left with the address underneath, Drop & Hook at top-right, and arrival and departure times below.
Attach a collapsible Drop & Hook information section directly to the active stop card. It contains Drop Trailer, Hook Trailer, Seal Number, and Reference Number, with no notes field.
When a trailer is hooked, carry that trailer forward as the next trailer to drop.
When the driver departs, move the stop to Completed and make the next stop active.
Persist the active day and saved trailer suggestions locally.
Use external navigation only.
Use a premium calm Android-style mobile interface with strong hierarchy, clean spacing, polished typography, thumb-friendly controls, and clear active/completed states.
Do not add fleet management, dispatch tools, in-app maps, team features, or a Route in Progress page.`,
  buildType: 'Android App',
  creationFormat: 'Single-file HTML',
  visualStyle: 'Premium Modern',
}

describe('Drop & Hook Assistant benchmark', () => {
  it('preserves day workflow, work-mode relationships, trailer continuity, boundaries, and Arena-safe delivery', () => {
    const result = compile(input)

    expect(result.spec.workflow).toEqual([
      'Home', 'Start My Day', 'Day Setup', 'Create Route', 'Start Route', 'Work Mode',
      'Day Complete', 'Navigate Home', 'Ending Mileage', 'Finish Day',
    ])

    expect(result.prompt).toMatch(/^You are a senior Android product designer/i)
    expect(result.prompt).toMatch(/Home → Start My Day → Day Setup → Create Route → Start Route → Work Mode → Day Complete → Navigate Home → Ending Mileage → Finish Day/)
    expect(result.prompt).toMatch(/business name at top-left/i)
    expect(result.prompt).toMatch(/collapsible Drop & Hook information section/i)
    expect(result.prompt).toMatch(/Drop Trailer/i)
    expect(result.prompt).toMatch(/Hook Trailer/i)
    expect(result.prompt).toMatch(/Seal Number/i)
    expect(result.prompt).toMatch(/Reference Number/i)
    expect(result.prompt).toMatch(/carry that trailer forward/i)
    expect(result.prompt).toMatch(/one self-contained index\.html only/i)
    expect(result.prompt).toMatch(/Do not use React, Vite, npm, JSX/i)
    expect(result.prompt).toMatch(/Do not add fleet management/i)
    expect(result.prompt).toMatch(/in-app maps/i)
    expect(result.prompt).not.toMatch(/payday|variable bill|recipe|payroll processing/i)

    console.log('\n--- DROP & HOOK COMPILED PROMPT ---\n')
    console.log(result.prompt)
    console.log('\n--- END DROP & HOOK COMPILED PROMPT ---\n')
  })
})

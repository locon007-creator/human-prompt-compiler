import { describe, expect, it } from 'vitest'
import { snapshotInput } from '../src/input.js'
import { extractSemantics } from '../src/extract.js'
import { applyCoreLaws } from '../src/laws.js'
import { createPreparedSpec } from '../src/prepared-spec.js'
import { renderPrompt } from '../src/renderer.js'
import { validateCompile } from '../src/validator.js'

const input = {
  idea: `Build Drop & Hook Assistant for one truck driver completing multiple drop-and-hook stops in one workday.
The app has one job: keep equipment, route stops, trailer changes, arrival and departure times, mileage, and daily progress organized with as little friction as possible.
Main flow: Home → Start My Day → Day Setup → Create Route → Start Route → Work Mode → Day Complete → Navigate Home → Ending Mileage → Finish Day.
Primary views: Home, Create Route, Work Mode, Saved Stops, Saved Routes.
Use Home as the hub with a top-right menu for Saved Routes, Saved Stops, Home Base, and Truck Profiles. Do not use persistent bottom navigation because the workday flow is linear.
Day Setup requires truck number and starting mileage. Trailer number is optional. Save previously used trailer numbers and show them as suggestions whenever a trailer number is entered.
Create Route starts with an Add Stop button. Pressing Add Stop turns the page into a US-only facility and address search experience. After selecting a result, let the driver save the stop, then add, edit, remove, and reorder route stops. Include access to Saved Stops from Create Route.
Start Route opens Work Mode directly. Do not create a separate Route in Progress page.
Work Mode shows the current business name at top-left, address underneath, Drop & Hook at top-right, and arrival and departure times below. Show Active Stop or Active Route near the Work Mode title.
Include a Route & Equipment button at top-right. Pressing it opens a half-height bottom sheet containing a route timeline for editing stops and an Equipment section for editing the truck and trailer information without leaving the active day.
Attach one collapsible Drop & Hook information section directly to the active stop card. It contains exactly Drop Trailer, Hook Trailer, Seal Number, and Reference Number. Do not add a notes field.
When the driver arrives, record the arrival time and enable the Drop & Hook fields. When a trailer is hooked, save it and carry it forward as the next trailer to drop. When the driver departs, record the departure time, move that stop to Completed, and make the next route stop active.
Completed stops remain available in a collapsible completed section with arrival, departure, and saved Drop & Hook information.
Use external navigation only for driving directions. Do not render an in-app map.
Day Complete optionally offers Navigate Home when a Home Base is saved, then asks for Ending Mileage before Finish Day. Finishing the day saves the completed daily log and clears the active-day state while preserving saved routes, saved stops, trailer suggestions, Home Base, and Truck Profiles.
Persist the active day so closing or reloading never loses current route order, active stop, arrival/departure state, equipment, mileage, or Drop & Hook data.
Use comma separators for mileage values and keep all touch controls large and thumb-friendly.
Use a premium calm Android-style mobile interface with strong hierarchy, clean spacing, polished typography, bottom sheets, collapsible sections, clear active/completed states, and one obvious primary action at each step.
Do not add fleet management, dispatch tools, teams, driver management, in-app maps, social features, messaging, or a Route in Progress page.`,
  buildType: 'Android App',
  creationFormat: 'Single-file HTML',
  visualStyle: 'Premium Modern',
}

describe('Drop & Hook Assistant complexity benchmark', () => {
  it('preserves linear workflow, app structure, route editing, trailer continuity, persistence, boundaries, and Arena-safe delivery', () => {
    const snapshot = snapshotInput(input)
    const semanticDraft = extractSemantics(snapshot)
    const lawfulDraft = applyCoreLaws(semanticDraft, snapshot)
    const spec = createPreparedSpec(lawfulDraft)
    const prompt = renderPrompt(spec)

    try {
      validateCompile(snapshot, spec, prompt)
    } catch (error) {
      console.log('\n--- DROP & HOOK CRITICAL BEHAVIOR TRACE ---')
      console.log(JSON.stringify(spec.criticalBehavior, null, 2))
      console.log('\n--- DROP & HOOK RENDERED PROMPT BEFORE VALIDATION ---\n')
      console.log(prompt)
      console.log('\n--- END TRACE ---\n')
      throw error
    }

    expect(spec.workflow).toEqual([
      'Home', 'Start My Day', 'Day Setup', 'Create Route', 'Start Route', 'Work Mode',
      'Day Complete', 'Navigate Home', 'Ending Mileage', 'Finish Day',
    ])
    expect(spec.primaryViews).toEqual(['Home', 'Create Route', 'Work Mode', 'Saved Stops', 'Saved Routes'])

    expect(prompt).toMatch(/^You are a senior Android product designer/i)
    expect(prompt).toMatch(/Do not use persistent bottom navigation/i)
    expect(prompt).toMatch(/Saved Routes/i)
    expect(prompt).toMatch(/Saved Stops/i)
    expect(prompt).toMatch(/Home Base/i)
    expect(prompt).toMatch(/Truck Profiles/i)
    expect(prompt).toMatch(/US-only facility and address search/i)
    expect(prompt).toMatch(/add, edit, remove, and reorder route stops/i)
    expect(prompt).toMatch(/Route & Equipment/i)
    expect(prompt).toMatch(/half-height bottom sheet/i)
    expect(prompt).toMatch(/collapsible Drop & Hook information section/i)
    expect(prompt).toMatch(/Drop Trailer/i)
    expect(prompt).toMatch(/Hook Trailer/i)
    expect(prompt).toMatch(/Seal Number/i)
    expect(prompt).toMatch(/Reference Number/i)
    expect(prompt).toMatch(/carry it forward as the next trailer to drop/i)
    expect(prompt).toMatch(/closing or reloading never loses/i)
    expect(prompt).toMatch(/Ending Mileage/i)
    expect(prompt).toMatch(/comma separators for mileage/i)
    expect(prompt).toMatch(/one self-contained index\.html only/i)
    expect(prompt).toMatch(/Do not use React, Vite, npm, JSX/i)
    expect(prompt).toMatch(/Do not draw or simulate a phone/i)
    expect(prompt).toMatch(/Do not add fleet management/i)
    expect(prompt).toMatch(/in-app maps/i)
    expect(prompt).not.toMatch(/payday|variable bill|recipe|payroll processing/i)
  })
})

import { describe, expect, it } from 'vitest'
import { compactBoundary, compactInstruction, compactTrigger, compactVisual } from '../src/briefing.js'

describe('briefing compression', () => {
  it('compresses screen controls without losing the screen, control, or effect', () => {
    expect(compactInstruction(
      'Appointment Setup starts with an Add Appointment button that opens provider and service search'
    )).toBe('Appointment Setup: Add Appointment opens provider and service search')

    expect(compactInstruction(
      'Include an Edit Appointment button at top-right that opens a compact edit sheet'
    )).toBe('Edit Appointment (top-right) opens a compact edit sheet')
  })

  it('compresses selection and section instructions into natural briefing language', () => {
    expect(compactInstruction(
      'After selecting a result, let the user save the appointment, then add, edit, remove, and reorder appointments'
    )).toBe('After selection, save the appointment; add/edit/remove/reorder appointments')

    expect(compactInstruction(
      'Attach one collapsible Appointment Details section directly to the active card containing exactly Provider, Time, and Reference'
    )).toBe('Attach collapsible Appointment Details to the active card: Provider, Time, and Reference')
  })

  it('compresses state and persistence wording without dropping the state list', () => {
    expect(compactInstruction(
      'Finishing the day saves the completed daily log and clears the active-day state while preserving saved routes, saved stops, and profiles'
    )).toBe('Finish Day saves the log, clears active-day state, and preserves saved routes, saved stops, and profiles')

    expect(compactInstruction(
      'Persist the active day so closing or reloading never loses current route order, active stop, equipment, or mileage'
    )).toBe('Persist current route order, active stop, equipment, or mileage across closing/reloading')
  })

  it('compresses common triggers and actions without changing timing meaning', () => {
    expect(compactTrigger('When the driver arrives')).toBe('On driver arrival')
    expect(compactTrigger('When the driver departs')).toBe('On driver departure')
    expect(compactInstruction('record the arrival time and enable the required fields')).toBe('record time and enable the required fields')
  })

  it('compresses setup fields, suggestions, and CRUD into one-line human instructions', () => {
    expect(compactInstruction('Visit Setup requires provider and appointment date')).toBe('Visit Setup: provider + appointment date required')
    expect(compactInstruction('Reference number is optional')).toBe('Reference number optional')
    expect(compactInstruction(
      'Save previously used provider names and show them as suggestions whenever a provider name is entered'
    )).toBe('Suggest saved provider names when entering a provider name')
    expect(compactInstruction(
      'let the user save the appointment, then add, edit, remove, and reorder appointments'
    )).toBe('save appointment; add/edit/remove/reorder appointments')
  })

  it('compresses spatial screen and state language without dropping placement or behavior', () => {
    expect(compactInstruction(
      'Visit Mode shows the current business name at top-left, address underneath, Check In at top-right, and arrival and departure times below, with Active Visit near the title'
    )).toBe('Visit Mode: business top-left, address below; Check In top-right; arrival/departure below; Active Visit near title')

    expect(compactInstruction(
      'record the departure time, move that visit to Completed, and make the next route visit active'
    )).toBe('record time; complete visit; activate next route visit')

    expect(compactInstruction(
      'Completed visits remain available in a collapsible completed section with arrival, departure, and saved visit information'
    )).toBe('Completed visits stay collapsible with arrival/departure + saved visit information')
  })

  it('compresses navigation and end-state prose into decisive shorthand', () => {
    expect(compactInstruction('Use external navigation only for driving directions')).toBe('Driving directions: external navigation only')
    expect(compactInstruction(
      'Day Complete optionally offers Navigate Home when a Home Base is saved, then asks for Ending Mileage before Finish Day'
    )).toBe('Day Complete: offer Navigate Home if Home Base saved; Ending Mileage before Finish Day')
    expect(compactInstruction('save it and carry it forward as the next trailer to drop')).toBe('save it; use it as the next trailer to drop')
  })

  it('compresses exclusions without weakening them', () => {
    expect(compactBoundary('Do not use persistent bottom navigation because the workday flow is linear'))
      .toBe('Linear workday: no persistent bottom navigation')
    expect(compactBoundary('Do not create a separate Route in Progress page')).toBe('No separate Route in Progress page')
    expect(compactBoundary('Do not add a notes field')).toBe('No notes field')
    expect(compactBoundary('Do not render an in-app map')).toBe('No in-app map')
  })

  it('compresses premium visual language into one finished-product direction', () => {
    const result = compactVisual(
      'Use a premium calm Android-style mobile interface with strong hierarchy, clean spacing, polished typography, thumb-friendly controls; make the first screen feel like a finished premium product, not a prototype, through purposeful composition, refined surfaces, restrained depth, and polished visual details'
    )

    expect(result).toMatch(/^Premium calm Android-style UI:/i)
    expect(result).toMatch(/strong hierarchy/i)
    expect(result).toMatch(/finished premium product, not a prototype/i)
    expect(result).toMatch(/purposeful composition/i)
    expect(result.split(/\s+/).length).toBeLessThanOrEqual(38)
  })

  it('compresses a functional visual prefix together with premium direction', () => {
    const result = compactVisual(
      'Use comma separators for mileage values and keep all touch controls large and thumb-friendly; Use a premium calm Android-style mobile interface with strong hierarchy, clean spacing, polished typography, bottom sheets, collapsible sections, clear active/completed states, and one obvious primary action at each step; make the first screen feel like a finished premium product, not a prototype, through purposeful composition, refined surfaces, restrained depth, and polished visual details'
    )

    expect(result).toMatch(/^Comma-separated mileage; large thumb-friendly controls\./i)
    expect(result).toMatch(/Premium calm Android-style UI/i)
    expect(result.split(/\s+/).length).toBeLessThanOrEqual(44)
  })
})
import { describe, expect, it } from 'vitest'
import { compactInstruction, compactTrigger, compactVisual } from '../src/briefing.js'

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
})

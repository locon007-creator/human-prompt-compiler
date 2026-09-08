import type { InputSnapshot } from './input.js'
import type { SemanticDraft } from './extract.js'
import { groupBehaviorUnits, type BehaviorRule } from './relationships.js'

export type LawfulDraft = {
  role: string
  product: string
  primaryJob: string
  targetUser?: string
  platform?: string
  workflow: string[]
  criticalBehavior: BehaviorRule[]
  visualDirection: string[]
  boundaries: string[]
  buildRequirements: string[]
}

const roleFor = (input: Readonly<InputSnapshot>): string => {
  const key = `${input.buildType} ${input.creationFormat}`.toLowerCase()
  if (key.includes('android')) {
    return 'You are a senior Android product designer, mobile UI/UX specialist, and full-stack app engineer.'
  }
  if (key.includes('ios')) {
    return 'You are a senior iOS product designer, mobile UI/UX specialist, and full-stack app engineer.'
  }
  if (key.includes('web') || key.includes('website')) {
    return 'You are a senior web product designer, UX specialist, and full-stack web engineer.'
  }
  return 'You are a senior product designer, UX specialist, and full-stack application engineer.'
}

const normalizeForComparison = (value: string): string => value
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const deduplicate = (items: string[]): string[] => {
  const kept: string[] = []

  for (const item of items.map((value) => value.trim()).filter(Boolean)) {
    const normalized = normalizeForComparison(item)
    let handled = false

    for (let index = 0; index < kept.length; index += 1) {
      const existing = kept[index]
      if (!existing) continue
      const existingNormalized = normalizeForComparison(existing)

      if (existingNormalized === normalized) {
        handled = true
        break
      }

      if (normalized.includes(existingNormalized) || existingNormalized.includes(normalized)) {
        if (normalized.length > existingNormalized.length) kept[index] = item
        handled = true
        break
      }
    }

    if (!handled) kept.push(item)
  }

  return kept
}

export const applyCoreLaws = (
  draft: SemanticDraft,
  input: Readonly<InputSnapshot>,
): LawfulDraft => {
  const behaviorUnits = deduplicate([...draft.behaviorUnits, ...draft.unresolved])

  const result: LawfulDraft = {
    role: roleFor(input),
    product: draft.product,
    primaryJob: draft.primaryJob,
    workflow: [...draft.workflow],
    criticalBehavior: groupBehaviorUnits(behaviorUnits),
    visualDirection: deduplicate(draft.visualDirection),
    boundaries: deduplicate(draft.boundaries),
    buildRequirements: deduplicate(draft.buildRequirements),
  }

  if (draft.targetUser) result.targetUser = draft.targetUser
  if (draft.platform) result.platform = draft.platform
  return result
}

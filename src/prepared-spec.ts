import type { LawfulDraft } from './laws.js'
import type { BehaviorRule } from './relationships.js'

export type PreparedSpec = {
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

const cloneRule = (rule: BehaviorRule): BehaviorRule => {
  const cloned: BehaviorRule = {
    action: rule.action,
  }

  if (rule.trigger) cloned.trigger = rule.trigger
  if (rule.condition) cloned.condition = [...rule.condition]
  if (rule.result) cloned.result = [...rule.result]
  return cloned
}

const freezeRule = (rule: BehaviorRule): Readonly<BehaviorRule> => {
  if (rule.condition) Object.freeze(rule.condition)
  if (rule.result) Object.freeze(rule.result)
  return Object.freeze(rule)
}

export const freezePreparedSpec = (spec: PreparedSpec): Readonly<PreparedSpec> => {
  spec.criticalBehavior.forEach(freezeRule)
  Object.freeze(spec.workflow)
  Object.freeze(spec.criticalBehavior)
  Object.freeze(spec.visualDirection)
  Object.freeze(spec.boundaries)
  Object.freeze(spec.buildRequirements)
  return Object.freeze(spec)
}

export const createPreparedSpec = (draft: LawfulDraft): Readonly<PreparedSpec> => {
  const spec: PreparedSpec = {
    role: draft.role,
    product: draft.product,
    primaryJob: draft.primaryJob,
    workflow: [...draft.workflow],
    criticalBehavior: draft.criticalBehavior.map(cloneRule),
    visualDirection: [...draft.visualDirection],
    boundaries: [...draft.boundaries],
    buildRequirements: [...draft.buildRequirements],
  }

  if (draft.targetUser) spec.targetUser = draft.targetUser
  if (draft.platform) spec.platform = draft.platform

  return freezePreparedSpec(spec)
}

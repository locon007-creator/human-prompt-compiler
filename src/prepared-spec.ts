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

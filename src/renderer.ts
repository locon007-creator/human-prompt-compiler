import type { PreparedSpec } from './prepared-spec.js'
import type { BehaviorRule } from './relationships.js'

const sentence = (value: string): string => {
  const clean = value.trim().replace(/[.!?]+$/, '')
  if (!clean) return ''
  return `${clean.charAt(0).toUpperCase()}${clean.slice(1)}.`
}

const joinNatural = (items: string[]): string => {
  const clean = items.map((item) => item.trim().replace(/[.!?]+$/, '')).filter(Boolean)
  if (clean.length <= 1) return clean[0] ?? ''
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`
  return `${clean.slice(0, -1).join(', ')}, and ${clean.at(-1)}`
}

const renderRule = (rule: Readonly<BehaviorRule>): string => {
  const parts: string[] = []
  if (rule.trigger) parts.push(rule.trigger.trim().replace(/[.!?]+$/, ''))
  if (rule.condition?.length) parts.push(`if ${joinNatural(rule.condition)}`)

  const lead = parts.length ? `${parts.join(', ')}, ` : ''
  const action = rule.action.trim().replace(/[.!?]+$/, '')
  const first = sentence(`${lead}${action}`)

  if (!rule.result?.length) return first
  const result = sentence(joinNatural(rule.result))
  return `${first} ${result}`
}

const renderMission = (spec: Readonly<PreparedSpec>): string => {
  const audience = spec.targetUser ? ` for ${spec.targetUser}` : ''
  const platform = spec.platform ? ` as a ${spec.platform}` : ''
  return sentence(`Build ${spec.product}${audience}${platform}. Its one job is to ${spec.primaryJob}`)
}

export const renderPrompt = (spec: Readonly<PreparedSpec>): string => {
  const paragraphs: string[] = [spec.role.trim(), renderMission(spec)]

  if (spec.workflow.length) {
    paragraphs.push(sentence(`Keep the main flow: ${spec.workflow.join(' → ')}`))
  }

  for (const rule of spec.criticalBehavior) {
    const rendered = renderRule(rule)
    if (rendered) paragraphs.push(rendered)
  }

  if (spec.visualDirection.length) {
    paragraphs.push(spec.visualDirection.map(sentence).join(' '))
  }

  if (spec.boundaries.length) {
    paragraphs.push(spec.boundaries.map(sentence).join(' '))
  }

  if (spec.buildRequirements.length) {
    paragraphs.push(spec.buildRequirements.map(sentence).join(' '))
  }

  return paragraphs.filter(Boolean).join('\n\n')
}

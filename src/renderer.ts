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

const renderPlatform = (platform: string): string => {
  const normalized = platform.trim()
  if (/^android\s+app$/i.test(normalized)) return 'an Android app'
  if (/^ios\s+app$/i.test(normalized)) return 'an iOS app'
  if (/^web\s+app$/i.test(normalized)) return 'a web app'
  const article = /^[aeiou]/i.test(normalized) ? 'an' : 'a'
  return `${article} ${normalized}`
}

const hasStandaloneHtmlDelivery = (spec: Readonly<PreparedSpec>): boolean =>
  spec.buildRequirements.some((requirement) =>
    /(?:self-contained\s+index\.html|single[-\s]?file\s+html|standalone\s+html)/i.test(requirement)
  )

const renderExperience = (spec: Readonly<PreparedSpec>): string => {
  if (!spec.platform) return ''

  if (hasStandaloneHtmlDelivery(spec)) {
    if (/^android\s+app$/i.test(spec.platform)) return ' with an Android-style mobile experience'
    if (/^ios\s+app$/i.test(spec.platform)) return ' with an iOS-style mobile experience'
  }

  return ` as ${renderPlatform(spec.platform)}`
}

const renderMission = (spec: Readonly<PreparedSpec>): string => {
  const audience = spec.targetUser ? ` for ${spec.targetUser}` : ''
  const experience = renderExperience(spec)
  return sentence(`Build ${spec.product}${audience}${experience}. Its one job is to ${spec.primaryJob}`)
}

const renderStructure = (spec: Readonly<PreparedSpec>): string[] => {
  if (spec.primaryViews.length && spec.navigation.length) {
    return [
      `${sentence(`Use these primary views: ${joinNatural(spec.primaryViews)}`)} ${spec.navigation.map(sentence).join(' ')}`,
    ]
  }

  const paragraphs: string[] = []

  if (spec.primaryViews.length) {
    paragraphs.push(sentence(`Use these primary views: ${joinNatural(spec.primaryViews)}`))
  }

  if (spec.navigation.length) {
    paragraphs.push(spec.navigation.map(sentence).join(' '))
  } else if (spec.primaryViews.length > 1) {
    paragraphs.push(sentence(`Provide clear persistent navigation between ${joinNatural(spec.primaryViews)}`))
  }

  return paragraphs
}

export const renderPrompt = (spec: Readonly<PreparedSpec>): string => {
  const paragraphs: string[] = [spec.role.trim(), renderMission(spec)]

  if (spec.workflow.length) {
    paragraphs.push(sentence(`Keep the main flow: ${spec.workflow.join(' → ')}`))
  }

  paragraphs.push(...renderStructure(spec))

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

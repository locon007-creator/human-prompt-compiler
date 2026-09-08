import type { PreparedSpec } from './prepared-spec.js'
import type { BehaviorRule } from './relationships.js'
import { compactBoundary, compactInstruction, compactTrigger, compactVisual } from './briefing.js'

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
  if (rule.trigger) parts.push(compactTrigger(rule.trigger))
  if (rule.condition?.length) parts.push(`if ${joinNatural(rule.condition)}`)

  const lead = parts.length ? `${parts.join(', ')}, ` : ''
  const action = compactInstruction(rule.action)
  const first = sentence(`${lead}${action}`)

  if (!rule.result?.length) return first
  const result = sentence(joinNatural(rule.result.map(compactInstruction)))
  return `${first} ${result}`
}

const canFuseDirectAction = (rule: Readonly<BehaviorRule>): boolean =>
  !rule.trigger && !rule.condition?.length && !rule.result?.length

const normalizePhrase = (value: string): string => value
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const containsPhrase = (value: string, phrase: string): boolean => {
  const haystack = ` ${normalizePhrase(value)} `
  const needle = ` ${normalizePhrase(phrase)} `
  return needle.trim().length > 0 && haystack.includes(needle)
}

const directActions = (
  first: Readonly<BehaviorRule>,
  second: Readonly<BehaviorRule>,
): [string, string] | null => {
  if (!canFuseDirectAction(first) || !canFuseDirectAction(second)) return null
  return [
    first.action.trim().replace(/[.!?]+$/, ''),
    second.action.trim().replace(/[.!?]+$/, ''),
  ]
}

const fuseImmediateControlPronounPair = (
  first: Readonly<BehaviorRule>,
  second: Readonly<BehaviorRule>,
): string | null => {
  const actions = directActions(first, second)
  if (!actions) return null
  const [current, next] = actions

  if (!/^(?:include|add|place|use)\b.*\b(?:button|action|control|selector|field)\b/i.test(current)) {
    return null
  }

  const match = next.match(/^Pressing\s+it\s+(opens?|shows?|starts?|saves?|adds?|creates?|reveals?|launches?|displays?|enables?|turns?)\s+(.+)$/i)
  if (!match?.[1] || !match[2]) return null

  return sentence(compactInstruction(`${current} that ${match[1].toLowerCase()} ${match[2]}`))
}

const fuseSectionContentsPair = (
  first: Readonly<BehaviorRule>,
  second: Readonly<BehaviorRule>,
): string | null => {
  const actions = directActions(first, second)
  if (!actions) return null
  const [current, next] = actions

  if (!/^(?:attach|include|add|show)\b.*\bsection\b/i.test(current)) return null
  const match = next.match(/^It\s+contains\s+exactly\s+(.+)$/i)
  if (!match?.[1]) return null

  return sentence(compactInstruction(`${current} containing exactly ${match[1]}`))
}

const fuseScreenTitleDetailPair = (
  first: Readonly<BehaviorRule>,
  second: Readonly<BehaviorRule>,
): string | null => {
  const actions = directActions(first, second)
  if (!actions) return null
  const [current, next] = actions

  const screen = current.match(/^(.+?)\s+shows\s+(.+)$/i)
  const detail = next.match(/^Show\s+(.+?)\s+near\s+the\s+(.+?)\s+title$/i)
  if (!screen?.[1] || !detail?.[1] || !detail[2]) return null
  if (normalizePhrase(screen[1]) !== normalizePhrase(detail[2])) return null

  return sentence(compactInstruction(`${current}, with ${detail[1]} near the title`))
}

const fusePressingPair = (
  first: Readonly<BehaviorRule>,
  second: Readonly<BehaviorRule>,
): string | null => {
  const actions = directActions(first, second)
  if (!actions) return null
  const [current, next] = actions

  const match = next.match(/^Pressing\s+(.+?)\s+(opens?|shows?|starts?|saves?|adds?|creates?|reveals?|launches?|displays?|enables?|turns?)\s+(.+)$/i)
  if (!match?.[1] || !match[2] || !match[3]) return null

  const target = match[1].trim()
  if (/^(?:it|this|that|this one|that one)$/i.test(target)) return null
  if (!containsPhrase(current, target)) return null

  return sentence(compactInstruction(`${current} that ${match[2].toLowerCase()} ${match[3]}`))
}

const fuseBehaviorPair = (
  first: Readonly<BehaviorRule>,
  second: Readonly<BehaviorRule>,
): string | null =>
  fuseImmediateControlPronounPair(first, second) ??
  fuseSectionContentsPair(first, second) ??
  fuseScreenTitleDetailPair(first, second) ??
  fusePressingPair(first, second)

const renderBehavior = (rules: readonly Readonly<BehaviorRule>[]): string[] => {
  const paragraphs: string[] = []

  for (let index = 0; index < rules.length; index += 1) {
    const current = rules[index]
    if (!current) continue

    const next = rules[index + 1]
    if (next) {
      const fused = fuseBehaviorPair(current, next)
      if (fused) {
        paragraphs.push(fused)
        index += 1
        continue
      }
    }

    const rendered = renderRule(current)
    if (rendered) paragraphs.push(rendered)
  }

  return paragraphs
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
  return sentence(`Build ${spec.product}${audience}${experience}. One job: ${spec.primaryJob}`)
}

const renderStructure = (spec: Readonly<PreparedSpec>): string[] => {
  if (spec.primaryViews.length && spec.navigation.length) {
    return [
      `${sentence(`Primary views: ${joinNatural(spec.primaryViews)}`)} ${spec.navigation.map(sentence).join(' ')}`,
    ]
  }

  const paragraphs: string[] = []

  if (spec.primaryViews.length) {
    paragraphs.push(sentence(`Primary views: ${joinNatural(spec.primaryViews)}`))
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
    paragraphs.push(sentence(`Flow: ${spec.workflow.join(' → ')}`))
  }

  paragraphs.push(...renderStructure(spec))
  paragraphs.push(...renderBehavior(spec.criticalBehavior))

  if (spec.visualDirection.length) {
    paragraphs.push(spec.visualDirection.map((value) => sentence(compactVisual(value))).join(' '))
  }

  if (spec.boundaries.length) {
    paragraphs.push(spec.boundaries.map((value) => sentence(compactBoundary(value))).join(' '))
  }

  if (spec.buildRequirements.length) {
    paragraphs.push(spec.buildRequirements.map(sentence).join(' '))
  }

  return paragraphs.filter(Boolean).join('\n\n')
}

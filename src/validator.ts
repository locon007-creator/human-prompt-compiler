import type { InputSnapshot } from './input.js'
import type { PreparedSpec } from './prepared-spec.js'
import { compactBoundary, compactInstruction, compactTrigger, compactVisual } from './briefing.js'

const normalize = (value: string): string => value
  .toLowerCase()
  .replace(/[^a-z0-9\s→]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const containsMeaning = (output: string, value: string): boolean => {
  const target = normalize(value)
  return Boolean(target) && normalize(output).includes(target)
}

const containsOriginalOrCompact = (output: string, value: string): boolean =>
  containsMeaning(output, value) || containsMeaning(output, compactInstruction(value))

const isControlIntroduction = (action: string): boolean =>
  /^(?:include|add|place|use)\b.*\b(?:button|action|control|selector|field)\b/i.test(action.trim())

const containsPairedIntroduction = (
  output: string,
  action: string,
  nextAction?: string,
): boolean => {
  if (!nextAction) return false
  const current = action.trim().replace(/[.!?]+$/, '')
  const next = nextAction.trim().replace(/[.!?]+$/, '')

  const namedControl = next.match(/^Pressing\s+(.+?)\s+(opens?|shows?|starts?|saves?|adds?|creates?|reveals?|launches?|displays?|enables?|turns?)\s+(.+)$/i)
  if (namedControl?.[1] && namedControl[2] && namedControl[3]) {
    const target = namedControl[1].trim()
    const effect = `${namedControl[2]} ${namedControl[3]}`
    if (!/^(?:this|that|this one|that one)$/i.test(target)) {
      if (/^it$/i.test(target)) {
        if (!isControlIntroduction(current)) return false
      } else if (!normalize(current).includes(normalize(target))) {
        return false
      }
      const fused = `${current} that ${effect}`
      return containsMeaning(output, fused) || containsMeaning(output, compactInstruction(fused))
    }
  }

  const contents = next.match(/^It\s+contains\s+exactly\s+(.+)$/i)
  if (contents?.[1] && /\bsection\b/i.test(current)) {
    const fused = `${current} containing exactly ${contents[1]}`
    return containsMeaning(output, fused) || containsMeaning(output, compactInstruction(fused))
  }

  const screen = current.match(/^(.+?)\s+shows\s+(.+)$/i)
  const titleDetail = next.match(/^Show\s+(.+?)\s+near\s+the\s+(.+?)\s+title$/i)
  if (screen?.[1] && titleDetail?.[1] && titleDetail[2] && normalize(screen[1]) === normalize(titleDetail[2])) {
    const fused = `${current}, with ${titleDetail[1]} near the title`
    return containsMeaning(output, fused) || containsMeaning(output, compactInstruction(fused))
  }

  return false
}

const containsBehaviorAction = (
  output: string,
  action: string,
  previousAction?: string,
  nextAction?: string,
): boolean => {
  if (containsOriginalOrCompact(output, action)) return true
  if (containsPairedIntroduction(output, action, nextAction)) return true

  const clean = action.trim().replace(/[.!?]+$/, '')

  const pressing = clean.match(/^Pressing\s+(.+?)\s+(opens?|shows?|starts?|saves?|adds?|creates?|reveals?|launches?|displays?|enables?|turns?)\s+(.+)$/i)
  const pressingTarget = pressing?.[1]
  const pressingVerb = pressing?.[2]
  const pressingRest = pressing?.[3]
  if (pressingTarget && pressingVerb && pressingRest) {
    const target = pressingTarget.trim()
    const effect = `${pressingVerb} ${pressingRest}`

    if (/^it$/i.test(target)) {
      if (!previousAction || !isControlIntroduction(previousAction)) return false
      const fusedRaw = `${previousAction.trim().replace(/[.!?]+$/, '')} that ${effect}`
      return containsMeaning(output, fusedRaw) || containsMeaning(output, compactInstruction(fusedRaw))
    }

    if (!/^(?:this|that|this one|that one)$/i.test(target)) {
      return containsMeaning(output, target) && containsMeaning(output, effect)
    }
  }

  const contents = clean.match(/^It\s+contains\s+exactly\s+(.+)$/i)
  const exactContents = contents?.[1]
  if (exactContents) {
    if (!previousAction || !/\bsection\b/i.test(previousAction)) return false
    const fusedRaw = `${previousAction.trim().replace(/[.!?]+$/, '')} containing exactly ${exactContents}`
    return containsMeaning(output, fusedRaw) || containsMeaning(output, compactInstruction(fusedRaw))
  }

  const titleDetail = clean.match(/^Show\s+(.+?)\s+near\s+the\s+(.+?)\s+title$/i)
  const detailText = titleDetail?.[1]
  const detailScreen = titleDetail?.[2]
  if (detailText && detailScreen && previousAction) {
    const previousScreen = previousAction.trim().replace(/[.!?]+$/, '').match(/^(.+?)\s+shows\s+(.+)$/i)
    const previousScreenName = previousScreen?.[1]
    if (previousScreenName && normalize(previousScreenName) === normalize(detailScreen)) {
      const fusedRaw = `${previousAction.trim().replace(/[.!?]+$/, '')}, with ${detailText} near the title`
      return containsMeaning(output, fusedRaw) || containsMeaning(output, compactInstruction(fusedRaw))
    }
  }

  return false
}

const paragraphs = (output: string): string[] => output
  .split(/\n\s*\n/)
  .map((part) => part.trim())
  .filter(Boolean)

const assertRole = (spec: Readonly<PreparedSpec>, output: string): void => {
  const first = paragraphs(output)[0] ?? ''
  if (!containsMeaning(first, spec.role)) throw new Error('role is missing or altered')
}

const assertWorkflow = (spec: Readonly<PreparedSpec>, output: string): void => {
  if (!spec.workflow.length) return
  const flow = spec.workflow.join(' → ')
  if (!normalize(output).includes(normalize(flow))) throw new Error('workflow coverage failed')
}

const assertRelationships = (spec: Readonly<PreparedSpec>, output: string): void => {
  for (let index = 0; index < spec.criticalBehavior.length; index += 1) {
    const rule = spec.criticalBehavior[index]
    if (!rule) continue

    if (rule.trigger && !containsMeaning(output, rule.trigger) && !containsMeaning(output, compactTrigger(rule.trigger))) {
      throw new Error('timing or trigger was altered')
    }
    for (const condition of rule.condition ?? []) {
      if (!containsMeaning(output, condition)) throw new Error('behavior condition was lost')
    }
    if (/\boptional\b|\bmay\b/i.test(rule.action) && !containsOriginalOrCompact(output, rule.action)) {
      throw new Error('optional behavior was altered')
    }

    const previousAction = spec.criticalBehavior[index - 1]?.action
    const nextAction = spec.criticalBehavior[index + 1]?.action
    if (!containsBehaviorAction(output, rule.action, previousAction, nextAction)) {
      throw new Error(`critical behavior coverage failed: ${rule.action}`)
    }

    for (const result of rule.result ?? []) {
      if (!containsOriginalOrCompact(output, result)) throw new Error('behavior result was lost')
    }
  }
}

const assertBoundaries = (spec: Readonly<PreparedSpec>, output: string): void => {
  for (const boundary of spec.boundaries) {
    if (!containsMeaning(output, boundary) && !containsMeaning(output, compactBoundary(boundary))) {
      throw new Error('boundary or scope constraint was altered')
    }
  }
}

const assertVisualQuality = (
  input: Readonly<InputSnapshot>,
  spec: Readonly<PreparedSpec>,
  output: string,
): void => {
  if (!/\bpremium\b/i.test(input.visualStyle)) return
  if (!spec.visualDirection.length) throw new Error('premium visual guidance is missing from spec')
  const survived = spec.visualDirection.some((direction) =>
    containsMeaning(output, direction) || containsMeaning(output, compactVisual(direction))
  )
  if (!survived) throw new Error('premium visual guidance is missing from output')
}

const assertNoDuplicates = (output: string): void => {
  const seen = new Set<string>()
  for (const paragraph of paragraphs(output)) {
    const key = normalize(paragraph)
    if (!key) continue
    if (seen.has(key)) throw new Error('duplicate semantic paragraph detected')
    seen.add(key)
  }
}

const assertNoFragments = (output: string): void => {
  const fragments = /(?:^|\n\s*\n)(?:show|add)\s*:\s*\.?\s*(?=\n|$)|(?:^|\n\s*\n)(?:bill schedules|then asking)\s*\.\s*(?=\n|$)/i
  if (fragments.test(output)) throw new Error('orphan fragment detected')
}

const contaminationFamilies = [
  ['investment', 'portfolio', 'stock', 'trade'],
  ['fleet', 'dispatch', 'driver'],
  ['recipe', 'ingredient', 'cooking'],
  ['payroll', 'employer', 'team'],
]

const assertNoContamination = (
  input: Readonly<InputSnapshot>,
  spec: Readonly<PreparedSpec>,
  output: string,
): void => {
  const allowed = normalize([
    input.idea,
    spec.product,
    spec.primaryJob,
    ...spec.workflow,
    ...spec.visualDirection,
    ...spec.boundaries,
    ...spec.buildRequirements,
    ...spec.criticalBehavior.flatMap((rule) => [
      rule.trigger ?? '',
      ...(rule.condition ?? []),
      rule.action,
      ...(rule.result ?? []),
    ]),
  ].join(' '))
  const rendered = normalize(output)

  for (const family of contaminationFamilies) {
    const introduced = family.filter((token) => rendered.includes(token) && !allowed.includes(token))
    if (introduced.length >= 2) throw new Error('unrelated domain contamination detected')
  }
}

export const validateCompile = (
  input: Readonly<InputSnapshot>,
  spec: Readonly<PreparedSpec>,
  output: string,
): void => {
  if (!output.trim()) throw new Error('rendered output is empty')
  assertRole(spec, output)
  assertWorkflow(spec, output)
  assertRelationships(spec, output)
  assertBoundaries(spec, output)
  assertVisualQuality(input, spec, output)
  assertNoDuplicates(output)
  assertNoFragments(output)
  assertNoContamination(input, spec, output)
}

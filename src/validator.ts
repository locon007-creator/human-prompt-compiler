import type { InputSnapshot } from './input.js'
import type { PreparedSpec } from './prepared-spec.js'

const normalize = (value: string): string => value
  .toLowerCase()
  .replace(/[^a-z0-9\s→]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const containsMeaning = (output: string, value: string): boolean => {
  const target = normalize(value)
  return Boolean(target) && normalize(output).includes(target)
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
  for (const rule of spec.criticalBehavior) {
    if (rule.trigger && !containsMeaning(output, rule.trigger)) {
      throw new Error('timing or trigger was altered')
    }
    for (const condition of rule.condition ?? []) {
      if (!containsMeaning(output, condition)) throw new Error('behavior condition was lost')
    }
    if (/\boptional\b|\bmay\b/i.test(rule.action) && !containsMeaning(output, rule.action)) {
      throw new Error('optional behavior was altered')
    }
    if (!containsMeaning(output, rule.action)) throw new Error('critical behavior coverage failed')
    for (const result of rule.result ?? []) {
      if (!containsMeaning(output, result)) throw new Error('behavior result was lost')
    }
  }
}

const assertBoundaries = (spec: Readonly<PreparedSpec>, output: string): void => {
  for (const boundary of spec.boundaries) {
    if (!containsMeaning(output, boundary)) throw new Error('boundary or scope constraint was altered')
  }
}

const assertVisualQuality = (
  input: Readonly<InputSnapshot>,
  spec: Readonly<PreparedSpec>,
  output: string,
): void => {
  if (!/\bpremium\b/i.test(input.visualStyle)) return
  if (!spec.visualDirection.length) throw new Error('premium visual guidance is missing from spec')
  const survived = spec.visualDirection.some((direction) => containsMeaning(output, direction))
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

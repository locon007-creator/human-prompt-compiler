import type { InputSnapshot } from './input.js'

export type SemanticDraft = {
  product: string
  primaryJob: string
  targetUser?: string
  platform?: string
  workflow: string[]
  behaviorUnits: string[]
  visualDirection: string[]
  boundaries: string[]
  buildRequirements: string[]
  unresolved: string[]
  sourceUnits: string[]
}

const clean = (value: string): string => value.replace(/\s+/g, ' ').trim()
const stripEnd = (value: string): string => clean(value).replace(/[.!?]+$/, '').trim()

const splitSourceUnits = (idea: string): string[] => idea
  .split(/\n+|(?<=[.!?])\s+/)
  .map(clean)
  .filter(Boolean)

const extractWorkflow = (unit: string): string[] | null => {
  const match = unit.match(/(?:main\s+flow|main\s+workflow|workflow)\s*:\s*(.+)$/i)
  if (!match?.[1] || !match[1].includes('→')) return null
  return match[1]
    .split('→')
    .map(stripEnd)
    .filter(Boolean)
}

const extractPrimaryJob = (unit: string): string | null => {
  const match = unit.match(/(?:the\s+(?:app|product)\s+has\s+one\s+job|one\s+job|primary\s+job)\s*:\s*(.+)$/i)
  return match?.[1] ? stripEnd(match[1]) : null
}

const extractProduct = (unit: string): string | null => {
  const named = unit.match(/\b(?:called|named)\s+([^,.!?]+)/i)
  if (named?.[1]) return stripEnd(named[1])

  const build = unit.match(/^build\s+(.+?)[.!?]?$/i)
  if (!build?.[1]) return null

  const candidate = stripEnd(build[1])
    .replace(/\s+that\s+.+$/i, '')
    .replace(/\s+for\s+one\s+(?:person|worker|driver|user).*$/i, '')

  return clean(candidate)
}

const extractTargetUser = (unit: string): string | null => {
  const match = unit.match(/\bfor\s+(one\s+(?:person|worker|driver|user)|people\s+[^,.!?]*)/i)
  return match?.[1] ? stripEnd(match[1]) : null
}

const isBoundary = (unit: string): boolean =>
  /^(?:no\b|never\b|do\s+not\b|without\b|exclude\b|remove\b)/i.test(unit) ||
  /\bwithout\s+[^,.!?]+/i.test(unit)

const isBuildRequirement = (unit: string): boolean =>
  /\b(?:single\s+index\.html|self-contained|inline\s+(?:css|js|javascript)|no\s+hmr|apk|directly\s+previewable|build\s+format)\b/i.test(unit)

const isVisualDirection = (unit: string): boolean =>
  /\b(?:visual|style|premium|modern|minimal|hierarchy|spacing|typography|transition|polish|polished|thumb-friendly|layout|android-style|ios-style|color|theme|sheet|dialog)\b/i.test(unit)

const isBehavior = (unit: string): boolean =>
  /\b(?:when|whenever|if|once|after|before|beginning|starting|save|store|persist|require|required|optional|mark|show|ask|update|calculate|record|remember|notify|notification)\b/i.test(unit)

export const extractSemantics = (input: Readonly<InputSnapshot>): SemanticDraft => {
  const sourceUnits = splitSourceUnits(input.idea)
  const workflow: string[] = []
  const behaviorUnits: string[] = []
  const visualDirection: string[] = []
  const boundaries: string[] = []
  const buildRequirements: string[] = []
  const unresolved: string[] = []

  let product = ''
  let primaryJob = ''
  let targetUser: string | undefined

  for (const unit of sourceUnits) {
    if (isBoundary(unit)) {
      boundaries.push(unit)
      continue
    }

    const unitWorkflow = extractWorkflow(unit)
    if (unitWorkflow) {
      workflow.push(...unitWorkflow)
      continue
    }

    const job = extractPrimaryJob(unit)
    if (job) {
      primaryJob = job
      continue
    }

    // Delivery/build-format instructions must own their sentence before the
    // generic "Build ..." product detector sees it.
    if (isBuildRequirement(unit)) {
      buildRequirements.push(unit)
      continue
    }

    const unitProduct = extractProduct(unit)
    if (unitProduct) {
      if (!product) product = unitProduct
      targetUser ??= extractTargetUser(unit) ?? undefined
      continue
    }

    if (isVisualDirection(unit)) {
      visualDirection.push(unit)
      continue
    }

    if (isBehavior(unit)) {
      behaviorUnits.push(unit)
      continue
    }

    unresolved.push(unit)
  }

  const draft: SemanticDraft = {
    product,
    primaryJob,
    platform: input.creationFormat,
    workflow,
    behaviorUnits,
    visualDirection,
    boundaries,
    buildRequirements,
    unresolved,
    sourceUnits,
  }

  if (targetUser) draft.targetUser = targetUser
  return draft
}

import type { InputSnapshot } from './input.js'

export type SemanticDraft = {
  product: string
  primaryJob: string
  targetUser?: string
  platform?: string
  workflow: string[]
  primaryViews: string[]
  navigation: string[]
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

const extractPrimaryViews = (unit: string): string[] | null => {
  const match = unit.match(/(?:primary|main|persistent)\s+(?:views|screens)\s*:\s*(.+)$/i)
  if (!match?.[1]) return null
  return match[1]
    .split(/\s*[,|]\s*/)
    .map(stripEnd)
    .filter(Boolean)
}

const extractNavigation = (unit: string): string | null => {
  const labeled = unit.match(/^navigation\s*:\s*(.+)$/i)
  if (labeled?.[1]) return stripEnd(labeled[1])

  const appNavigationPattern = /\b(?:persistent\s+)?bottom\s+navigation\b|\bbottom\s+(?:nav|tabs?)\b|\btab\s+bar\b|\bnavigation\s+(?:bar|drawer)\b|\bhamburger\s+menu\b|\btop-right\s+menu\b|\bsidebar\b/i
  return appNavigationPattern.test(unit) ? stripEnd(unit) : null
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
  /^keep\b.*\bwithout\b/i.test(unit)

const isBuildRequirement = (unit: string): boolean =>
  /\b(?:single\s+index\.html|self-contained|inline\s+(?:css|js|javascript)|no\s+hmr|apk|directly\s+previewable|build\s+format)\b/i.test(unit)

const isVisualDirection = (unit: string): boolean =>
  /\b(?:visual|style|premium|modern|minimal|hierarchy|spacing|typography|transition|polish|polished|thumb-friendly|layout|android-style|ios-style|color|theme|sheet|dialog)\b/i.test(unit)

const isBehavior = (unit: string): boolean =>
  /\b(?:when|whenever|if|once|after|before|beginning|starting|pressing|save|store|persist|require|required|optional|mark|show|ask|update|calculate|record|remember|notify|notification|open|opens|turn|turns)\b/i.test(unit)

const platformFromBuildType = (buildType: string): string | undefined => {
  const value = buildType.trim()
  if (/\bandroid\b/i.test(value)) return 'Android App'
  if (/\bios\b|\biphone\b|\bipad\b/i.test(value)) return 'iOS App'
  if (/\bweb\s*app\b|\bwebsite\b/i.test(value) && !/\bapp\s*\/\s*web\s*app\b/i.test(value)) return 'Web App'
  return undefined
}

const requirementFromCreationFormat = (creationFormat: string): string | undefined => {
  if (!/(?:single[-\s]?file\s+html|standalone\s+html|html[-\s]?only|index\.html)/i.test(creationFormat)) {
    return undefined
  }

  return 'Build this as one self-contained index.html only, with inline CSS and inline JavaScript. Do not use React, Vite, npm, JSX, external frameworks, or extra source files. Render the app directly in the browser canvas at 360–430 px mobile proportions. Do not draw or simulate a phone, iPhone, Android device shell, operating-system status bar, battery, Wi-Fi, clock, notch, bezel, system navigation bar, or device frame. It must open and run directly as HTML.'
}

export const extractSemantics = (input: Readonly<InputSnapshot>): SemanticDraft => {
  const sourceUnits = splitSourceUnits(input.idea)
  const workflow: string[] = []
  const primaryViews: string[] = []
  const navigation: string[] = []
  const behaviorUnits: string[] = []
  const visualDirection: string[] = []
  const boundaries: string[] = []
  const buildRequirements: string[] = []
  const unresolved: string[] = []

  const selectedFormatRequirement = requirementFromCreationFormat(input.creationFormat)
  if (selectedFormatRequirement) buildRequirements.push(selectedFormatRequirement)

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

    const unitPrimaryViews = extractPrimaryViews(unit)
    if (unitPrimaryViews) {
      primaryViews.push(...unitPrimaryViews)
      continue
    }

    const unitNavigation = extractNavigation(unit)
    if (unitNavigation) {
      navigation.push(unitNavigation)
      continue
    }

    const job = extractPrimaryJob(unit)
    if (job) {
      primaryJob = job
      continue
    }

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

    if (isBehavior(unit)) {
      behaviorUnits.push(unit)
      continue
    }

    if (isVisualDirection(unit)) {
      visualDirection.push(unit)
      continue
    }

    unresolved.push(unit)
  }

  const draft: SemanticDraft = {
    product,
    primaryJob,
    workflow,
    primaryViews,
    navigation,
    behaviorUnits,
    visualDirection,
    boundaries,
    buildRequirements,
    unresolved,
    sourceUnits,
  }

  const platform = platformFromBuildType(input.buildType)
  if (targetUser) draft.targetUser = targetUser
  if (platform) draft.platform = platform
  return draft
}

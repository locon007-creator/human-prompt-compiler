export type BehaviorRule = {
  trigger?: string
  condition?: string[]
  action: string
  result?: string[]
}

const clean = (value: string) => value.trim().replace(/[.]+$/, '')

const splitAnd = (value: string) => value
  .split(/\s+and\s+/i)
  .map(clean)
  .filter(Boolean)

const parseConditional = (unit: string): BehaviorRule => {
  const text = clean(unit)

  const beginning = text.match(/^(Beginning\s+.+?),\s*if\s+(.+?),\s*(.+)$/i)
  if (beginning) {
    const [, trigger = '', conditions = '', action = ''] = beginning
    return {
      trigger: clean(trigger),
      condition: splitAnd(conditions),
      action: clean(action),
    }
  }

  const when = text.match(/^(When|Whenever|If|Once|After|Before|Starting|On)\s+(.+?),\s*(.+)$/i)
  if (when) {
    const [, lead = '', condition = '', action = ''] = when
    return {
      trigger: clean(`${lead} ${condition}`),
      action: clean(action),
    }
  }

  return { action: text }
}

const isIndependentConditional = (unit: string) => /^(?:when|whenever|if|once|after|before|beginning|starting|on)\b/i.test(unit.trim())
const isResultOnly = (unit: string) => /^(?:save|store|persist|update|mark|then)\b/i.test(unit.trim())

export const groupBehaviorUnits = (units: string[]): BehaviorRule[] => {
  const rules: BehaviorRule[] = []

  for (const unit of units.map(value => value.trim()).filter(Boolean)) {
    if (isResultOnly(unit) && rules.length > 0) {
      const previous = rules[rules.length - 1]
      if (previous) {
        previous.result = splitAnd(unit)
        continue
      }
    }

    if (isIndependentConditional(unit)) {
      rules.push(parseConditional(unit))
      continue
    }

    rules.push({ action: clean(unit) })
  }

  return rules
}

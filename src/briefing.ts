const clean = (value: string): string => value.trim().replace(/[.!?]+$/, '').replace(/\s+/g, ' ')

export const compactTrigger = (value: string): string => {
  const text = clean(value)

  const arrival = text.match(/^When\s+the\s+(.+?)\s+arrives$/i)
  if (arrival?.[1]) return `On ${arrival[1]} arrival`

  const departure = text.match(/^When\s+the\s+(.+?)\s+departs$/i)
  if (departure?.[1]) return `On ${departure[1]} departure`

  return text
}

export const compactInstruction = (value: string): string => {
  const text = clean(value)

  const startsWith = text.match(/^(.+?)\s+starts\s+with\s+(?:an?\s+)?(.+?)\s+(?:button|action)\s+that\s+(opens?|turns?)\s+(.+)$/i)
  if (startsWith?.[1] && startsWith[2] && startsWith[3] && startsWith[4]) {
    return `${startsWith[1]}: ${startsWith[2]} ${startsWith[3].toLowerCase()} ${startsWith[4]}`
  }

  const includeButton = text.match(/^Include\s+(?:an?\s+)?(.+?)\s+button\s+at\s+(.+?)\s+that\s+(opens?|shows?|starts?|turns?)\s+(.+)$/i)
  if (includeButton?.[1] && includeButton[2] && includeButton[3] && includeButton[4]) {
    return `${includeButton[1]} (${includeButton[2]}) ${includeButton[3].toLowerCase()} ${includeButton[4]}`
  }

  const afterSelection = text.match(/^After\s+selecting\s+a\s+result,\s*let\s+the\s+(?:user|driver|worker)\s+(.+?),\s*then\s+add,\s*edit,\s*remove,\s*and\s*reorder\s+(.+)$/i)
  if (afterSelection?.[1] && afterSelection[2]) {
    return `After selection, ${afterSelection[1]}; add/edit/remove/reorder ${afterSelection[2]}`
  }

  const section = text.match(/^Attach\s+(?:one\s+)?collapsible\s+(.+?)(?:\s+information)?\s+section\s+directly\s+to\s+(.+?)\s+containing\s+exactly\s+(.+)$/i)
  if (section?.[1] && section[2] && section[3]) {
    return `Attach collapsible ${section[1]} to ${section[2]}: ${section[3]}`
  }

  const finishDay = text.match(/^Finishing\s+the\s+day\s+saves\s+the\s+completed\s+daily\s+log\s+and\s+clears\s+the\s+active-day\s+state\s+while\s+preserving\s+(.+)$/i)
  if (finishDay?.[1]) {
    return `Finish Day saves the log, clears active-day state, and preserves ${finishDay[1]}`
  }

  const persistence = text.match(/^Persist\s+the\s+active\s+day\s+so\s+closing\s+or\s+reloading\s+never\s+loses\s+(.+)$/i)
  if (persistence?.[1]) {
    return `Persist ${persistence[1]} across closing/reloading`
  }

  const recordTime = text.match(/^record\s+the\s+(?:arrival|departure)\s+time\s+and\s+(.+)$/i)
  if (recordTime?.[1]) return `record time and ${recordTime[1]}`

  return text
}

export const compactVisual = (value: string): string => {
  const text = clean(value)
  const style = text.match(/^Use\s+a\s+(.+?)\s+mobile\s+interface\s+with\s+(.+?);\s*make\s+the\s+first\s+screen\s+feel\s+like\s+a\s+finished\s+premium\s+product,\s*not\s+a\s+prototype,\s*through\s+(.+)$/i)

  if (style?.[1] && style[2] && style[3]) {
    const descriptors = style[1]
      .replace(/\binterface\b/gi, '')
      .trim()
    const details = style[2]
    const finish = style[3]
      .replace(/,?\s*and\s+polished\s+visual\s+details$/i, '')
      .replace(/polished\s+visual\s+details/i, '')
      .trim()
    return `${descriptors.replace(/^a\s+/i, '')} UI: ${details}; finished premium product, not a prototype: ${finish}`
  }

  return text
}

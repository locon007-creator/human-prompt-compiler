const clean = (value: string): string => value.trim().replace(/[.!?]+$/, '').replace(/\s+/g, ' ')

const compactEffect = (value: string): string => clean(value)
  .replace(/^the\s+page\s+into\s+a\s+(.+?)\s+search\s+experience$/i, '$1 search')
  .replace(/^a\s+(.+?)\s+search\s+experience$/i, '$1 search')

export const compactTrigger = (value: string): string => {
  const text = clean(value)

  const arrival = text.match(/^When\s+the\s+(.+?)\s+arrives$/i)
  if (arrival?.[1]) return `On ${arrival[1]} arrival`

  const departure = text.match(/^When\s+the\s+(.+?)\s+departs$/i)
  if (departure?.[1]) return `On ${departure[1]} departure`

  if (/^After\s+selecting\s+a\s+result$/i.test(text)) return 'After selection'

  return text
}

export const compactInstruction = (value: string): string => {
  const text = clean(value)

  const startsWith = text.match(/^(.+?)\s+starts\s+with\s+(?:an?\s+)?(.+?)\s+(?:button|action)\s+that\s+(opens?|turns?)\s+(.+)$/i)
  if (startsWith?.[1] && startsWith[2] && startsWith[3] && startsWith[4]) {
    const verb = /^turn/i.test(startsWith[3]) ? 'opens' : startsWith[3].toLowerCase()
    return `${startsWith[1]}: ${startsWith[2]} ${verb} ${compactEffect(startsWith[4])}`
  }

  const includeButton = text.match(/^Include\s+(?:an?\s+)?(.+?)\s+button\s+at\s+(.+?)\s+that\s+(opens?|shows?|starts?|turns?)\s+(.+)$/i)
  if (includeButton?.[1] && includeButton[2] && includeButton[3] && includeButton[4]) {
    const verb = /^turn/i.test(includeButton[3]) ? 'opens' : includeButton[3].toLowerCase()
    let effect = compactEffect(includeButton[4])
    effect = effect
      .replace(/^a\s+half-height\s+bottom\s+sheet\s+containing\s+a\s+route\s+timeline\s+for\s+editing\s+stops\s+and\s+an?\s+Equipment\s+section\s+for\s+editing\s+the\s+truck\s+and\s+trailer\s+information\s+without\s+leaving\s+the\s+active\s+day$/i,
        'a half-height bottom sheet with editable route timeline + truck/trailer Equipment, without leaving active day')
    return `${includeButton[1]} (${includeButton[2]}) ${verb} ${effect}`
  }

  const required = text.match(/^(.+?)\s+requires\s+(.+)$/i)
  if (required?.[1] && required[2]) {
    return `${required[1]}: ${required[2].replace(/\s+and\s+/gi, ' + ')} required`
  }

  const optional = text.match(/^(.+?)\s+is\s+optional$/i)
  if (optional?.[1]) return `${optional[1]} optional`

  const suggestions = text.match(/^Save\s+previously\s+used\s+(.+?)\s+and\s+show\s+them\s+as\s+suggestions\s+whenever\s+(.+?)\s+is\s+entered$/i)
  if (suggestions?.[1] && suggestions[2]) {
    return `Suggest saved ${suggestions[1]} when entering ${suggestions[2]}`
  }

  const afterSelection = text.match(/^After\s+selecting\s+a\s+result,\s*let\s+the\s+(?:user|driver|worker)\s+(.+?),\s*then\s+add,\s*edit,\s*remove,\s*and\s*reorder\s+(.+)$/i)
  if (afterSelection?.[1] && afterSelection[2]) {
    return `After selection, ${afterSelection[1].replace(/^save\s+the\s+/i, 'save ')}; add/edit/remove/reorder ${afterSelection[2]}`
  }

  const crudAction = text.match(/^let\s+the\s+(?:user|driver|worker)\s+save\s+the\s+(.+?),\s*then\s+add,\s*edit,\s*remove,\s*and\s*reorder\s+(.+)$/i)
  if (crudAction?.[1] && crudAction[2]) {
    return `save ${crudAction[1]}; add/edit/remove/reorder ${crudAction[2]}`
  }

  const access = text.match(/^Include\s+access\s+to\s+(.+?)\s+from\s+(.+)$/i)
  if (access?.[1] && access[2]) return `${access[1]} accessible from ${access[2]}`

  const screenLayout = text.match(/^(.+?)\s+shows\s+the\s+current\s+business\s+name\s+at\s+top-left,\s*address\s+underneath,\s*(.+?)\s+at\s+top-right,\s*and\s+arrival\s+and\s+departure\s+times\s+below,\s*with\s+(.+?)\s+near\s+the\s+title$/i)
  if (screenLayout?.[1] && screenLayout[2] && screenLayout[3]) {
    return `${screenLayout[1]}: business top-left, address below; ${screenLayout[2]} top-right; arrival/departure below; ${screenLayout[3]} near title`
  }

  const section = text.match(/^Attach\s+(?:one\s+)?collapsible\s+(.+?)(?:\s+information)?\s+section\s+directly\s+to\s+(.+?)\s+containing\s+exactly\s+(.+)$/i)
  if (section?.[1] && section[2] && section[3]) {
    return `Attach collapsible ${section[1]} to ${section[2]}: ${section[3]}`
  }

  const finishDay = text.match(/^Finishing\s+the\s+day\s+saves\s+the\s+completed\s+daily\s+log\s+and\s+clears\s+the\s+active-day\s+state\s+while\s+preserving\s+(.+)$/i)
  if (finishDay?.[1]) {
    return `Finish Day: save log, clear active state; preserve ${finishDay[1]}`
  }

  const persistence = text.match(/^Persist\s+the\s+active\s+day\s+so\s+closing\s+or\s+reloading\s+never\s+loses\s+(.+)$/i)
  if (persistence?.[1]) {
    return `Persist ${persistence[1]} across closing/reloading`
  }

  const recordTime = text.match(/^record\s+the\s+(?:arrival|departure)\s+time\s+and\s+(.+)$/i)
  if (recordTime?.[1]) return `record time; ${recordTime[1]}`

  const departureAction = text.match(/^record\s+the\s+departure\s+time,\s*move\s+that\s+(.+?)\s+to\s+Completed,\s*and\s+make\s+the\s+next\s+route\s+(.+?)\s+active$/i)
  if (departureAction?.[1] && departureAction[2]) {
    return `record time; complete ${departureAction[1]}; activate next route ${departureAction[2]}`
  }

  const completed = text.match(/^Completed\s+(.+?)\s+remain\s+available\s+in\s+a\s+collapsible\s+completed\s+section\s+with\s+arrival,\s*departure,\s*and\s+saved\s+(.+)$/i)
  if (completed?.[1] && completed[2]) {
    return `Completed ${completed[1]} stay collapsible with arrival/departure + saved ${completed[2]}`
  }

  if (/^Use\s+external\s+navigation\s+only\s+for\s+driving\s+directions$/i.test(text)) {
    return 'Driving directions: external navigation only'
  }

  const dayComplete = text.match(/^Day\s+Complete\s+optionally\s+offers\s+Navigate\s+Home\s+when\s+a\s+Home\s+Base\s+is\s+saved,\s*then\s+asks\s+for\s+Ending\s+Mileage\s+before\s+Finish\s+Day$/i)
  if (dayComplete) return 'Day Complete: offer Navigate Home if Home Base saved; Ending Mileage before Finish Day'

  const carryForward = text.match(/^save\s+it\s+and\s+carry\s+it\s+forward\s+as\s+the\s+next\s+(.+)$/i)
  if (carryForward?.[1]) return `save it; use it as the next ${carryForward[1]}`

  return text
}

export const compactBoundary = (value: string): string => {
  const text = clean(value)

  const linearNav = text.match(/^Do\s+not\s+use\s+(.+?)\s+because\s+the\s+(.+?)\s+flow\s+is\s+linear$/i)
  if (linearNav?.[1] && linearNav[2]) {
    return `Linear ${linearNav[2]}: no ${linearNav[1]}`
  }

  const separate = text.match(/^Do\s+not\s+create\s+a\s+separate\s+(.+)$/i)
  if (separate?.[1]) return `No separate ${separate[1]}`

  const noAddSingle = text.match(/^Do\s+not\s+add\s+(?:an?\s+)?(.+)$/i)
  if (noAddSingle?.[1]) return `No ${noAddSingle[1]}`

  const noRender = text.match(/^Do\s+not\s+render\s+(?:an?\s+)?(.+)$/i)
  if (noRender?.[1]) return `No ${noRender[1]}`

  return text
}

const compactPremiumStyle = (text: string): string | null => {
  const style = text.match(/^Use\s+a\s+(.+?)\s+mobile\s+interface\s+with\s+(.+?);\s*make\s+the\s+first\s+screen\s+feel\s+like\s+a\s+finished\s+premium\s+product,\s*not\s+a\s+prototype,\s*through\s+(.+)$/i)
  if (!style?.[1] || !style[2] || !style[3]) return null

  const descriptors = style[1].replace(/\binterface\b/gi, '').trim()
  const details = style[2]
    .replace(/strong\s+hierarchy,\s*clean\s+spacing,\s*polished\s+typography/i, 'strong hierarchy/spacing/typography')
    .replace(/,?\s*and\s+one\s+obvious\s+primary\s+action\s+at\s+each\s+step/i, '; one clear primary action/step')
  const finish = style[3]
    .replace(/,?\s*and\s+polished\s+visual\s+details$/i, '')
    .replace(/polished\s+visual\s+details/i, '')
    .trim()
  return `${descriptors.replace(/^a\s+/i, '')} UI: ${details}; finished, not a prototype: ${finish}`
}

export const compactVisual = (value: string): string => {
  const text = clean(value)

  const prefixed = text.match(/^Use\s+comma\s+separators\s+for\s+mileage\s+values\s+and\s+keep\s+all\s+touch\s+controls\s+large\s+and\s+thumb-friendly;\s*(Use\s+a\s+.+)$/i)
  if (prefixed?.[1]) {
    const style = compactPremiumStyle(prefixed[1])
    if (style) return `Comma-separated mileage; large thumb-friendly controls. ${style}`
  }

  return compactPremiumStyle(text) ?? text
}

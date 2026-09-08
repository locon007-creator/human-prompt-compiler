export type CompilerInput = {
  idea: string
  buildType: string
  creationFormat: string
  visualStyle: string
}

export type InputSnapshot = CompilerInput

const required = (label: keyof CompilerInput, value: string) => {
  const trimmed = value.trim()
  if (!trimmed) throw new Error(`${label} is required`)
  return trimmed
}

export const snapshotInput = (input: CompilerInput): Readonly<InputSnapshot> => Object.freeze({
  idea: required('idea', input.idea),
  buildType: required('buildType', input.buildType),
  creationFormat: required('creationFormat', input.creationFormat),
  visualStyle: required('visualStyle', input.visualStyle),
})

import { snapshotInput, type CompilerInput } from './input.js'
import { extractSemantics } from './extract.js'
import { applyCoreLaws } from './laws.js'
import { createPreparedSpec, type PreparedSpec } from './prepared-spec.js'
import { renderPrompt } from './renderer.js'
import { validateCompile } from './validator.js'

export type CompileResult = {
  spec: Readonly<PreparedSpec>
  prompt: string
}

export const compile = (input: CompilerInput): CompileResult => {
  const snapshot = snapshotInput(input)
  const semanticDraft = extractSemantics(snapshot)
  const lawfulDraft = applyCoreLaws(semanticDraft, snapshot)
  const spec = createPreparedSpec(lawfulDraft)
  const prompt = renderPrompt(spec)
  validateCompile(snapshot, spec, prompt)
  return { spec, prompt }
}

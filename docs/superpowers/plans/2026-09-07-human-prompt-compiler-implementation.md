# Human Prompt Compiler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build version 1 of a fully deterministic compiler that converts one current user idea plus build selections into a concise, natural, premium-build prompt without inventing scope or losing semantic relationships.

**Architecture:** The compiler is a pure TypeScript pipeline: current input snapshot → deterministic extraction → relationship grouping → 10 core laws → immutable `PreparedSpec` → human renderer → purity/coverage validation → final prompt. Each file owns one responsibility and the renderer never receives raw input. Tests inspect both semantic state and final output.

**Tech Stack:** Node.js 24+, TypeScript, Vitest, no runtime dependencies beyond the standard TypeScript toolchain in version 1.

**Spec:** `docs/superpowers/specs/2026-09-07-human-prompt-compiler-design.md`

## Global Constraints

- Version 1 is fully deterministic.
- No AI model calls.
- No external semantic service.
- No framework UI.
- No Vercel integration.
- No database.
- No generated history as compiler context.
- No previous prompt may influence a new generation.
- The compiler accepts only the current input snapshot: `idea`, `buildType`, `creationFormat`, and `visualStyle`.
- Output must sound like a knowledgeable human briefing another expert.
- Premium quality may improve presentation and interaction polish but must never add scope.
- Explicit user instructions outrank inference.
- Explicit workflow order, timing, conditions, optionality, and exclusions must survive unchanged in meaning.
- Unknown but important language must be preserved rather than silently discarded.
- A failed output is rebuilt from the current immutable input and validated semantic data only; old output is never reused.

---

## File Map

- `package.json` — scripts and dev-only toolchain.
- `tsconfig.json` — strict TypeScript configuration.
- `src/input.ts` — `CompilerInput`, normalized snapshot, input validation.
- `src/relationships.ts` — `BehaviorRule` type and relationship grouping helpers.
- `src/extract.ts` — deterministic classification and extraction into an intermediate semantic draft.
- `src/laws.ts` — deterministic enforcement of the 10 compiler laws, especially deduplication, ownership, optionality, boundaries, and no-invention guards.
- `src/prepared-spec.ts` — immutable `PreparedSpec` construction.
- `src/renderer.ts` — concise human-language rendering only.
- `src/validator.ts` — coverage, purity, relationship survival, contradiction, duplicate, fragment, compactness, and determinism checks.
- `src/compiler.ts` — orchestration only; exposes `compile()`.
- `tests/financial-assistant.test.ts` — finance benchmark.
- `tests/timesheet.test.ts` — timesheet benchmark.
- `tests/drop-hook.test.ts` — trucking benchmark.
- `tests/recipe.test.ts` — cross-domain purity benchmark.
- `tests/simple-utility.test.ts` — anti-overbuilding benchmark.
- `tests/determinism.test.ts` — identical input produces byte-identical output and no cross-run contamination.

---

### Task 1: Establish the deterministic TypeScript test harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/input.ts`
- Create: `tests/input.test.ts`

**Interfaces:**
- Produces: `CompilerInput`, `InputSnapshot`, `snapshotInput(input: CompilerInput): Readonly<InputSnapshot>`
- `CompilerInput = { idea: string; buildType: string; creationFormat: string; visualStyle: string }`

- [ ] **Step 1: Write the failing input snapshot tests**

```ts
import { describe, expect, it } from 'vitest'
import { snapshotInput } from '../src/input'

describe('snapshotInput', () => {
  it('requires all four current-generation inputs', () => {
    expect(() => snapshotInput({
      idea: '',
      buildType: 'App / Web App',
      creationFormat: 'Android App',
      visualStyle: 'Premium Modern',
    })).toThrow(/idea/i)
  })

  it('returns an immutable trimmed current-generation snapshot', () => {
    const result = snapshotInput({
      idea: '  Build a personal timesheet.  ',
      buildType: ' App / Web App ',
      creationFormat: ' Android App ',
      visualStyle: ' Premium Modern ',
    })

    expect(result).toEqual({
      idea: 'Build a personal timesheet.',
      buildType: 'App / Web App',
      creationFormat: 'Android App',
      visualStyle: 'Premium Modern',
    })
    expect(Object.isFrozen(result)).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run tests/input.test.ts`

Expected: FAIL because `src/input.ts` and the exported interface do not exist.

- [ ] **Step 3: Create the minimal toolchain**

`package.json`:

```json
{
  "name": "human-prompt-compiler",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.9.2",
    "vitest": "^3.2.4"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

- [ ] **Step 4: Implement `snapshotInput` minimally**

```ts
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
```

- [ ] **Step 5: Run test and typecheck**

Run: `npm test -- --run tests/input.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json src/input.ts tests/input.test.ts
git commit -m "feat: add immutable compiler input snapshot"
```

---

### Task 2: Define immutable semantic types and relationship grouping

**Files:**
- Create: `src/relationships.ts`
- Create: `src/prepared-spec.ts`
- Create: `tests/relationships.test.ts`

**Interfaces:**
- Produces: `BehaviorRule`, `PreparedSpec`, `groupBehaviorUnits(units: string[]): BehaviorRule[]`, `freezePreparedSpec(spec: PreparedSpec): Readonly<PreparedSpec>`

- [ ] **Step 1: Write failing relationship tests**

```ts
import { describe, expect, it } from 'vitest'
import { groupBehaviorUnits } from '../src/relationships'

describe('groupBehaviorUnits', () => {
  it('keeps trigger condition action and results in one rule', () => {
    const rules = groupBehaviorUnits([
      'Beginning Thursday after 6 PM, if tomorrow is the saved payday and the amount has not been entered, ask how much the user expects to receive.',
      'Save the amount for that pay period and immediately update current calculations.',
    ])

    expect(rules).toHaveLength(1)
    expect(rules[0]).toMatchObject({
      trigger: 'Beginning Thursday after 6 PM',
      action: expect.stringMatching(/ask how much/i),
      condition: expect.arrayContaining([
        expect.stringMatching(/tomorrow is the saved payday/i),
        expect.stringMatching(/amount has not been entered/i),
      ]),
      result: expect.arrayContaining([
        expect.stringMatching(/save the amount for that pay period/i),
        expect.stringMatching(/update current calculations/i),
      ]),
    })
  })
})
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/relationships.test.ts`

Expected: FAIL because relationship APIs do not exist.

- [ ] **Step 3: Implement the semantic types**

`src/relationships.ts` must export:

```ts
export type BehaviorRule = {
  trigger?: string
  condition?: string[]
  action: string
  result?: string[]
}
```

`src/prepared-spec.ts` must export:

```ts
import type { BehaviorRule } from './relationships.js'

export type PreparedSpec = {
  role: string
  product: string
  primaryJob: string
  targetUser?: string
  platform?: string
  workflow: string[]
  criticalBehavior: BehaviorRule[]
  visualDirection: string[]
  boundaries: string[]
  buildRequirements: string[]
}
```

- [ ] **Step 4: Implement minimal relationship grouping**

Use deterministic clause matching for:

- trigger leads: `when`, `whenever`, `if`, `once`, `after`, `before`, `beginning`, `starting`, `on`
- conditions introduced by `if` / `when` subordinate clauses
- result leads: `save`, `store`, `persist`, `update`, `mark`, `then`

The implementation must merge an immediately following result-only sentence into the preceding rule. It must not merge two sentences when both contain independent trigger conditions.

- [ ] **Step 5: Implement deep freezing for PreparedSpec**

`freezePreparedSpec()` must freeze the object, every array, every `BehaviorRule`, and all rule arrays.

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test -- --run tests/relationships.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/relationships.ts src/prepared-spec.ts tests/relationships.test.ts
git commit -m "feat: preserve semantic behavior relationships"
```

---

### Task 3: Build deterministic semantic extraction with single-owner classification

**Files:**
- Create: `src/extract.ts`
- Create: `tests/extract.test.ts`

**Interfaces:**
- Consumes: `Readonly<InputSnapshot>`, `BehaviorRule`
- Produces: `SemanticDraft`, `extractSemantics(input: Readonly<InputSnapshot>): SemanticDraft`

`SemanticDraft`:

```ts
type SemanticDraft = {
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
```

- [ ] **Step 1: Write failing extraction tests**

Include tests proving:

```ts
it('preserves explicit arrow workflow order')
it('classifies explicit no/do not/without language as boundaries')
it('does not invent a workflow when none is present')
it('keeps optional language intact')
it('preserves unknown meaningful clauses in unresolved')
it('does not classify visual style as functionality')
```

Use concrete assertions such as:

```ts
expect(draft.workflow).toEqual(['Home', 'Punch In', 'Active Shift', 'Punch Out', 'Saved Day'])
expect(draft.boundaries.join(' ')).toMatch(/no teams/i)
expect(draft.workflow).toEqual([])
expect(draft.unresolved).toContain('Use a private local archive for completed entries.')
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/extract.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement sentence/clause normalization without semantic rewriting**

Rules:

- normalize whitespace
- retain original words and punctuation content
- split on paragraph boundaries and sentence-ending punctuation
- preserve arrow workflows as a single recognized workflow source before general splitting
- preserve colon-led explicit labels such as `Main flow:` and `The app has one job:`

- [ ] **Step 4: Implement explicit signal classification**

Priority order:

1. boundary
2. workflow
3. primary job
4. product
5. build requirement
6. visual direction
7. behavior
8. unresolved

This order prevents `Do not add GPS` from becoming a feature and prevents a workflow sentence from also becoming generic behavior.

- [ ] **Step 5: Implement platform and product extraction**

- `creationFormat` is the authoritative platform/format signal when explicit.
- Product name is extracted only from explicit naming phrases such as `called`, `named`, `Build <Name>`, or a leading title line.
- If no product name exists, use a concise product type derived from the explicit idea phrase, not a branded invented name.

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test -- --run tests/extract.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/extract.ts tests/extract.test.ts
git commit -m "feat: add deterministic semantic extraction"
```

---

### Task 4: Encode the 10 core laws as deterministic transformations and guards

**Files:**
- Create: `src/laws.ts`
- Create: `tests/laws.test.ts`

**Interfaces:**
- Consumes: `SemanticDraft`, `Readonly<InputSnapshot>`
- Produces: `applyCoreLaws(draft, input): LawfulDraft`

`LawfulDraft` keeps the same semantic fields plus `role` and grouped `criticalBehavior`.

- [ ] **Step 1: Write failing law tests**

Tests must prove:

```ts
it('selects one expert role without adding features')
it('deduplicates repeated meaning while retaining the more complete sentence')
it('preserves optionality language')
it('keeps boundaries out of behavior')
it('does not use visualStyle to add functionality')
it('keeps separate rules when conditions differ')
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/laws.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement role selection as a closed deterministic mapping**

Examples:

```ts
const roleFor = (input: Readonly<InputSnapshot>): string => {
  const key = `${input.buildType} ${input.creationFormat}`.toLowerCase()
  if (key.includes('android')) return 'You are a senior Android product designer, mobile UI/UX specialist, and full-stack app engineer.'
  if (key.includes('ios')) return 'You are a senior iOS product designer, mobile UI/UX specialist, and full-stack app engineer.'
  if (key.includes('web') || key.includes('website')) return 'You are a senior web product designer, UX specialist, and full-stack web engineer.'
  return 'You are a senior product designer, UX specialist, and full-stack application engineer.'
}
```

No role mapping may create product features.

- [ ] **Step 4: Implement semantic deduplication**

Normalize only for comparison:

- lowercase
- remove punctuation
- collapse whitespace
- do not remove negation words

When one normalized statement is substantially contained in another, keep the more complete statement unless they belong to different behavior conditions.

- [ ] **Step 5: Group behavior units with `groupBehaviorUnits`**

Unresolved meaningful content that cannot be safely classified must be converted to a plain action `BehaviorRule` rather than dropped.

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test -- --run tests/laws.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/laws.ts tests/laws.test.ts
git commit -m "feat: enforce ten deterministic compiler laws"
```

---

### Task 5: Construct immutable PreparedSpec with strict field ownership

**Files:**
- Modify: `src/prepared-spec.ts`
- Create: `tests/prepared-spec.test.ts`

**Interfaces:**
- Consumes: `LawfulDraft`
- Produces: `createPreparedSpec(draft): Readonly<PreparedSpec>`

- [ ] **Step 1: Write failing ownership tests**

Assert that:

- workflow contains only ordered journey steps
- boundaries are not duplicated in critical behavior
- visual direction is not duplicated in build requirements
- `PreparedSpec` and nested members are frozen

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/prepared-spec.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement `createPreparedSpec`**

Construction must be a copy from `LawfulDraft`, followed by deep freeze. The function must not parse raw text or reinterpret any field.

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test -- --run tests/prepared-spec.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/prepared-spec.ts tests/prepared-spec.test.ts
git commit -m "feat: create immutable prepared spec"
```

---

### Task 6: Render compact human-language prompts

**Files:**
- Create: `src/renderer.ts`
- Create: `tests/renderer.test.ts`

**Interfaces:**
- Consumes: `Readonly<PreparedSpec>` only
- Produces: `renderPrompt(spec: Readonly<PreparedSpec>): string`

- [ ] **Step 1: Write failing renderer tests**

Tests must verify:

```ts
it('starts with exactly one role sentence')
it('states product and one job before workflow details')
it('renders each BehaviorRule as a complete natural paragraph')
it('uses decisive language and avoids consider/could/perhaps')
it('does not print parser labels such as Critical Behavior:')
it('places boundaries before the final build requirement')
it('does not mention a phone frame or mockup unless present in the spec')
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/renderer.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement behavior sentence rendering**

Order for a `BehaviorRule`:

`trigger → condition → action → result`

Example renderer behavior:

```ts
const renderRule = (rule: BehaviorRule) => {
  const trigger = rule.trigger ? `${rule.trigger}, ` : ''
  const condition = rule.condition?.length
    ? `if ${joinNatural(rule.condition)}, `
    : ''
  const action = ensureSentenceCase(rule.action)
  const result = rule.result?.length ? ` ${joinResultSentences(rule.result)}` : ''
  return `${trigger}${condition}${action}${result}`.trim()
}
```

The exact helper wording may change to keep grammar natural, but renderer tests must assert meaning rather than one exact benchmark sentence except where deterministic byte output is explicitly tested.

- [ ] **Step 4: Implement output paragraph order**

1. role
2. product + primary job
3. workflow if present
4. critical behavior paragraphs
5. concise premium visual direction
6. boundaries if present
7. build requirements

Do not generate empty headings or filler paragraphs.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test -- --run tests/renderer.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/renderer.ts tests/renderer.test.ts
git commit -m "feat: render concise human build prompts"
```

---

### Task 7: Add the purity and coverage validator

**Files:**
- Create: `src/validator.ts`
- Create: `tests/validator.test.ts`

**Interfaces:**
- Consumes: `InputSnapshot`, `PreparedSpec`, rendered output
- Produces: `validateCompile(input, spec, output): void`

- [ ] **Step 1: Write failing validation tests**

Cover:

- missing workflow step
- altered timing token
- optional becoming required
- boundary inversion
- duplicate semantic line
- orphan fragments (`Show:.`, `Add:.`, `Bill schedules.`, `Then asking.`)
- unrelated domain contamination
- missing role
- no premium visual guidance for a premium visual selection

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/validator.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement source coverage anchors**

During extraction, every semantic source unit must carry a stable source ID such as `u0`, `u1`, `u2`. `PreparedSpec` creation must preserve internal coverage metadata outside the public rendered fields, or `validateCompile` must receive the lawful draft alongside the spec. Choose one approach and keep the public `PreparedSpec` shape exactly as defined in the spec.

Coverage validation must verify that every locked meaningful source unit is represented in one owned semantic field or one behavior rule.

- [ ] **Step 4: Implement purity checks**

- reject known orphan fragment forms
- reject exact duplicate normalized sentences within the rendered output
- reject output terms that belong only to another benchmark when those terms are absent from current input/spec
- reject a role sentence missing from output
- reject unsupported mockup/device-frame language unless explicitly present in current semantics

- [ ] **Step 5: Implement contradiction checks**

Use explicit lexical pairs from the current source:

- `optional` must not render as `required`
- `do not` / `no` boundaries must not appear as positive imperative features
- explicit workflow sequence must appear in the same order
- explicit time/day phrases must survive in the owning behavior rule

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test -- --run tests/validator.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/validator.ts tests/validator.test.ts src/extract.ts
git commit -m "feat: add purity and requirement coverage gate"
```

---

### Task 8: Wire the orchestration-only compiler API

**Files:**
- Create: `src/compiler.ts`
- Create: `tests/compiler.test.ts`

**Interfaces:**
- Produces:

```ts
export type CompileResult = {
  spec: Readonly<PreparedSpec>
  prompt: string
}

export const compile = (input: CompilerInput): CompileResult
```

- [ ] **Step 1: Write failing orchestration tests**

```ts
it('runs the full pipeline from a fresh current input snapshot')
it('returns both immutable PreparedSpec and final prompt')
it('does not retain module-level generation state')
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/compiler.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement orchestration only**

```ts
export const compile = (input: CompilerInput): CompileResult => {
  const snapshot = snapshotInput(input)
  const extracted = extractSemantics(snapshot)
  const lawful = applyCoreLaws(extracted, snapshot)
  const spec = createPreparedSpec(lawful)
  const prompt = renderPrompt(spec)
  validateCompile(snapshot, lawful, spec, prompt)
  return Object.freeze({ spec, prompt })
}
```

`compiler.ts` must not contain extraction regexes, rendering templates, or benchmark-specific logic.

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test -- --run tests/compiler.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/compiler.ts tests/compiler.test.ts
git commit -m "feat: compose deterministic prompt compiler"
```

---

### Task 9: Lock the Personal Financial Assistant benchmark

**Files:**
- Create: `tests/financial-assistant.test.ts`

**Interfaces:**
- Consumes: public `compile()` only

- [ ] **Step 1: Add the full financial benchmark input**

The test input must explicitly include:

- one person
- fixed vs variable income
- saved payday
- evening-before-payday timing after 6 PM
- ask only when amount is still missing
- save the actual amount for the current pay period
- fixed vs variable bills
- fresh current-cycle amount for variable bills
- current-cycle persistence
- Home state expectations
- explicit exclusions such as investments/business bookkeeping
- premium Android visual direction

- [ ] **Step 2: Assert semantic survival in `result.spec`**

Assert exact workflow order when present and use joined semantic assertions for the Thursday/payday rule and variable-bill rule.

- [ ] **Step 3: Assert final human prompt quality**

The final prompt must:

- contain the expert role
- sound like natural paragraphs
- preserve the two critical timing/persistence relationships
- contain no `Critical Behavior:` / parser-dump headings
- contain no investment or business additions
- contain no device-frame/mockup instruction

- [ ] **Step 4: Run benchmark**

Run: `npm test -- --run tests/financial-assistant.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/financial-assistant.test.ts
git commit -m "test: lock financial assistant benchmark"
```

---

### Task 10: Lock Timesheet and Drop & Hook benchmarks

**Files:**
- Create: `tests/timesheet.test.ts`
- Create: `tests/drop-hook.test.ts`

**Interfaces:**
- Consumes: public `compile()` only

- [ ] **Step 1: Add Timesheet benchmark**

Must assert:

- `Home → Punch In → Active Shift → Punch Out → Saved Day`
- live elapsed timer survives close/reopen when explicitly specified
- Sunday–Friday weekly totals when explicitly specified
- personal scope
- exclusions: teams, GPS, scheduling, payroll processing, employer dashboard

- [ ] **Step 2: Add Drop & Hook benchmark**

Must assert:

- explicit day workflow order
- Work Mode business name/address/arrival/departure
- attached collapsible Drop & Hook information relationship
- trailer continuity when explicitly specified
- exclusions: fleet management and in-app maps

- [ ] **Step 3: Run both benchmarks**

Run: `npm test -- --run tests/timesheet.test.ts tests/drop-hook.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/timesheet.test.ts tests/drop-hook.test.ts
git commit -m "test: lock timesheet and drop hook benchmarks"
```

---

### Task 11: Lock Recipe and Simple Utility anti-contamination benchmarks

**Files:**
- Create: `tests/recipe.test.ts`
- Create: `tests/simple-utility.test.ts`

**Interfaces:**
- Consumes: public `compile()` only

- [ ] **Step 1: Add Recipe benchmark**

Use a recipe-organizer idea containing only recipe/cooking semantics. Assert that the result contains recipe semantics and does not contain:

- payday
- variable income
- bills
- trailer
- mileage
- punch in
- payroll

- [ ] **Step 2: Add Simple Utility benchmark**

Use a deliberately small utility such as:

`Build a private grocery list for one person. Add items, mark them bought, remove them, and keep the list after reopening. Premium clean Android style. No accounts, sharing, recipes, budgets, or analytics.`

Assert:

- no invented dashboard
- no history screen unless explicitly requested
- no settings section unless source semantics require it
- output stays materially shorter than the detailed finance benchmark

- [ ] **Step 3: Run both benchmarks**

Run: `npm test -- --run tests/recipe.test.ts tests/simple-utility.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/recipe.test.ts tests/simple-utility.test.ts
git commit -m "test: lock cross-domain purity benchmarks"
```

---

### Task 12: Prove determinism and cross-generation isolation

**Files:**
- Create: `tests/determinism.test.ts`

**Interfaces:**
- Consumes: public `compile()` only

- [ ] **Step 1: Write identical-input determinism test**

Compile the exact same `CompilerInput` 20 times and assert byte-identical `prompt` values and deep-equal specs.

- [ ] **Step 2: Write cross-generation isolation test**

Compile a finance idea first, then a recipe idea, then a timesheet idea. Assert each later result lacks distinctive terms that exist only in the earlier idea.

- [ ] **Step 3: Write reverse-order isolation test**

Run the same three ideas in reverse order and assert each idea produces the same byte-identical prompt as in the forward-order run.

- [ ] **Step 4: Run determinism suite**

Run: `npm test -- --run tests/determinism.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/determinism.test.ts
git commit -m "test: prove deterministic isolated generations"
```

---

### Task 13: Final verification and README contract

**Files:**
- Modify: `README.md`

**Interfaces:**
- No new runtime API.

- [ ] **Step 1: Update README with the actual pipeline and local commands**

README must document:

```text
Current Input → Semantic Extraction → Relationship Grouping → 10 Core Laws → Immutable PreparedSpec → Human Renderer → Purity/Coverage Gate → Final Prompt
```

and:

```bash
npm install
npm run typecheck
npm run test:run
```

It must explicitly state that version 1 has no AI calls, UI, database, Vercel dependency, or previous-generation context.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run typecheck
npm run test:run
```

Expected:

- TypeScript: zero errors
- all unit tests pass
- all five benchmark families pass
- determinism tests pass

- [ ] **Step 3: Inspect production dependency surface**

Run:

```bash
npm ls --omit=dev
```

Expected: no runtime dependency tree beyond the root package.

- [ ] **Step 4: Final contamination scan**

Search `src/` for benchmark-specific domain vocabulary such as:

```text
payday
trailer
recipe
punch in
bill
mileage
```

Expected: no benchmark-specific domain vocabulary in generic compiler implementation files except generic test fixtures are outside `src/`. If any appears in `src/`, replace it with generic logic unless it is part of a generic lexical rule that is necessary across domains and justified by the spec.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: document deterministic compiler contract"
```

---

## Self-Review Results

- **Spec coverage:** Every design requirement maps to a task: immutable current input (Task 1), relationship survival (Task 2), deterministic extraction (Task 3), 10 laws (Task 4), field ownership (Task 5), human renderer (Task 6), purity/coverage gate (Task 7), orchestration (Task 8), five benchmark families (Tasks 9–11), determinism/isolation (Task 12), final verification (Task 13).
- **Placeholder scan:** No TBD/TODO or unspecified implementation steps remain.
- **Type consistency:** Public API is consistently `compile(input: CompilerInput): CompileResult`; `PreparedSpec` and `BehaviorRule` retain the exact spec fields; renderer receives only `PreparedSpec`.
- **Scope check:** Version 1 remains one subsystem: the deterministic compiler core. UI, AI integration, deployment, persistence, and prompt history are explicitly excluded.

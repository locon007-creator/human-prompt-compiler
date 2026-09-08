# Human Prompt Compiler — Design Specification

## Goal

Build a deterministic prompt compiler that turns a raw user idea into a concise, natural, build-ready prompt that sounds like an experienced product specialist briefing another expert.

The output must remain simple to read while preserving every essential instruction needed for a premium build.

## Product Principle

**Understand deeply. Output simply.**

The compiler must preserve the user's product intent, one primary job, explicit workflow, critical behavior, timing, conditions, state, persistence, visual direction, and exclusions without inventing unrelated functionality.

Premium quality means better hierarchy, spacing, interaction quality, platform conventions, typography, controls, transitions, and implementation polish. Premium quality must never add scope.

## Version 1 Scope

Version 1 is fully deterministic.

- No AI model calls.
- No external semantic service.
- No framework UI.
- No Vercel integration.
- No database.
- No generated history as compiler context.
- No previous prompt may influence a new generation.

The compiler accepts only the current input snapshot.

## Inputs

The first compiler accepts:

- `idea`: raw user idea text.
- `buildType`: selected build family/type.
- `creationFormat`: selected output/build format.
- `visualStyle`: selected visual direction.

All four values belong to the current generation only.

## Core Pipeline

`Current Input → Semantic Extraction → Relationship Grouping → 10 Core Laws → Immutable PreparedSpec → Human Renderer → Purity/Coverage Gate → Final Prompt`

Each stage has one job and must not reinterpret responsibilities owned by another stage.

## PreparedSpec

```ts
type PreparedSpec = {
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

type BehaviorRule = {
  trigger?: string
  condition?: string[]
  action: string
  result?: string[]
}
```

`PreparedSpec` is immutable after creation. The renderer receives only the validated `PreparedSpec`, not the raw idea.

## Field Ownership

### role

One expert role matched to the build type/platform. The role establishes quality and expertise but cannot add functionality.

### product

What is being built and the product name when explicitly provided.

### primaryJob

One concise statement of the user's main outcome. It is not a feature list.

### targetUser

Included only when explicitly stated or unmistakably defined by the idea.

### platform

Included when explicitly selected or clearly stated. Do not guess a platform when the user intentionally leaves it open.

### workflow

Ordered user journey only. Preserve explicit step order exactly. Do not add styling, implementation details, or invented steps.

### criticalBehavior

Interaction, timing, calculations, state changes, conditions, persistence, and trigger → condition → action → result logic.

### visualDirection

Only the presentation guidance needed to support a premium experience: hierarchy, spacing, platform conventions, typography, controls, transitions, sheets/dialogs, and interaction polish.

### boundaries

Explicit exclusions and scope limits only. Do not invent a generic “Do Not Add” list.

### buildRequirements

Only technical requirements necessary for how the requested output should be built or delivered.

## The 10 Core Laws

1. **Understand before writing.** Extract the product, one job, target user/platform when present, explicit workflow, critical behavior, visual direction, exclusions, and build requirements before rendering.
2. **Assign one expert role.** Match the role to the selected build type/platform. The role must not add functionality.
3. **Preserve intent exactly.** Do not change the primary job, workflow, timing, conditions, optionality, or required behavior.
4. **Keep related logic together.** Trigger → condition → action → result remains one semantic unit.
5. **Do not invent major functionality.** Add no unrequested screens, roles, integrations, business features, analytics, subscriptions, social features, or workflows.
6. **Remove repetition and fragments.** Merge duplicate meaning into one complete instruction without losing detail.
7. **Use natural, decisive language.** Write like an experienced human briefing another experienced builder. Prefer Build, Use, Show, Save, Keep, Require, and Do not add. Avoid speculative wording.
8. **Keep the final prompt compact.** Include only information that materially helps preserve intent, explain essential behavior, improve build quality, or protect scope.
9. **Separate function from appearance.** Visual style may improve presentation but cannot alter functionality or scope.
10. **Verify before output.** Every important source requirement must survive, no contradictions or unsupported additions may appear, and the final prompt must be clean and build-ready.

## Deterministic Extraction Rules

### Normalize without rewriting

Split the current idea into complete sentence or clause units, normalize whitespace and punctuation, and retain the original wording for traceability.

### Explicit signals outrank inference

Recognize explicit language such as:

- Build...
- The app has one job...
- Main flow...
- When...
- If...
- After...
- Save...
- Do not...
- No...
- Optional...

Explicit user instructions always outrank derived interpretation.

### Classify once

Each meaningful semantic unit has one primary owner:

- product
- primary job
- workflow
- critical behavior
- visual direction
- boundary
- build requirement

A requirement may not be duplicated across owners merely to make sections look complete.

### Workflow recognition

Preserve arrows, numbered sequences, and explicit sequencing words such as then, next, and after that.

If no workflow is explicitly given, do not manufacture a workflow.

### Negative instruction recognition

Explicit `no`, `never`, `do not`, `without`, `exclude`, and `remove` statements become boundaries and must never be inverted into positive features.

### Optionality preservation

`optional`, `if needed`, `may`, and equivalent language remain optional. Optional input cannot become required.

### Semantic merging

When two units express the same requirement, merge them into the more complete statement while preserving any unique detail.

### Unknown but important language

If an important unit cannot be confidently classified, preserve it as unresolved critical behavior rather than silently discarding it.

## Relationship Grouping

Critical logic must be represented as `BehaviorRule` objects until rendering.

Example source:

> Beginning Thursday after 6 PM, if tomorrow is payday and the amount has not been entered, ask the user how much they expect to receive. Save it for that pay period and immediately update calculations.

Internal representation:

```ts
{
  trigger: "Beginning Thursday after 6 PM",
  condition: [
    "tomorrow is the saved payday",
    "the amount has not been entered"
  ],
  action: "ask the user how much they expect to receive",
  result: [
    "save the amount for that pay period",
    "immediately update current calculations"
  ]
}
```

Rules:

- A trigger stays attached to its action.
- Conditions stay attached to the rule they control.
- Results stay attached to the action that causes them.
- Timing cannot be removed during compression.
- Persistence remains with the behavior it belongs to.
- Different conditions with the same action remain separate rules.
- A continuous behavior described across sentences is merged before rendering.
- Rules are not flattened until the final human-language rendering step.

## Human Renderer

The renderer receives only the validated immutable `PreparedSpec`.

Normal output order:

`Role → Product + One Job → Workflow → Critical Behavior → Visual Direction → Boundaries → Build Requirement`

Rules:

1. Start with one strong role sentence.
2. State what to build and the one job immediately.
3. Use short natural paragraphs.
4. Keep complete behavior relationships in the same paragraph.
5. Use decisive implementation language.
6. Keep premium visual guidance concise, usually 2–4 sentences when needed.
7. Do not repeat requirements.
8. State boundaries directly.
9. End with the build requirement once.
10. Aim for roughly 6–10 short paragraphs for ordinary detailed apps, with simpler ideas producing less output and complex ideas growing only when essential semantics require it.

Headings are optional. The output should read like a human briefing, not a parser dump or formal template.

Every final sentence must do at least one of the following:

- preserve product intent;
- explain essential behavior;
- improve build quality;
- protect scope.

Otherwise remove it.

## Purity and Coverage Gate

The compiler must reject an output when any check fails.

### Requirement coverage

Every locked source requirement must survive into the `PreparedSpec` or a `BehaviorRule`.

### Relationship survival

No trigger, condition, timing rule, action, or saved result may be separated from the behavior it belongs to.

### No invention

The final prompt cannot contain unsupported major features, roles, workflows, screens, integrations, or business behavior.

### No contradiction

The compiler cannot:

- turn optional into required;
- invert exclusions into features;
- change explicit workflow order;
- alter explicit timing or conditions.

### No duplicate meaning

A requirement should appear once in its strongest complete form.

### No fragments

Reject parser-like output such as:

- `Bill schedules.`
- `Then asking.`
- `Show:.`
- `Add:.`

### Scope purity

No language from previous generations, benchmarks, or unrelated domains may appear.

### Human-language quality

Output must use complete, natural, decisive sentences rather than parser labels or mechanical assembly wording.

### Premium-build essentials

Output must include the correct role and enough visual/interaction direction to signal polished production quality without adding scope.

### Compactness

Remove any sentence that does not preserve intent, explain essential behavior, improve build quality, or protect scope.

## Failure Strategy

A failed output is never patched incrementally.

The compiler rebuilds from the current immutable input snapshot and validated semantic data only.

No old output becomes input to a retry.

## Benchmark Contract

Version 1 must pass five cross-domain benchmark families.

### Personal Financial Assistant

Must preserve:

- fixed vs variable income;
- payday timing;
- ask-only-when-needed behavior;
- variable bill cycle amounts;
- current-cycle persistence.

Must not invent investments, bookkeeping, or business features.

### Personal Timesheet

Must preserve:

- Punch In → Active Shift → Punch Out → Saved Day;
- live elapsed timer;
- weekly totals;
- personal-use scope.

Must not add teams, GPS, scheduling, payroll processing, or employer tools.

### Drop & Hook Assistant

Must preserve:

- explicit route/workflow order;
- arrival/departure relationships;
- attached drop/hook information behavior;
- trailer continuity.

Must not add fleet management or in-app maps.

### Recipe App

Must preserve only recipe-related intent and prove there is no finance, trucking, timesheet, or prior-generation contamination.

### Simple Utility

Must remain simple and prove the compiler does not overbuild a small idea merely because richer app patterns exist.

Every benchmark checks:

- coverage;
- purity;
- relationship survival;
- compression.

Tests must inspect both `PreparedSpec` and the final rendered prompt so failures can be localized to semantic extraction versus rendering.

## File Responsibilities

```text
src/
  input.ts             current input types and validation
  extract.ts           deterministic semantic extraction
  relationships.ts     BehaviorRule construction and grouping
  laws.ts              the 10 core laws as deterministic transformations/checks
  prepared-spec.ts     immutable PreparedSpec construction
  renderer.ts          human-language prompt rendering
  validator.ts         purity, coverage, contradiction, fragment, and duplication checks
  compiler.ts          orchestration only

tests/
  financial-assistant.test.ts
  timesheet.test.ts
  drop-hook.test.ts
  recipe.test.ts
  simple-utility.test.ts
```

Each file must have one clear responsibility.

## Success Standard

Version 1 is successful when the five benchmark families produce concise prompts that:

- sound naturally human;
- preserve essential product semantics;
- preserve relationship logic;
- signal premium build quality;
- avoid unrelated invention;
- avoid repetition and fragments;
- remain isolated from previous generations;
- stay deterministic across repeated runs with identical input.

# Human Compression Upgrade Design

## Goal
Keep the compiler centered on one strong human-written prompt while reducing bloat, repetition, and equal-weight instruction dumping. Preserve source intent exactly, but render related requirements as compact, natural briefing language that gives Arena room to design.

## Problem
The compiler currently preserves requirements well but often renders one paragraph per semantic unit. On complex apps this becomes a requirements dump: secondary details receive the same visual weight as primary product structure, related instructions are separated, and normal human briefing rhythm is lost. The rejected Drop & Hook Arena build demonstrated this failure even though semantic coverage tests passed.

## Design Principles
1. One prompt remains the default output. Do not add mandatory multi-prompt architecture.
2. Human language means prioritization and compression, not merely grammatical sentences.
3. Group closely related requirements when grouping does not change meaning.
4. Preserve exact workflow, timing, optionality, boundaries, state relationships, and delivery constraints.
5. Keep the highest-value product structure near the top: role, one job, workflow, primary views/navigation, then critical behavior.
6. Secondary destinations explicitly assigned to menus must not be promoted into Home/dashboard instructions.
7. Prefer one strong sentence carrying several related facts over several isolated sentences.
8. Do not invent implementation details while compressing.
9. Do not hide or drop unique source requirements simply to shorten output.
10. Determinism remains mandatory.

## Architecture
Add a deterministic compression layer inside rendering, not extraction. PreparedSpec remains the source of truth. The renderer will form natural instruction groups from already-classified structure and behavior, using conservative compatibility rules.

### Structure compression
Primary views and explicit navigation should render together when they describe the same app structure. Example:

`Use Home, Weekly, Monthly, History, and Settings, with persistent bottom navigation for Home, Weekly, Monthly, and History and Settings in the top-right menu.`

When explicit navigation already establishes where secondary destinations live, do not add a second generic persistent-navigation sentence.

### Behavior compression
Adjacent behavior rules may share one paragraph when they operate on the same subject or state chain and can be joined without losing trigger/condition/action/result meaning. Conditional rules must keep their trigger and condition intact. Unrelated rules remain separate.

Examples of useful groups:
- route creation + Add Stop + search + route editing
- Work Mode card structure + attached Drop & Hook section
- arrive → trailer change → depart state chain
- finish-day save/clear/preserve state

The renderer should not depend on app names or domain-specific hardcoded labels. Grouping must use generic semantic overlap and relationship continuity.

### Visual and boundary compression
Multiple visual directions should remain one concise paragraph. Boundaries should be deduplicated and combined into the smallest natural set possible without changing scope. Build requirements remain explicit because delivery failures are high-cost.

## Non-Goals
- No AI/model calls.
- No second prompt by default.
- No app-specific Drop & Hook or Timesheet rules.
- No new screens, features, navigation patterns, or business logic.
- No arbitrary hard word limit that can delete required meaning.

## Success Criteria
- Complex benchmark prompts are materially shorter and read like an experienced person briefing a builder.
- Exact workflow and all unique critical requirements survive.
- Related instructions are visibly grouped instead of emitted as one paragraph each.
- Simple apps remain simple and are not expanded.
- Output remains byte-identical for identical input.
- Existing benchmark, validator, and typecheck suites remain green.

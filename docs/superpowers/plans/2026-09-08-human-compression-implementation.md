# Human Compression Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make complex compiler output materially shorter and more human by grouping related already-understood instructions without losing source intent.

**Architecture:** Keep extraction, laws, PreparedSpec, and compiler interfaces unchanged. Add deterministic conservative grouping in `renderer.ts`, driven only by PreparedSpec structure and generic semantic overlap. Strengthen benchmarks so compression is measured alongside semantic survival.

**Tech Stack:** TypeScript, Vitest, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-09-08-human-compression-design.md`

## Global Constraints
- One prompt remains the default output.
- No AI/model calls.
- No app-specific production rules.
- Preserve workflow, timing, optionality, boundaries, state relationships, and delivery constraints.
- Deterministic output is mandatory.
- No arbitrary hard word limit may delete required meaning.

---

### Task 1: Lock structure compression behavior

**Files:**
- Modify: `tests/renderer.test.ts`
- Modify: `src/renderer.ts`

**Interfaces:**
- Consumes: `renderPrompt(spec: Readonly<PreparedSpec>): string`
- Produces: same signature and return type

- [ ] **Step 1: Write failing renderer tests**

Add tests proving that explicit primary views plus matching explicit navigation render as one natural structure paragraph, while a spec with primary views but no navigation still receives one generic navigation sentence. Assert the combined explicit case does not repeat `Use these primary views` and a separate duplicate navigation paragraph.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run tests/renderer.test.ts`
Expected: FAIL because current renderer emits primary views and navigation as separate paragraphs.

- [ ] **Step 3: Implement minimal structure compression**

In `src/renderer.ts`, replace `renderStructure()` with deterministic logic that combines primary-view declaration and explicit navigation when both are present. Preserve explicit navigation wording and every primary view name. Keep the existing fallback when no explicit navigation exists.

- [ ] **Step 4: Run renderer tests**

Run: `npm test -- --run tests/renderer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: compress app structure instructions`

### Task 2: Group compatible behavior instructions

**Files:**
- Modify: `tests/renderer.test.ts`
- Modify: `src/renderer.ts`

**Interfaces:**
- Consumes: `PreparedSpec.criticalBehavior: BehaviorRule[]`
- Produces: compact behavior paragraphs passed into `renderPrompt`

- [ ] **Step 1: Write failing generic behavior-grouping tests**

Use a domain-neutral benchmark such as a reading tracker or appointment planner. Include related rules that share repeated concepts, plus an unrelated conditional rule. Assert related rules appear in one paragraph, the unrelated rule stays separate, and all unique clauses survive.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run tests/renderer.test.ts`
Expected: FAIL because current renderer emits one paragraph per rule.

- [ ] **Step 3: Implement conservative generic grouping**

Add renderer-only helpers that tokenize meaningful words from each already-rendered behavior rule, ignore common instruction stopwords, and join adjacent rules when they have strong semantic overlap or clear state-chain continuity. Never merge rules when doing so would alter trigger/condition boundaries. Use sentence joining only; do not rewrite facts or infer new ones.

- [ ] **Step 4: Run renderer tests**

Run: `npm test -- --run tests/renderer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: group related behavior instructions`

### Task 3: Strengthen complex benchmark quality gates

**Files:**
- Modify: `tests/timesheet.test.ts`
- Modify: `tests/drop-hook.test.ts`

**Interfaces:**
- Consumes: public `compile(input)` result
- Produces: benchmark assertions covering semantic survival plus prompt density

- [ ] **Step 1: Add failing compression assertions**

For Timesheet and Drop & Hook, assert all existing critical source requirements still survive. Add paragraph-count and duplication assertions that fail against the pre-compression style but do not enforce an unsafe global word cap. Require related structure and behavior to appear in grouped paragraphs.

- [ ] **Step 2: Run benchmark tests**

Run: `npm test -- --run tests/timesheet.test.ts tests/drop-hook.test.ts`
Expected: RED before renderer compression, or GREEN if Tasks 1–2 already satisfy the new quality gate. If GREEN, inspect the exact prompt output and strengthen only evidence-based generic assertions; do not manufacture a failure.

- [ ] **Step 3: Make the minimal renderer refinement if a real generic failure appears**

Modify only `src/renderer.ts` and only in response to a verified generic quality failure.

- [ ] **Step 4: Run the full suite and typecheck**

Run: `npm test -- --run`
Expected: all tests pass.

Run: `npm run typecheck`
Expected: success.

- [ ] **Step 5: Commit**

Commit message: `test: enforce human prompt compression`

### Task 4: Determinism and final verification

**Files:**
- Modify only if a verified issue is found: `tests/compiler.test.ts`, `src/renderer.ts`

**Interfaces:**
- Consumes: public `compile(input)`
- Produces: unchanged deterministic `CompileResult`

- [ ] **Step 1: Verify repeated compilation**

Add or reuse a test that compiles the same complex input repeatedly and requires byte-identical prompt output.

- [ ] **Step 2: Run full verification**

Run: `npm test -- --run`
Run: `npm run typecheck`
Expected: all green.

- [ ] **Step 3: Inspect the exact Timesheet and Drop & Hook compiled prompts**

Confirm they read as concise human briefings, preserve every benchmark requirement, avoid app-specific production logic, and remain one prompt each.

- [ ] **Step 4: Commit any verification-only test changes**

Commit message: `test: verify deterministic human compression`

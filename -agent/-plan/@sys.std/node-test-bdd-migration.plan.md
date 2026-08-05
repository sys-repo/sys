node-test-bdd-migration.plan.md
- [x] 10e8cb8de test(testing): establish deterministic sanitizer alarm controls
- [x] 459411c5 refactor(testing): establish sanitizer-strict Deno-native BDD authority
- [x] 732d17bd fix(testing): narrow sanitizer exceptions across dependent suites

## Coordinated repository sequence

The executable opening arc contains only commits that can land and reconcile in the owning `sys`
history. Detailed implementation, proof, and gate checklists live under the corresponding commit
sections below; duplicating them in the arc would create ambiguous progress state.

The full repository sequence is fixed:

1. Commit 1 is independently green in `sys` and leaves the default BDD authority unchanged.
2. Commit 2 establishes the Deno-native adapter, strict root policy, public-facade proof, dependency
   closure, and doctrine while preserving the 35 restored local exception sets. Its first
   strict-root workspace run also records six newly exposed registrations with minimal compatibility
   policy.
3. Commit 3 runs the strict-first 41-suite audit, repairs lifecycle cleanup, and removes or narrows
   exceptions without changing the authority established in Commit 2.
4. After Commit 3's final local campaign state is proven, compose
   `docs(canon): route testing examples through @sys/testing` in the owning `sys.canon` repository;
   canon validation does not wait for publication.
5. Human release authorization follows all three local commits and the coordinated canon commit. It
   is a gate, not another commit, and is not implied by green validation.

Do not reorder or collapse the local arc, merge work across repository histories, validate canon
against a hypothetical surface, or publish between these steps.

## Status: three local commits landed; coordinated canon work pending

The complete local arc is reachable from current `HEAD`:

- `10e8cb8debc3a8b7d22398239f7a8bc7e37c6b5e test(testing): establish deterministic sanitizer alarm controls`;
- `459411c592baff09a69443018783dd36522d7903 refactor(testing): establish sanitizer-strict Deno-native BDD authority`;
- `732d17bdcedc22cc9e130a74bf788d00dd992546 fix(testing): narrow sanitizer exceptions across dependent suites`.

Current checkpoint and implementation truth:

- recovery baseline: `c72d5eef59fc7e5c2a7b683f4a035573b87e04b6`;
- diagnostic checkpoint: `fd6c018c0416f3f328431bbe985449326cbcf35e`;
- checkpoint subject: `checkpoint(testing): pre-hardening node-test migration experiment`;
- ignored/todo ancestry suppresses focus propagation, rejected suite registration is transactional,
  and native Deno bootstraps anchor adapter reachability;
- shared fixture-process control separates readiness, execution, termination, and drain clocks with
  wrong-channel and wrong-reason rejection;
- exact nested policy emission, `Pick`-based policy equality, permission provenance, ignored-only
  hooks, README doctrine, and generated lock normalization are closed;
- `@std/testing` and wildcard `@std/media-types` authority are absent from dependency authority,
  generated imports, and the lockfile;
- all 41 sanitizer-sensitive paths have final strict-first classifications: 37 are strict-clean and
  four retain only operation/resource exceptions for dependency-owned Automerge WebSocket timers;
- Commit 3 preserves `CrdtRepo.create()` Promise rejection, bounds Vite/Rolldown work behind a child
  boundary, and makes `DomMock.unpolyfill()` await every tracked close settlement;
- Git inspection of `732d17bd` verified the exact 65-path manifest, including the UI React deletion
  and discovered replacement, with the live plan and unrelated control artifacts excluded;
- final agent evidence under Deno 2.9.4 includes the exact 64-extant-file format check, focused
  lint, owner checks/tests, and a 53-package root check with zero failures;
- the human independently ran the final workspace suite before composition; its exact aggregate
  count was not returned to this session, and the later duplicate agent run was aborted at startup
  and contributes no evidence;
- the reviewer-created `.git/index.lock` is absent;
- publication-only Vite scenarios still cannot resolve unpublished `@sys/driver-vite@0.0.465` and
  remain release gates rather than local sanitizer evidence;
- bump, publication, release, coordinated canon composition, and stash retirement remain pending and
  separately human-controlled.

The preserved diagnostic stash reported two `new blank line at EOF` warnings. Its checkpoint and
handoff remain evidence only and were not reapplied over the corrected architecture.

## Commit 2 post-done review adjudication

The review cycle was deliberately blind. BMIND/MAX read canon and executed Deno 2.9.4 probes against
the frozen tree. Opus/MAX did not receive the BMIND findings first; its environment could not read
`../sys.canon/` and had no Deno binary, so its report is static and conditional. Where static
reasoning conflicts with observed runtime behavior, the live Deno evidence is authoritative. Neither
review verdict authorizes source or Git mutation.

### Arc decision

The three local commits remain the correct historical boundaries. Accepted findings repaired Commit
2 before it landed; they did not justify landing known debt followed by a fourth cleanup commit.
Commit 3 remains exclusively the strict-first 41-suite lifecycle audit. The local arc therefore
gains no item and keeps its order unchanged.

### Accepted Commit 2 blockers

1. **Nested sanitizer proof and doctrine are non-causal.**
   `fixture.facade-operation-opt-out-resource.ts` completes its pending operation in suite
   `afterAll`, while its file remains open through the strict parent boundary. The real fixture
   reports its child step as green and only the parent file leak as red. A no-write Deno probe with
   explicit child `sanitizeOps: true` and equivalent parent cleanup also returned `true` and passed.
   The fixture would therefore stay green if `sanitizeOps: false` stopped forwarding. Replace the
   false-green alarm with causal top-level facade isolation, add direct boundary proof for emitted
   step policy, and rewrite README/plan doctrine to state only behavior Deno 2.9.4 actually owns. If
   independent operation/resource enforcement at `await t.step` remains mandatory, the chosen
   architecture cannot satisfy it without forbidden custom sanitizer mechanics and must be
   revisited.

2. **Focus escapes an ignored suite handle.** `isFocused` and `markFocused` ignore the ignored/todo
   state. A late `it.only` attached to an ignored suite registers an ignored native `only` proxy,
   filters unrelated tests, and makes Deno exit nonzero even though no focused body can run.
   Outgoing Std does not register that proxy. Ignored nodes and ancestors must stop focus
   propagation, and the permanent contract must prove the control executes once with no native
   `only` failure.

3. **Core authority proof is self-hosted.** The adapter, facade subprocess contracts, sanitizer
   alarms, and root-policy assertion all execute through the adapter being proven. A regression that
   registers empty top-level suites can erase their assertions while remaining green. Add a direct
   `Deno.test` bootstrap at the leaf and make the subprocess alarm/contract capstones native Deno
   registrations.

4. **The BDD subprocess harness is not phase- or channel-causal.** It has one pre-kill deadline
   spanning startup, execution, and normal drain; accepts required markers from combined
   stdout/stderr; and calls `child.kill` without the deterministic termination fallback. Reuse one
   shared startup-marker, post-marker execution, termination, and drain control with readiness
   sourced only from streamed stdout.

5. **Rejected suite registration is not transactional.** `SuiteNode` enters the module registry
   before its callback succeeds. A caught thenable rejection leaves escaped descendant handles
   resolvable and can propagate focused state into an already registered ancestor before the
   rejected suite is attached. Registration must commit atomically or roll back the complete subtree
   and all focus effects; add an isolated escaped-handle/focus regression.

6. **Negative fixture marker provenance is incomplete.** Nested permission and timeout fixtures use
   the same marker at module scope and inside their test body, so the tests do not prove policy
   rejection occurs before body execution. Give readiness and body distinct markers and exclude the
   body marker.

### Accepted correction-quality work

- Guard top-level permission proof with the exact Deno `NotCapable` error instead of accepting every
  exception.
- Remove the tautological generic `ignored` substring assertion; retain causal body suppression and
  control execution evidence.
- Pin focused-proxy execution cardinality, including exactly one focused marker and one filtered
  original registration.
- Add the outgoing-compatible all-hooks contract for suites whose leaf registrations are all
  ignored, and anchor its reachability from native Deno proof.
- Replace the weak bidirectional structural type assertion with exact `Pick`-based equality over the
  deliberately owned Deno policy keys; continue to exclude `retry` and `repeats` explicitly as
  non-goals.
- Retain the generated lock normalization that removes stale `jsr:@std/media-types@*` residue, but
  name it in the dependency ledger rather than attributing every lock hunk to `@std/testing`.
- Retain deterministic formatter output in the changed UI Dev discovery file and the narrow,
  explanatory `require-yield` suppression on Cloudflare's deliberate throwing async generator. They
  are scoped tool closure on already-owned files, not lifecycle remediation or broad baseline churn.

### Rejected, deferred, or consolidated review items

- Opus's claim that per-signal isolation is already causal is rejected by direct Deno 2.9.4 runtime
  evidence; its `READY WITH NON-BLOCKING FOLLOW-UP` verdict is not accepted.
- Duplicate top-level names are accepted by the executing pinned Deno and the focused fixture runs;
  the remaining exact-cardinality gap is accepted above rather than treated as an unknown runtime
  blocker.
- Module isolation is intentionally detected by executable contract and owned by pinned Deno; the
  adapter must not invent a reset scheduler.
- `Bdd.TestSuite<T>` is phantom in outgoing Std 1.0.20 as well; cross-instantiation assignability is
  source compatibility, not a new widening.
- Root `dry` is a publication dry-run across packages and remains outside this commit's local
  authority validation while the recorded Vite publication dependency is unavailable. It remains a
  release/publication gate, not a reason to weaken or bypass dependency resolution.
- Opus's discovery-file scope concern is rejected: retaining formatter output and one local lint
  suppression keeps changed files canonically clean without altering runtime behavior or beginning
  lifecycle remediation.
- The six compatibility discoveries and all 35 restored exception paths remain Commit 3 lifecycle
  debt, not review corrections.
- `retry`/`repeats`, global-hook wrapper policy behavior, and custom sanitizer mechanics remain the
  explicit non-goals already recorded by this plan.

### Correction order and reopened proof

1. Add the narrow red regressions for ignored focus, transactional registration, native proof
   reachability, marker provenance, and causal sanitizer isolation.
2. Build one private deterministic fixture-process control and route both sanitizer and BDD child
   harnesses through it without changing their domain assertions.
3. Correct adapter focus/transaction behavior and align sanitizer doctrine with observed Deno
   ownership.
4. Keep discovery changes bounded to compatibility policy plus deterministic formatter/lint closure,
   and record the generated lock normalization.
5. Run the narrow adapter, harness, policy, and type contracts first; then package, template,
   dependency, formatting/lint, root check, full workspace, final matrix, exact-manifest, unchanged
   35-path, and retained-process gates.
6. Update this ledger with the corrected manifest and exact final evidence before any renewed
   readiness judgment.

## Pre-implementation tree reconstruction

The GM review selected a migration-only named stash checkpoint followed by reconstruction from a
human-authorized pre-migration `HEAD`. This is safer than all alternatives:

- do not land the known false-green Node-authority state;
- do not continue Commit 1 on a tree where its “default authority unchanged” premise is already
  false;
- do not stash the whole workspace and capture unrelated plans, artifacts, or dependency work;
- do not discard the first-pass functional evidence.

Checkpoint subject:

```text
checkpoint(testing): pre-hardening node-test migration experiment
```

Checkpoint scope is exactly:

- the original 35 sanitizer-sensitive paths listed in Thread C's restored subsections;
- `code/-tmpl/src/-tests/-repo.integration.test.ts`;
- `code/sys/std/src/m.Testing/-.test.ts`;
- `code/sys/std/src/m.Testing/libs.ts`;
- `code/sys/std/src/m.Testing/t.ts`;
- `code/sys/testing/README.md`;
- `code/sys/types/deno.json`;
- `code/sys/types/src/-test/mod.ts`;
- `code/sys/types/src/-test/t.Bdd.ts`;
- `deno.json`, `deno.lock`, `deps.yaml`, and `imports.json`.

Explicit exclusions are this plan, every unrelated `sys` path, and the separate `sys.canon` working
tree. The checkpoint is diagnostic evidence and must not later be applied wholesale over the final
architecture.

- [x] Human authorized the exact checkpoint action and identified
      `c72d5eef59fc7e5c2a7b683f4a035573b87e04b6` as the recovery baseline.
- [x] Appended the canonical stash audit entry and created its matching handoff note without
      rewriting existing checkpoint history.
- [x] Captured only the scoped tracked paths and untracked `t.Bdd.ts`; kept this plan visible.
- [x] Verified the `sys` index remained empty and every unrelated path remained present.
- [x] Verified all scoped paths returned to the authorized baseline and all 35 original per-signal
      option sets were restored.
- [x] Recorded stable stash `fd6c018c0416f3f328431bbe985449326cbcf35e`, the recovery commit, and
      post-checkpoint tree facts here.
- [x] Left the one-line `sys.canon` change untouched until coordinated canon completion.

The checkpoint remains retained evidence until the final implementation no longer needs it. Apply
nothing from it without path-level review and explicit Git authorization; use `git stash apply`,
never `pop`, if restoration is ever deliberately required.

**Tree-reconstruction gate: green.** The checkpoint is auditable, the migration implementation
surface is back at the authorized baseline, the plan remains visible, unrelated work is unchanged,
and no false-green migration commit landed. Commit 1 may begin only after a clear implementation
instruction.

## Single plan authority

This file is the sole planning, adjudication, work-state, commit-arc, and release-gate authority for
the campaign. Source, tests, README, configuration, generated dependency outputs, template proof,
and canon are implementation outputs named by this plan. They must not become competing plans.

If evidence changes a decision, update this file before implementation continues. Do not create a
second sanitizer, adapter, remediation, canon, or release plan.

## Goal

Remove deprecated `@std/testing/bdd` authority before its 2.0 deletion while preserving the stable
public BDD vocabulary and restoring explicit Deno-native execution policy.

The final authority chain is:

```text
@sys/testing and @sys/std/testing
  → @sys/types/testing (one dependency-leaf registration adapter)
  → Deno.test / Deno.TestContext.step
  → Deno execution, sanitizer, permission, timeout, diagnostic, and reporting authority
```

`node:test` remains Deno's built-in Node-compatible alternative. It requires no installed Node.js
runtime, npm package, or JSR dependency, but it is not the default authority because Deno
intentionally registers its tests with all three sanitizers disabled.

## Non-negotiable invariants

1. Preserve `describe`, `it`, `beforeAll`, `beforeEach`, `afterEach`, `afterAll`, Chai `expect`,
   `expectTypeOf`, `expectError`, `Testing`, and `Testing.Bdd`.
2. Preserve the outgoing `@sys/std`-derived BDD callable contract where already exposed: synchronous
   suite registration, async bodies/hooks, suite handles, options overloads, callback `this`, and
   `Deno.TestContext` test-body access.
3. Preserve `skip`, `ignore`, and `only`; retain `todo` as an explicit adapter extension with the
   deliberately documented semantics below.
4. Preserve nested suites, deterministic hook order, teardown-on-failure, useful Deno reporting, and
   registration-time error attribution.
5. Deno owns operation, resource, timer, and exit tracking. The adapter never reimplements
   sanitizers.
6. Operation/resource policy is explicitly strict for workspace tests; runtime defaults are not
   policy.
7. Exit sanitization stays at Deno's per-registration default `true` unless a local audited test
   explicitly opts out.
8. Every opt-out is local, per-signal, evidence-backed, and reviewable.
9. No deprecated `@std/testing/bdd` dependency, frozen bridge, vendored package, installed Node.js
   runtime, npm test runner, external Node executable, or subprocess runner dependency remains.
10. Every green alarm claim has a clean positive control and a deliberate expected failure.
11. No publication occurs while any commit, thread gate, inventory item, or acceptance item remains
    unresolved.

Standing testing rule:

> A test suite that has never been observed to fail for the intended reason has not proved that
> reason.

## Trigger and prerequisite

Workspace dependency commit `e03d4a9b7` upgraded `@std/testing` from `1.0.19` to `1.0.20`.
`@std/testing@1.0.20/bdd` deprecates its BDD exports for removal in 2.0.0.

The canonical MediaType prerequisite landed as
`cb95733a7 feat(std): establish canonical media-type authority`. This testing campaign remains a
separate change.

## Why the first pass was false-green

The first pass changed imports to exact `node:test` exports, removed all authored sanitizer options,
removed dependency authority, passed the 53-package check, and passed 10,934 tests. It proved broad
functional compatibility but not sanitizer coverage.

The missing negative control exposed these facts:

- Deno 2.8 changed `sanitizeOps` and `sanitizeResources` defaults to `false`.
- `--trace-leaks` enriches a sanitizer failure; it does not enable sanitizers.
- Deno's `node:test` polyfill registers top-level tests and steps with explicit
  `sanitizeExit: false`, `sanitizeOps: false`, and `sanitizeResources: false`.
- Per-registration values outrank CLI, environment, config, and module defaults.
- A deliberate child-process leak passed through `node:test` but failed through explicitly strict
  `Deno.test` with Deno-owned diagnostics.
- The outgoing Std adapter also inherited Deno's permissive defaults when policy was omitted, but
  failed correctly when explicit suite policy was supplied.

The first green result is retained as functional evidence only.

## Upstream authority

### Std migration guidance

`@std/testing@1.0.20/bdd` and denoland/std [#7208](https://github.com/denoland/std/issues/7208)
provide two sanctioned routes:

- ordinary BDD suites → `node:test`;
- policy-dependent suites → flat `Deno.test`.

The guidance explicitly states that Node suites do not accept Deno sanitizer or permission options.
`@sys/testing` requires that policy surface; the ordinary route is therefore not equivalent.

### Deno Node-compatibility decision

Deno issue [#22473](https://github.com/denoland/deno/issues/22473) records the compatibility reason:
Node's test API has no Deno sanitizers, and Node-compatible tests should not acquire Deno-only
failure behavior. Deno 2.9.4 source implements that policy with explicit sanitizer disablement.

This is not a missing Node installation or configuration mistake. It is an intentional authority
boundary.

### Deno sanitizer posture

Deno PR [#33250](https://github.com/denoland/deno/pull/33250) made operation/resource sanitizers
opt-in for ecosystem compatibility while retaining explicit config, CLI, environment, module, test,
step-inheritance, diagnostic, and leak-tracing support. Deno's own internal tests keep strict
policy. The workspace follows that internal-systems posture.

### `Deno.test` and `t.step`

Deno 2.9.4 documents both as public testing primitives. Nested `Deno.test` calls are unsupported;
`t.step` is the public nested-test primitive. No accepted scoped `t.step` deprecation was found.
Deno issue [#29787](https://github.com/denoland/deno/issues/29787) was a broad closed wish list, not
an accepted deprecation.

The adapter isolates `t.step` behind one module and contracts its behavior so a future Deno change
has one repair boundary.

## Executed evidence ledger

All current probes used Deno 2.9.4 stable on the workspace task/config surfaces. Temporary probe
files were removed after execution.

- Bare `Deno.test` deliberate leak with omitted policy passed: runtime op/resource defaults are off.
- Explicitly strict `Deno.test` child-process leak failed: Deno sanitizer machinery works.
- Raw `node:test` leak passed: Node compatibility is unsanitized by design.
- Raw `node:test` plus CLI/module enablement passed: explicit Node registration wins.
- `@std/testing/bdd` omitted-policy leak passed: the outgoing adapter inherited new defaults.
- `@std/testing/bdd` explicit-policy leak failed: the outgoing adapter forwarded Deno policy.
- A package timer passed before root strict config and failed afterward with `Leaks detected:`:
  member tasks inherit root policy.
- The timer still failed after adding a member `test.include` block: workspace test config merges
  per key rather than wholly shadowing root policy.
- Native Deno hooks around one test containing two steps ran once around the parent: they are not
  nested-step BDD hooks.
- Ignored and failed `t.step` calls both returned `false`: that boolean does not classify outcome.
- A parent containing a failed step failed while a later step still ran: Deno records step failure;
  the adapter must not recreate result propagation.
- Two test modules importing one mutable module each observed count `1`: current Deno isolates test
  modules.
- `--allow-run=deno` allowed `Deno.execPath()`: narrow Deno-process permission is viable.
- A 60-second leaked timer failed in about 18ms: failure exits promptly, but harness timeouts remain
  mandatory.
- `Deno.exit(0)` under default Deno-native policy failed with an exit-attempt diagnostic: exit
  sanitization defaults on.
- An explicitly retained file failed with a file-not-closed diagnostic: a deterministic resource
  control is viable.
- Repository scan found `@std/testing@1.0.20` in `deno.lock`: lock synchronization is incomplete.

## Independent review adjudication

The independent review was valuable but not copied wholesale. Its source-backed signal was
adjudicated against canon, current files, outgoing Std source, Deno 2.9.4 declarations, and the live
probes above.

The reviewer's sandbox could not traverse `../sys.canon` and had no Deno binary. Those were reviewer
environment limitations, not campaign blockers: this live session loaded the workspace and canonical
instruction sets, and executed the missing probes on Deno 2.9.4.

### Accepted

- Deno has no global `test.sanitizeExit` config key; exit policy is per registration and defaults to
  `true`.
- Native Deno hooks exist and required explicit evaluation.
- `Deno.TestStepDefinition` supports only `ignore` and the three sanitizer fields.
- Nested permissions and timeout cannot be delegated to `t.step`.
- Nested focus must be resolved by the adapter.
- `t.step` returns `false` for both ignored and failed steps and never rejects for a valid failing
  body.
- Dynamic current-suite resolution is required by cross-module `DomMock.init({ before*, after* })`
  callsites.
- The exact 35-suite inventory must be materialized, not retained only as category counts.
- `deno.lock` cleanup is incomplete.
- The alarm should live in `@sys/testing`, whose default package test already runs in CI and has
  process permission.
- Fixture processes need time bounds, stable diagnostic markers, ANSI normalization, and explicit
  wrong-reason controls.
- The full README authority section, not one sentence, must change.

### Accepted with correction

- Native Deno hooks are not an adapter replacement. The live order was
  `beforeAll, beforeEach, parent, step-one, step-two, afterEach, afterAll`; they do not wrap nested
  steps or nested BDD suites. The adapter retains hook ownership.
- `t.step`'s boolean is ambiguous, but this does not create a false-green when ignored. Deno itself
  marks a parent failed when a child step fails, while ignored steps remain non-failing. The adapter
  awaits each step and does not reinterpret its boolean. Permanent fail/skip controls lock this in.
- Member `test` blocks do not wholly shadow root test config. The permanent guard rejects explicit
  member overrides of `sanitizeOps`/`sanitizeResources`, not all member `test` blocks.
- Timer controls do not currently hang for 60 seconds; the strict timer probe exited immediately.
  Every subprocess still receives a hard timeout because future behavior must not hang CI.
- `run: ["deno"]` works with `Deno.execPath()`, but no new CI task is required. The alarm meta-test
  is part of `@sys/testing`'s normal discovered test set, so existing generated CI executes it.

### Rejected

- Moving the adapter to `@sys/std` and flattening only `@sys/types` tests is rejected. It removes
  the already published `@sys/types/testing` BDD surface, creates two testing vocabularies, and
  loses the singular leaf authority. The operational `./testing` subpath is an honest exception to
  the root package's type plane.
- The claimed inevitable `t.Bdd.Lib` declaration collision is rejected. The new contract is
  module-local to `@sys/types/testing`; it is not exported through `@sys/types/t`. `@sys/std`
  imports and composes it under its own `Testing.Bdd.Lib`; modules do not declaration-merge merely
  because both use the semantic name `Bdd`.
- Moving `src/-test/t.Bdd.ts` into the package-root `src/t/` is rejected. It is the local type spine
  of the `./testing` submodule and must not leak into the package-wide type pool.
- Removing callback `this`, `Deno.TestContext`, options overloads, hooks-as-options, anonymous
  overloads, and suite handles based only on zero local callsites is rejected. Those are already
  exposed outgoing BDD contracts. This migration changes authority, not public semantics.
- Compile-time rejection of permissions/timeout specifically when a call happens inside a suite is
  impossible with one callable `describe`/`it` surface: lexical nesting is not represented in the
  function's TypeScript type. Unsupported nested use fails clearly at runtime, matching the outgoing
  adapter's permissions behavior.
- A synthetic “seal at module-load completion” is rejected because the adapter receives no reliable
  module-completion event. Registration is synchronous; a thenable-returning `describe` fails, and
  registration after execution starts fails. Deno also enforces module-load registration.
- Reimplementing failed/ignored result classification from `t.step`'s boolean is rejected. Deno owns
  test result propagation.

## Chosen architecture

`@sys/types/testing` owns one Deno-native BDD adapter.

`@sys/types/testing` is forced by both dependency direction and public compatibility:

- `@sys/types` tests already consume their own `./testing` subpath;
- `@sys/std` depends on `@sys/types` and cannot be the leaf without a cycle or a public break;
- `@sys/types/testing` is already a runtime testing subpath, while package-root `types.ts` remains
  type-only;
- `@sys/std/testing`, `Testing.Bdd`, and `@sys/testing` can all delegate downward to one symbol set.

The adapter imports no `@sys/std` runtime helper because that would create the cycle the leaf exists
to prevent. This is a narrow foundational-layer exception: use only TypeScript/JavaScript and public
Deno primitives, do not recreate higher-level helpers, and contain all parsing/state logic within
the adapter boundary.

Use outgoing MIT-licensed Std 1.0.20 code as audited behavioral reference. Retain attribution for
materially derived implementation, but port only the existing public contract and redesign where
current Deno policy requires it. Do not vendor or import the deprecated package.

## Adapter contract

### Public values

`@sys/types/testing` owns and exports:

- `describe`;
- `it`;
- `beforeAll`;
- `beforeEach`;
- `afterEach`;
- `afterAll`;
- existing `expectTypeOf`.

`@sys/std/testing` delegates those six registration values and adds Chai `expect`, `expectError`,
and existing helpers. `Testing.Bdd` and `@sys/testing` expose the same registration symbols.

No `node:test` value or type remains in a public `@sys/*` contract.

### Registration surface

Preserve:

- name, function, options-object, and supported anonymous overloads from the outgoing facade;
- top-level and nested `describe`/`it`;
- returned suite handles and explicit suite targeting where exposed;
- body-less skipped/todo registration;
- `describe.only`, `describe.ignore`, `describe.skip`, `describe.todo`;
- `it.only`, `it.ignore`, `it.skip`, `it.todo`;
- sync suite callbacks;
- sync/async test callbacks receiving `Deno.TestContext`;
- generic callback `this` context shared across the relevant hook/test chain;
- hook registration functions and suite hook options.

Context semantics preserve the outgoing adapter:

- each top-level suite owns one suite context for its all-hooks;
- each nested suite receives a shallow context copy for its all-hooks;
- each leaf test receives a shallow context copy;
- parent/child each-hooks and the leaf body share that leaf context;
- sibling leaf-test mutations do not bleed into each other;
- all-hook context does not absorb mutations made only by a leaf test.

`todo` deliberately registers an ignored test with a visible `[todo]` name. Its body does not
execute. This is not exact Node todo reporting; it is stable adapter behavior over Deno's available
primitive.

`Deno.TestContext` remains the explicit Deno-native escape hatch. Caller-created raw steps are owned
by Deno and are not recursively wrapped as adapter BDD nodes; the enclosing suite's hooks and policy
still apply.

Do not export Std's unrelated `test`, `before`, or `after` aliases because the public facade did not
expose them.

### Policy surface

Own structural policy types rather than aliasing deprecated Std or Node types. Keep one deliberate
compile-time compatibility assertion against Deno's public definitions.

Top-level `Deno.test` supports:

- `ignore`;
- `only`;
- `permissions`;
- `timeout`;
- `sanitizeOps`;
- `sanitizeResources`;
- `sanitizeExit`.

Nested `t.step` supports only:

- `ignore`;
- `sanitizeOps`;
- `sanitizeResources`;
- `sanitizeExit`.

Rules:

1. Top-level registrations forward every supported key without adding defaults.
2. Nested sanitizer/ignore keys forward exactly when present and remain omitted when unspecified;
   Deno owns effective inheritance and enforcement. Do not claim that operation/resource leakage is
   independently settled when `await t.step(...)` resolves unless the pinned runtime proves it.
3. Nested `permissions` or `timeout` throws a clear registration/execution error; never drop it.
4. Nested `only` is adapter-owned focus selection and is not forwarded to `t.step`.
5. Unknown options fail through typing and defensive runtime validation.
6. Default registrations omit sanitizer keys so root config and Deno's exit default remain visible.

### Runtime state model

Use the smallest proven registration tree:

- identity-bearing suite nodes justify an internal class or equivalent identity handle;
- a module-local `current` pointer exists only while a synchronous `describe` callback registers its
  children;
- reject any thenable returned from `describe`, not merely native `Promise` instances;
- top-level suites register one `Deno.test`; nested suites/tests become sequential awaited steps;
- top-level `it` registers a direct `Deno.test`;
- a top-level hook registered before tests creates the historical global suite root;
- top-level hooks registered after test/suite registration fail clearly;
- registration after execution starts fails clearly;
- current-suite lookup remains dynamic so helpers such as `DomMock.init` can register hooks from a
  different module and inside nested suites;
- pass the active ancestor chain through execution calls rather than retaining one global async
  active stack;
- current Deno module isolation is contract-tested; shared-state assumptions remain localized.

Deno owns step success/failure. The adapter awaits `t.step` and ignores its boolean result. Deno's
runner marks failed child steps and their parent; ignored steps remain ignored. The adapter's tree
tracks ignore/focus only for registration and selection.

### Hook semantics

Native Deno hooks are intentionally not used for nested BDD semantics because live proof shows they
wrap the parent test once, not each step.

Preserve outgoing `@sys/std` behavior:

- `beforeAll` once before a suite's children;
- `afterAll` once after a suite's children;
- parent-to-child `beforeEach` before every leaf test;
- child-to-parent `afterEach` after every leaf test;
- multiple hooks of the same kind execute in registration order;
- `afterEach` and `afterAll` execute via `finally` after body/child failure;
- hook failures remain Deno test failures with useful attribution.

Add explicit contracts for before-hook failure, after-hook failure, nested failure, and teardown.

### Focus and modifiers

- skipped/ignored suites do not execute their registration callback, matching outgoing Std behavior;
- skipped/ignored tests do not execute their body;
- todo delegates to the ignored semantics above;
- top-level `only` forwards to `Deno.test`;
- a nested focused node marks its top-level suite focused and filters non-focused siblings within
  that tree;
- Deno's focused-test process failure remains visible;
- multiple top-level suite focus behavior is contract-tested in an isolated subprocess.

### Non-goals

Do not add snapshots, mocks, reporters, retries, repeats, concurrency controls, coverage, custom
permissions, custom timeout machinery, a scheduler, an event loop, or sanitizer mechanics.

## Runtime sanitizer policy

Root workspace policy:

```json
{
  "test": {
    "sanitizeOps": true,
    "sanitizeResources": true
  }
}
```

These lines belong to Commit 2's authority cutover. Their diagnostic version is preserved in the
checkpoint and absent from the restored baseline; Commit 2 must reintroduce them deliberately.

Deno 2.9.4 has no global `test.sanitizeExit` setting. `Deno.TestDefinition.sanitizeExit` defaults to
`true`; the adapter preserves that by omitting the key unless a caller explicitly supplies it.

Do not use `Deno.test.sanitizer()` as workspace policy. It outranks CLI/config and hides policy from
`deno.json`. It is allowed only inside self-contained Commit 1 alarm fixtures.

Do not hardcode strict defaults in the adapter. Root config is policy; the adapter forwards. The
permanent alarm guards the connection.

Precedence:

1. explicit per-registration option;
2. fixture-only `Deno.test.sanitizer()`;
3. CLI/environment/workspace config;
4. Deno runtime default.

A permanent static contract proves:

- root operation/resource settings are both `true`;
- no workspace member explicitly sets either key to `false` or another value;
- ordinary member `test` settings such as `include` remain legal because live proof showed per-key
  inheritance.

## Commit 1 burn-down: deterministic alarm controls

Commit message:

```text
test(testing): establish deterministic sanitizer alarm controls
```

Host under `code/sys/testing/src/-test/`:

- one normally discovered meta-test;
- fixture modules whose filenames do not match Deno test-discovery patterns;
- an optional targeted package task only if it delegates to the same normal test surface.

The meta-test is discovered by `@sys/testing`'s existing `deno task test`, so generated CI executes
it without workflow edits. Existing package test permissions already include `run`; do not broaden
permissions.

### Harness rules

- [x] Spawn only `Deno.execPath()`; never require Node, npm, a shell, or an external executable.
- [x] Set child `cwd` to `code/sys/testing`, proving member-package config resolution.
- [x] Give every child separate bounded startup, post-marker execution, and post-kill drain
      deadlines; report timeout and drain failures distinctly from sanitizer failure.
- [x] Stream stdout for fixture-marker readiness, capture both output channels, strip ANSI, and
      assert short stable markers plus exit status.
- [x] Assert fixture-specific stdout markers so a permission/import failure cannot masquerade as a
      sanitizer failure.
- [x] Use `Deno.exit(0)` for the exit control so unsanitized execution cannot pass by returning a
      nonzero code for the wrong reason.
- [x] Retain the leaked resource globally until fixture termination.
- [x] Use a child-process fixture whose piped stdin closes when its parent exits, preventing an
      orphan while leaving status intentionally unawaited during the test.
- [x] Keep durations typed and bounded; terminate the 60-second timeout hold after its post-marker
      500ms execution deadline.
- [x] Run the parent alarm suite with explicit strict operation/resource sanitization so its own
      child, pipe, reader, and deadline cleanup is machine-verified.
- [x] Prove the expected red result before trusting each green meta-assertion.

### Commit 1 fixture matrix

- [x] Clean async timer/operation/resource lifecycle → exit `0`.
- [x] Strict direct `Deno.test` timer leak → nonzero, `Leaks detected:` and timer marker.
- [x] Strict direct `Deno.test` retained file → nonzero, file-not-closed marker.
- [x] Strict direct `Deno.test` unawaited child status → nonzero, operation/resource marker.
- [x] Default direct `Deno.test` `Deno.exit(0)` → nonzero, exit-attempt marker.
- [x] Explicit direct `sanitizeExit: false` with `Deno.exit(0)` → exit `0` with Deno's opt-out
      warning.
- [x] Strict operation-only twin → nonzero before its opt-out is trusted.
- [x] Strict direct `Deno.test` with only `sanitizeOps: false` and an op leak → exit `0`.
- [x] Same opt-out with a resource leak → nonzero, proving per-signal isolation.
- [x] Resource-only leak with only `sanitizeResources: false` → exit `0`.
- [x] Same resource opt-out with an operation leak → nonzero, proving reverse isolation.
- [x] Strict direct leak with `--trace-leaks` → nonzero with richer origin evidence.
- [x] Explicitly unsanitized direct leak with `--trace-leaks` only → exit `0`.
- [x] Equivalent raw `node:test` leak under CLI operation/resource enablement → exit `0`.
- [x] Equivalent bare `Deno.test` leak under the same CLI enablement → nonzero, making the flags
      load-bearing.
- [x] Delayed-start, non-terminating child → post-marker execution timeout distinct from cold
      startup and sanitizer failure.

**Commit 1 gate: green in the working tree.** On the reconstructed baseline, every clean/unsanitized
control passes, every strict deliberate leak fails for its specific Deno-owned reason, and the
default BDD authority remains unchanged.

Evidence:

- expected-red timer, resource, child-operation, exit, operation-only, reverse-isolation, CLI, and
  timeout pre-marker fixtures were observed failing directly before their meta-assertions were
  trusted;
- the bare timer passed without CLI sanitizer flags and failed with both flags for the exact timer
  diagnostic before replacing the masked explicit-strict comparison;
- the final temporal MAX pass repeated that independent causal pair and made Commit 2 remove those
  transitional flags once root strict policy becomes the permanent ambient authority;
- the independent Opus implementation review's two blocking findings were substantiated: CLI flags
  had not been load-bearing, and the parent alarm suite had not sanitized its own lifecycle;
- live MAX adjudication made the CLI flags causal, enabled strict parent sanitization, bounded the
  post-kill drain, tied the timing invariant directly to its scenario, and aligned the
  operation-only-strict marker;
- a narrow timing invariant keeps the 750ms startup delay greater than its scenario's 500ms
  execution deadline; the runtime regression then proves that deadline starts only after the stdout
  fixture marker;
- targeted alarm meta-test passed repeatedly under source-invalidated cold-check, warm, and
  concurrent runs: 1 test, 17 steps, 0 failures;
- default `@sys/testing` package task passed: 21 tests, 195 steps, 0 failures, 1 ignored step;
- post-run process probes found no retained timeout or child-operation fixture process;
- fixture entrypoints remained outside default Deno discovery;
- failure reports include the executing Deno version while CI remains the single version-pin
  authority;
- package check, focused lint, and focused format checks passed;
- the strict-parent alarm matrix passed again after the full package run.

### Commit 1 composition record

**Landed:** `10e8cb8de test(testing): establish deterministic sanitizer alarm controls`.
Implementation, review, adjudication, validation, and exact-scope composition are complete.

The canonical ready check reconciled the opening item to reachable Git truth:

```text
- [x] 10e8cb8de test(testing): establish deterministic sanitizer alarm controls
```

The contract below records the exact composition boundary that was used.

**Exact implementation-commit scope:**

- `code/sys/testing/src/-test/-sanitizer-alarm.test.ts`;
- `code/sys/testing/src/-test/common.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.clean.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.exit-default.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.exit-opt-out.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.explicit-unsanitized.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.node-timer.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.operation-only-opt-out.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.operation-only-strict.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.operation-strict.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.operation-with-resource-opt-out.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.resource-only-opt-out.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.resource-strict.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.resource-with-operation-opt-out.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.timeout.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.timer-bare.ts`;
- `code/sys/testing/src/-test/fixtures/fixture.timer-strict.ts`;
- `code/sys/testing/src/-test/fixtures/u.duration.ts`;
- `code/sys/testing/src/-test/fixtures/u.markers.ts`.

Everything else is excluded. In particular, do not include this plan, `-agent/-stash.audit.md`, the
checkpoint handoff, root or package configuration, dependency manifests or generated outputs, README
changes, adapter code, the 35 restored sanitizer-sensitive suites, or `sys.canon` changes.
Plan/control-artifact lifecycle is separate from this implementation commit.

**Composition was permitted only when all of the following were true:**

1. the human explicitly authorizes staging and committing this exact Commit 1;
2. the staged path set equals the 19-path manifest above, with no deletion, rename, or extra path;
3. the staged diff leaves `@std/testing/bdd`, root sanitizer policy, dependencies, README, and all
   35 restored exception sets unchanged;
4. no testing source changed after the recorded final validation, or every affected narrow check,
   alarm run, package check/test, and process-retention probe has been repeated successfully;
5. inherited commit-signing behavior is preserved and the commit can be signed without bypass;
6. the exact subject is `test(testing): establish deterministic sanitizer alarm controls`.

**Composition remained NO-GO if any condition above was false**, if an expected-red fixture did not
fail for its exact Deno-owned diagnostic, if the strict-parent alarm or package gate was red, if a
fixture process survived, if staged scope was ambiguous, or if signing/provenance failed. Do not
weaken policy, broaden scope, bypass signing, or fold Commit 2 work into this commit to get past a
NO-GO.

Commit 1 completion did not authorize Commit 2. The human subsequently authorized Commit 2
implementation at MAX; staging and composition remain separate explicit actions.

Landed signed commit message:

```text
test(testing): establish deterministic sanitizer alarm controls

- add Deno subprocess alarms for operation, resource, timer, and exit sanitizers
- reject wrong-reason failures through stdout markers, native diagnostics, and exit status
- bound startup, execution, termination, and output-drain phases independently
- prove CLI causality, per-signal isolation, and strict parent-harness cleanup
- retain existing BDD authority and workspace sanitizer policy for the next commit
```

## Commit 2 burn-down: atomic authority cutover

Commit message:

```text
refactor(testing): establish sanitizer-strict Deno-native BDD authority
```

Commit 2 is indivisible at history composition, not implemented blindly in one attempt. Reconstruct
the target directly from the restored Std baseline; do not apply the diagnostic checkpoint
wholesale. Complete and verify the following threads in the working tree first; the human composes
the commit only after the full gate is green.

### Thread B: adapter and contract plane

- [x] Create `t.Bdd.ts` from the accepted owned contracts above; use the checkpoint draft only as
      review evidence and do not restore it wholesale.
- [x] Keep its type surface module-local to `@sys/types/testing`; do not export it from
      `@sys/types/t`.
- [x] Implement the attributed adapter under `code/sys/types/src/-test/`.
- [x] Export all six registration symbols from `code/sys/types/src/-test/mod.ts`.
- [x] Rewire `code/sys/std/src/m.Testing/libs.ts` from `@std/testing/bdd` to `@sys/types/testing`.
- [x] Replace all `@std/testing/bdd`-derived public types in `code/sys/std/src/m.Testing/t.ts` with
      the owned leaf contracts.
- [x] Compose `@sys/std`'s `Testing.Bdd.Lib` from the leaf runner surface plus `expect` and
      `expectError`; do not declaration-merge unrelated namespaces.
- [x] Keep Chai, `expectTypeOf`, `expectError`, `Testing`, and unrelated helpers unchanged.
- [x] Retain MIT attribution for materially derived Std behavior.
- [x] Run `@sys/types`, `@sys/std`, and `@sys/testing` check/test tasks after each boundary closes.

### Thread B: type contracts

- [x] Prove every public entry point exposes the same registration symbol types.
- [x] Prove body-less modifier registration is accepted.
- [x] Prove suite handles and options overloads remain source-compatible.
- [x] Prove callback `this` and `Deno.TestContext` remain available.
- [x] Prove unknown options fail at compile time.
- [x] Prove exact equality between each deliberately owned policy key/value shape and the
      corresponding `Pick` from Deno's public definitions at the one deliberate coupling point.
- [x] Do not claim nested permissions/timeout are compile-time errors; prove their runtime errors.

### Thread B: executable contracts

- [x] Shared symbol identity across `@sys/types/testing`, `@sys/std/testing`, `Testing.Bdd`, and
      `@sys/testing`.
- [x] Synchronous and asynchronous test bodies.
- [x] Nested suite order and Deno step reporting.
- [x] FIFO same-kind hooks plus parent/child each-hook order.
- [x] `afterEach`/`afterAll` after body, child-step, and hook failure.
- [x] Top-level hooks before registrations and rejection after registrations.
- [x] `describe` thenable rejection is transactional: no escaped descendant handle, focus state, or
      registry entry survives a caught rejection.
- [x] Registration after execution starts rejection.
- [x] Skip/ignore/todo body suppression and visible todo naming, including all-hooks with only
      ignored leaves and native proof that the assertions execute.
- [x] Top-level and nested only behavior in isolated subprocesses, including focus added through an
      already-registered suite handle, exact proxy cardinality, and focus suppression through an
      ignored/todo ancestor.
- [x] Failing nested `it` fails its parent while a skipped nested `it` does not.
- [x] Nested permissions and timeout fail clearly before body execution, while ignored nested
      registrations suppress unsupported policy with their bodies.
- [x] Nested sanitizer keys are emitted exactly, omitted keys remain omitted, top-level facade
      per-signal isolation is causal, and doctrine matches observed Deno 2.9.4 enforcement.
- [x] A direct native Deno bootstrap proves the adapter and subprocess capstone assertions execute.
- [x] Every negative child uses independent stdout-marker startup, post-marker execution,
      termination, and drain phases with wrong-channel and wrong-reason rejection.
- [x] Test-module state isolation.
- [x] `DomMock.init` hook registration from nested and cross-module callsites.
- [x] `TestSuite.helpers/Transform` integration, including body-less modifiers and recursive suites.

### Thread B: facade alarm extension

Extend Commit 1 through the actual `@sys/testing` facade:

- [x] after root strict policy lands, remove the transitional `--sanitize-ops` and
      `--sanitize-resources` flags from the raw-Node/bare-Deno twin; prove bare `Deno.test` fails
      while raw `node:test` passes under root policy alone, so duplicate CLI enablement cannot mask
      configuration drift;
- [x] clean lifecycle passes;
- [x] timer leak fails;
- [x] retained resource fails;
- [x] unawaited child status fails;
- [x] `Deno.exit(0)` fails;
- [x] one-signal opt-out does not disable another through a causal top-level facade boundary;
- [x] raw `node:test` remains the contrasting unsanitized control;
- [x] static root/member sanitizer-policy contract passes.

### Authority dependency and doctrine closure

- [x] Confirm no authored `@std/testing`/`@std/testing/bdd` import remains.
- [x] Confirm no default-facade `node:test` type/value remains; allow only isolated compatibility
      controls or explicitly Node-portable tests.
- [x] Keep `deps.yaml` as dependency authority.
- [x] Run `deno task lock:sync`; verify `deno.lock` drops both the direct specifier and package
      entry.
- [x] Keep the repository-template negative assertion.
- [x] Keep `code/sys/testing/README.md` “Test-runner authority” doctrine aligned with observed
      Deno-native enforcement without claiming an independently settled operation/resource step
      boundary.
- [x] Document raw `node:test` as an optional compatibility edge that needs no installed Node.js but
      is not the default authority because it disables Deno sanitizers.
- [x] Update this ledger with corrected manifest, generated lock-normalization attribution, and
      exact verification counts; do not create a completion record elsewhere.

### Commit 2 validation

Accepted corrections changed the adapter and both subprocess harnesses, so every affected gate was
rerun in order:

1. [x] Commit 1 direct alarm matrix.
2. [x] Adapter type and behavior contracts.
3. [x] Facade alarm matrix.
4. [x] Focused `@sys/types`, `@sys/std`, and `@sys/testing` check/test tasks.
5. [x] Repository-template integration proof.
6. [x] Dependency and authored-source residue scans.
7. [x] Exact migration-owned formatting and linting.
8. [x] Root 53-package check.
9. [x] Root workspace test with the restored 35 exception sets unchanged and the six strict-root
       discoveries explicit.
10. [x] Repeat the direct and facade alarm matrices after the full run.
11. [x] Record exact counts and evidence in this plan.

Final corrected evidence under Deno 2.9.4:

- focused package validation: `@sys/types` **21 tests / 64 steps**, `@sys/std` **163 / 2,143**, and
  `@sys/testing` **23 / 217** with its two intentional ignored steps, all green;
- repository-template integration: **1 test / 6 steps**, green;
- compatibility-discovery owners remain green: `@sys/process` **14/69**, `@sys/ui-dev` **18/154**,
  `@sys/driver-cloudflare` **7/43**, and `@sys/cell` **31/241**;
- root check: **53 packages, 0 failed**;
- final stable-tree workspace test: **53 packages, 11,013 tests, 50 reports, 3 not applicable**,
  green; the higher total contains both corrected proof and unrelated tests from reachable-head
  work, while `10e8cb8de..529cfde1` touched no Commit 2 manifest path;
- final post-workspace authority matrix: **3 tests, 39 steps, 0 failures** in **6s**, comprising 23
  sanitizer-alarm steps, 16 BDD-contract steps, and the root/member policy test;
- the final STIER residue pass made ignored-focus behavior explicit as modifier precedence; its
  narrow BDD rerun passed **1 test / 16 steps** in **4s**;
- a terminology and documentation pass replaced bare product shorthand with precise package names or
  implicit actors, tightened the public README, and preserved stable `SYS:*` protocol markers; the
  affected contract set passed **13 tests / 70 steps** with seven intentional ignored steps, while
  all 14 touched implementation/documentation files passed format and all 13 TypeScript files passed
  lint with only the two documented, unchanged Std baseline rules excluded;
- a TMIND canonical-primitive pass routed fixture-process bounds and cancellable deadlines through
  `Num.MAX_INT` and `Time.delay`; `Process.capture` remains intentionally unsuitable because it
  lacks stdout readiness and independent startup/execution/drain clocks, while the dependency-leaf
  adapter retains native primitives to avoid an upward `@sys/std` cycle; the two harness consumers
  passed **2 tests / 39 steps** in **6s**, and the utility passed focused format and lint;
- active dependency scans found no `@std/testing` or wildcard `@std/media-types` entry in
  `deps.yaml`, `imports.json`, or `deno.lock`; remaining source matches are only the template's
  negative assertions, adapter attribution, isolated `node:test` fixture, and README doctrine;
- fresh declared lock synchronization removed both the deprecated testing package and stale wildcard
  media-types residue; the latter is generated lock normalization, not a direct testing dependency;
- no member `deno.json` overrides root `sanitizeOps` or `sanitizeResources`;
- exact migration-owned format checks passed; 74 scoped TypeScript files linted cleanly with only
  the three documented legacy baseline rules excluded, while new correction source also passed
  focused lint without those exclusions;
- the working-tree manifest is exactly **53 paths**, the original 35 exception paths match both
  reachable `HEAD` and recovery baseline `c72d5eef`, and all six discoveries remain explicit;
- `git diff --check` passed, the Git index is empty, and no workspace runner, fixture child, or
  retained server process survived final validation.

Historical pre-review evidence under Deno 2.9.4; retained for provenance but not current readiness
authority:

- focused adapter contracts: **7 tests, 13 steps, 0 failures, 6 ignored steps**;
- `@sys/types`: **17 tests, 64 steps, 0 failures, 6 ignored steps**;
- `@sys/std`: **163 tests, 2,143 steps, 0 failures**;
- `@sys/testing`: **23 tests, 217 steps, 0 failures, 2 ignored steps**;
- repository-template integration: **1 test, 6 steps, 0 failures**;
- strict-root discovery run: **53 packages, 11,000 tests**, with exactly four red owner packages and
  six registrations; trace-leak reruns identified only the signal classes recorded under Thread C;
- discovery owner packages after local compatibility policy: `@sys/process` **14/69**, `@sys/ui-dev`
  **18/154**, `@sys/driver-cloudflare` **7/43**, and `@sys/cell` **31/241**, all green;
- root check: **53 packages, 0 skipped, 0 failed**;
- final exact-tree workspace test: **53 packages, 11,006 tests, 50 reports, 3 not applicable**, all
  green; the six-test delta from the earlier 11,000-test proof belongs to unrelated concurrent
  `@sys/cli` work and does not change the 51-path Commit 2 manifest;
- final strict post-workspace matrix: **3 tests, 39 steps, 0 failures**, comprising 23 direct/facade
  sanitizer steps, 15 BDD contract steps, and one root/member policy step;
- dependency scans found no lock/import/dependency entry and no authored import; the sole source
  match is the template's required negative assertion;
- `node:test` appears only in the README compatibility doctrine and its isolated child fixture;
- exact formatting passed; new adapter/alarm/fixture/discovery code linted cleanly. The touched
  legacy Std files retain only their pre-existing `no-namespace`, `require-await`, and
  `no-explicit-any` debt, and pass when those unchanged baseline rules are excluded;
- `git diff --check` passed, the original 35 paths produced no working-tree diff, and no child
  fixture process survived the final matrix.

### Commit 2 implementation manifest

Composition is not authorized. For any later human-authorized composition, the implementation scope
is exactly these 53 paths; the plan and unrelated workspace artifacts remain control/excluded state.
Post-done correction added one shared fixture-process utility and one transactional-registration
fixture to the prior 51-path manifest.

Authority, policy, dependency, doctrine, and template proof (10):

- `deno.json`
- `deps.yaml`
- `imports.json`
- `deno.lock`
- `code/-tmpl/src/-tests/-repo.integration.test.ts`
- `code/sys/std/src/m.Testing/-.test.ts`
- `code/sys/std/src/m.Testing/libs.ts`
- `code/sys/std/src/m.Testing/mod.ts`
- `code/sys/std/src/m.Testing/t.ts`
- `code/sys/testing/README.md`

Owned adapter and leaf contracts (7):

- `code/sys/types/src/-test/common.ts`
- `code/sys/types/src/-test/mod.ts`
- `code/sys/types/src/-test/t.Bdd.ts`
- `code/sys/types/src/-test/m.Bdd.ts`
- `code/sys/types/src/-test/-Bdd.global-hooks.test.ts`
- `code/sys/types/src/-test/-Bdd.test.ts`
- `code/sys/types/src/-test/-Bdd.types.test.ts`

Facade alarms and executable contracts (30):

- `code/sys/testing/src/-test/common.ts`
- `code/sys/testing/src/-test/u.fixture-process.ts`
- `code/sys/testing/src/-test/-sanitizer-alarm.test.ts`
- `code/sys/testing/src/-test/-sanitizer-policy.test.ts`
- `code/sys/testing/src/-test/-bdd-contract.test.ts`
- `code/sys/testing/src/-test/fixtures/u.markers.ts`
- `code/sys/testing/src/-test/fixtures/u.bdd-markers.ts`
- `code/sys/testing/src/-test/fixtures/u.bdd-isolation.ts`
- `code/sys/testing/src/-test/fixtures/fixture.facade-clean.ts`
- `code/sys/testing/src/-test/fixtures/fixture.facade-timer.ts`
- `code/sys/testing/src/-test/fixtures/fixture.facade-resource.ts`
- `code/sys/testing/src/-test/fixtures/fixture.facade-operation.ts`
- `code/sys/testing/src/-test/fixtures/fixture.facade-exit.ts`
- `code/sys/testing/src/-test/fixtures/fixture.facade-operation-opt-out-resource.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-after-hook-failure.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-before-hook-failure.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-isolation-a.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-isolation-b.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-modifiers.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-nested-failure.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-nested-focus.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-nested-permission.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-nested-skip.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-nested-timeout.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-registration-guard.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-registration-transaction.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-runtime-validation.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-top-focus.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-top-permission.ts`
- `code/sys/testing/src/-test/fixtures/fixture.bdd-top-timeout.ts`

Strict-root compatibility discoveries (6):

- `code/sys/process/src/m.process/-test/-m.Port.test.ts`
- `code/sys/process/src/m.process/-test/-u.pid.test.ts`
- `code/sys/process/src/m.process/-test/-u.port.test.ts`
- `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Bus/-.test.ts`
- `code/sys.driver/driver-cloudflare/src/m.r2/-test/-m.Files.test.ts`
- `code/sys/cell/src/m.cli/-test/-u.kill.test.ts`

Do not narrow or remove the 35 restored exception sets in Commit 2. They remain byte-unchanged
baseline policy. The six strict-root discoveries receive only the minimum diagnosed local policy so
that authority cutover stays separate from lifecycle remediation; all 41 paths move to Commit 3.

**Commit 2 gate: LANDED as
`459411c5 refactor(testing): establish sanitizer-strict Deno-native BDD
authority`.** All accepted
post-done findings were corrected, every reopened gate was green, the 35 restored exception sets
remained unchanged, and the six discoveries transferred as explicit Commit 3 debt. The landed commit
authorizes no later implementation, bump, publication, release, or canon composition.

## Commit 3 burn-down: dependent-suite sanitizer hardening

Commit message:

```text
fix(testing): narrow sanitizer exceptions across dependent suites
```

Commit 3 starts from the independently green Commit 2 authority. It changes suite lifecycle and
local policy only; it does not redesign the adapter, weaken root strictness, or change public BDD
semantics.

### Commit 3 implementation manifest (65 paths)

The review-corrected composition is exactly the following 65 code paths. The discovered UI React
test rename contributes both its tracked deletion and its discovered replacement. The live plan,
stash records, unrelated plans, and every other workspace path remain excluded control state.

#### Automerge (29)

- `code/sys.driver/driver-automerge/src/-exports/-fs/-.test.ts`
- `code/sys.driver/driver-automerge/src/-exports/-web/-.test.ts`
- `code/sys.driver/driver-automerge/src/-test/-automerge.raw.tests/-am-bytes.test.ts`
- `code/sys.driver/driver-automerge/src/-test/-automerge.raw.tests/-am-repo.test.ts`
- `code/sys.driver/driver-automerge/src/-test/-automerge.raw.tests/-fs.test.ts`
- `code/sys.driver/driver-automerge/src/-test/-automerge.raw.tests/-idb.test.ts`
- `code/sys.driver/driver-automerge/src/-test/mod.ts`
- `code/sys.driver/driver-automerge/src/-test/u.repo-cleanup.ts`
- `code/sys.driver/driver-automerge/src/m.Cmd/-test/-u.attachHost.test.ts`
- `code/sys.driver/driver-automerge/src/m.Cmd/-test/-u.fromRepo.test.ts`
- `code/sys.driver/driver-automerge/src/m.Crdt.Ref/-test/-.test.ts`
- `code/sys.driver/driver-automerge/src/m.Crdt.Ref/-test/-events.test.ts`
- `code/sys.driver/driver-automerge/src/m.Crdt.Ref/-test/-marks.test.ts`
- `code/sys.driver/driver-automerge/src/m.Crdt.Repo/-test/-.test.ts`
- `code/sys.driver/driver-automerge/src/m.Crdt.Repo/-test/-events.network.test.ts`
- `code/sys.driver/driver-automerge/src/m.Crdt.Repo/-test/-events.prop.test.ts`
- `code/sys.driver/driver-automerge/src/m.Crdt.Repo/-test/-events.ready.test.ts`
- `code/sys.driver/driver-automerge/src/m.Crdt.Repo/-test/-events.test.ts`
- `code/sys.driver/driver-automerge/src/m.Crdt.Repo/-test/u.fixture.events.ts`
- `code/sys.driver/driver-automerge/src/m.Crdt.Repo/u.toRepo.ts`
- `code/sys.driver/driver-automerge/src/m.Crdt/-test/-data-types.test.ts`
- `code/sys.driver/driver-automerge/src/m.Crdt/-test/-m.Is.test.ts`
- `code/sys.driver/driver-automerge/src/m.Crdt/-test/-u.toObject.test.ts`
- `code/sys.driver/driver-automerge/src/m.server/-.test.ts`
- `code/sys.driver/driver-automerge/src/m.server/u.print.ts`
- `code/sys.driver/driver-automerge/src/m.worker/-test.u/u.testHelpers.ts`
- `code/sys.driver/driver-automerge/src/m.worker/-test/-u.client.proxy.doc.test.ts`
- `code/sys.driver/driver-automerge/src/m.worker/-test/-u.client.proxy.repo.test.ts`
- `code/sys.driver/driver-automerge/src/m.worker/-test/-u.host.repo.attach.test.ts`

#### Other dependent owners (36)

- `code/sys.driver/driver-cloudflare/src/m.r2/-test/-m.Files.test.ts`
- `code/sys.driver/driver-deno/src/m.cloud/m.DenoDeploy/m.deploy/-test/-.test.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/-test/-.test.ts`
- `code/sys.driver/driver-monaco/src/ui/ui.MonacoEditor/-.test.ts`
- `code/sys.driver/driver-vite/src/common/libs.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/-test/-u.load.test.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test.external/-baseline.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test.external/-ui-baseline.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test.external/-ui-components.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test.external/u.fixture.build.child.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test.external/u.fixture.build.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test.external/u.fixture.perf.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test/-published-fixture-lifecycle.test.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test/fixture.strict-in-process-build.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test/u.bridge.fixture.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test/u.fixture-process.ts`
- `code/sys.ui/ui-css/src/m.WebFont/-.test.ts`
- `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Bus/-.test.ts`
- `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Bus/Bus.Controller.ts`
- `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Ctx/-.test.tsx`
- `code/sys.ui/ui-react/src/m.testing.server/-test/-.test.ts`
- `code/sys.ui/ui-react/src/m.testing.server/-test/-u.render.test.tsx`
- `code/sys.ui/ui-react/src/m.testing.server/-test/-u.renderHook.ts` (delete)
- `code/sys.ui/ui-react/src/m.testing.server/-test/-u.renderHook.test.ts` (add)
- `code/sys/cell/src/m.cli/-test/-u.kill.test.ts`
- `code/sys/cell/src/m.cli/-test/u.fixture.kill.ts`
- `code/sys/process/src/m.process/-test/-m.Port.test.ts`
- `code/sys/process/src/m.process/-test/-u.pid.test.ts`
- `code/sys/process/src/m.process/-test/-u.port.test.ts`
- `code/sys/std/src/m.Is/-test/-u.browser.test.ts`
- `code/sys/std/src/m.Testing.DomMock/-test/-.test.ts`
- `code/sys/std/src/m.Testing.DomMock/-test/-m.Keyboard.test.ts`
- `code/sys/std/src/m.Testing.DomMock/-test/-u.polyfill.test.ts`
- `code/sys/std/src/m.Testing.DomMock/t.ts`
- `code/sys/std/src/m.Testing.DomMock/u.init.ts`
- `code/sys/std/src/m.Testing.DomMock/u.polyfill.ts`

**Composition record:** `732d17bdcedc22cc9e130a74bf788d00dd992546` contains this exact 65-path
manifest. Git name-status inspection verified the UI React delete/add pair and found no extra path,
deletion, rename, plan, stash record, or unrelated workspace artifact.

### Thread C: audit all 41 sanitizer-sensitive suites

The first 35 paths are known from the diagnostic edit ledger. Their original per-signal option sets
were removed during that pass and restored by returning every path to recovery commit
`c72d5eef59fc7e5c2a7b683f4a035573b87e04b6`. Commit 2's first strict-root workspace run discovered
six more paths that had no authored exception under the formerly permissive root. Before audit:

- [x] Confirmed all 35 paths returned byte-for-byte to the recovery commit.
- [x] Record the recovery commit and original keys beside every path below.
- [x] Do not use autonomous Git operations or treat the checkpoint as implementation authority.
- [x] Treat a missing path or unrecoverable policy as an explicit blocker, never as implicit
      cleanup.

Strict-first audit procedure for every item:

1. run the narrow suite under the final adapter and root strict policy;
2. add `--trace-leaks` only after strict policy is active;
3. repair repository-owned cleanup first;
4. retain an exception only for an unavoidable external lifecycle;
5. document the exact signal, resource/operation class, owner, and reason beside the registration;
6. prove disabling that signal leaves the others active;
7. run the owner-package task;
8. record `strict-clean` or the exact retained exception here.

#### Std DomMock (2)

- [x] `code/sys/std/src/m.Testing.DomMock/-test/-.test.ts` — original: `sanitizeOps: false`,
      `sanitizeResources: false`; result: **strict-clean** after `DomMock.unpolyfill()` began
      closing every tracked HappyDOM window and its hook became awaitable.
- [x] `code/sys/std/src/m.Testing.DomMock/-test/-u.polyfill.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean**, including
      two-window long-timer coverage and proof that one rejected close does not poison later
      teardown.

#### UI React testing server (3)

- [x] `code/sys.ui/ui-react/src/m.testing.server/-test/-.test.ts` — original: `sanitizeOps: false`,
      `sanitizeResources: false`; result: **strict-clean** after awaited DOM teardown.
- [x] `code/sys.ui/ui-react/src/m.testing.server/-test/-u.render.test.tsx` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after explicit
      React unmount and awaited DOM teardown.
- [x] `code/sys.ui/ui-react/src/m.testing.server/-test/-u.renderHook.ts` → `-u.renderHook.test.ts` —
      original: `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after
      explicit hook unmount and awaited DOM teardown. Review found the original filename outside
      Deno discovery; the discovered replacement passes directly under strict policy and now
      participates in the owner-package lane.

#### UI Dev (1)

- [x] `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Ctx/-.test.tsx` — original:
      `sanitizeExit: false`, `sanitizeOps: false`, `sanitizeResources: false`; result:
      **strict-clean** after explicit context disposal and observable teardown; default exit
      interception is active.

#### Monaco (1)

- [x] `code/sys.driver/driver-monaco/src/ui/m.Crdt/-test/-.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after suite-owned
      repository construction moved into `beforeAll`, followed by disposal and the bounded Automerge
      throttle-tail drain.

#### Vite (4)

- [x] `code/sys.driver/driver-vite/src/m.vite.transport/-test/-u.load.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** with loader
      lifecycle owned by the suite.
- [x] `code/sys.driver/driver-vite/src/m.vite/-test.external/-baseline.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean local equivalent**
      using `vite.sample-bridge`; the publication scenario remains a release gate, while its removed
      registration exceptions cannot be executed against the unpublished package yet.
- [x] `code/sys.driver/driver-vite/src/m.vite/-test.external/-ui-baseline.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean local equivalent**
      using `vite.sample-1`; the publication scenario remains a release gate, while its removed
      registration exceptions cannot be executed against the unpublished package yet.
- [x] `code/sys.driver/driver-vite/src/m.vite/-test.external/-ui-components.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean local equivalent**
      using `vite.sample-3`; the publication scenario remains a release gate, while its removed
      registration exceptions cannot be executed against the unpublished package yet.

The publication scenarios, fixtures, and import-authority assertions remain release gates; their
registrations and shared build helper are intentionally changed. Local equivalents execute each
build in a bounded `Process.capture()` child so Rolldown-owned process signal listeners cannot
escape the fixture boundary. A separately bounded startup/execution/drain alarm proves an equivalent
in-process config load completes its build body and then fails strictly with 13 signal operations
traced to `rolldown@1.2.1` `SignalExit.load`. Child JSON crosses a dedicated `SerializedBuild` data
boundary rather than masquerading as the method-bearing `t.Vite.Build.Response`. The three external
probes still cannot resolve unavailable `@sys/driver-vite@0.0.465`; that publication fact remains a
later release gate and is not used as local sanitizer evidence.

#### Automerge (23)

- [x] `code/sys.driver/driver-automerge/src/-exports/-fs/-.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **retained minimum**
      (`sanitizeOps: false`, `sanitizeResources: false`) for dependency-owned WebSocket
      readiness/reconnect timers; repository teardown and the 110ms tail drain cannot cancel them,
      while exit policy remains active.
- [x] `code/sys.driver/driver-automerge/src/-exports/-web/-.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **retained minimum**
      (`sanitizeOps: false`, `sanitizeResources: false`) for the same dependency-owned WebSocket
      timer lifecycle; exit policy remains active.
- [x] `code/sys.driver/driver-automerge/src/-test/-automerge.raw.tests/-am-bytes.test.ts` —
      original: `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after
      tracked repo shutdown and tail drain.
- [x] `code/sys.driver/driver-automerge/src/-test/-automerge.raw.tests/-am-repo.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after tracked repo
      shutdown and tail drain.
- [x] `code/sys.driver/driver-automerge/src/-test/-automerge.raw.tests/-fs.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after
      persistence/repo disposal and tail drain.
- [x] `code/sys.driver/driver-automerge/src/-test/-automerge.raw.tests/-idb.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after
      persistence/repo disposal and tail drain.
- [x] `code/sys.driver/driver-automerge/src/m.Cmd/-test/-u.attachHost.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after command
      endpoint and repo disposal.
- [x] `code/sys.driver/driver-automerge/src/m.Cmd/-test/-u.fromRepo.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after
      worker/concrete repo disposal.
- [x] `code/sys.driver/driver-automerge/src/m.Crdt.Ref/-test/-.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after ref/repo
      disposal and tail drain.
- [x] `code/sys.driver/driver-automerge/src/m.Crdt.Ref/-test/-events.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after
      observable/ref/repo disposal and tail drain.
- [x] `code/sys.driver/driver-automerge/src/m.Crdt.Ref/-test/-marks.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after ref/repo
      disposal and tail drain.
- [x] `code/sys.driver/driver-automerge/src/m.Crdt.Repo/-test/-.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after tracked repo
      disposal, explicit cancellation of `get()` deadlines on every terminal path, preservation of
      Promise-rejection semantics for synchronous `create()` failures, and tail drain.
- [x] `code/sys.driver/driver-automerge/src/m.Crdt.Repo/-test/-events.network.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **retained minimum**
      (`sanitizeOps: false`, `sanitizeResources: false`) for dependency-owned WebSocket
      readiness/reconnect timers; suite-owned server/repos still close and exit policy remains
      active.
- [x] `code/sys.driver/driver-automerge/src/m.Crdt.Repo/-test/-events.prop.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **retained minimum**
      (`sanitizeOps: false`, `sanitizeResources: false`) for the same dependency-owned WebSocket
      timer lifecycle; suite-owned server/repos still close and exit policy remains active.
- [x] `code/sys.driver/driver-automerge/src/m.Crdt.Repo/-test/-events.ready.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** under its existing
      event/repo disposal; no lifecycle repair was required.
- [x] `code/sys.driver/driver-automerge/src/m.Crdt.Repo/-test/-events.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** under its existing
      event/repo disposal; no lifecycle repair was required.
- [x] `code/sys.driver/driver-automerge/src/m.Crdt/-test/-data-types.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after tracked repo
      disposal and tail drain.
- [x] `code/sys.driver/driver-automerge/src/m.Crdt/-test/-m.Is.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after tracked repo
      disposal and tail drain.
- [x] `code/sys.driver/driver-automerge/src/m.Crdt/-test/-u.toObject.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after tracked repo
      disposal and tail drain.
- [x] `code/sys.driver/driver-automerge/src/m.server/-.test.ts` — original: `sanitizeOps: false`,
      `sanitizeResources: false`; result: **strict-clean** under its existing explicit server
      shutdown; no suite repair was required.
- [x] `code/sys.driver/driver-automerge/src/m.worker/-test/-u.client.proxy.doc.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after deterministic
      port/repo cleanup and timer-free adapters.
- [x] `code/sys.driver/driver-automerge/src/m.worker/-test/-u.client.proxy.repo.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after deterministic
      proxy/port/repo cleanup and timer-free adapters.
- [x] `code/sys.driver/driver-automerge/src/m.worker/-test/-u.host.repo.attach.test.ts` — original:
      `sanitizeOps: false`, `sanitizeResources: false`; result: **strict-clean** after deterministic
      host/port/repo cleanup and timer-free adapters.

The four retained registrations were reproduced under strict policy and traced to
`@automerge/automerge-repo-network-websocket@2.5.6` readiness/reconnect timers. Review tracing first
exposed one repository-owned Rx debounce interval; binding it to server disposal removed that tail,
after which the strict trace contained only five dependency timers. Either single-signal opt-out
still reports those five timers, so the operation/resource pair is the local minimum. No retained
path disables exit sanitization. The other 19 Automerge paths use shared tracked-repo cleanup or an
explicitly named tail-only drain for the uncancellable 100ms throttle in
`@automerge/automerge-repo@2.5.6`.

#### Deno Deploy (1)

- [x] `code/sys.driver/driver-deno/src/m.cloud/m.DenoDeploy/m.deploy/-test/-.test.ts` — original:
      `sanitizeResources: false`; result: **strict-clean** after the test cancels the served
      response body.

#### Commit 2 strict-root discoveries (6)

These registrations had no authored sanitizer option at the Commit 1 boundary. Commit 2 added the
minimum compatibility policy needed to preserve the authority cutover; Commit 3 repaired each
repository-owned lifecycle and removed that temporary policy.

- [x] `code/sys/process/src/m.process/-test/-m.Port.test.ts` — original: none; Commit 2:
      `sanitizeResources: false`; strict evidence: retained child stdout; result: **strict-clean**
      after child stdout-reader cancellation.
- [x] `code/sys/process/src/m.process/-test/-u.pid.test.ts` — original: none; Commit 2:
      `sanitizeResources: false`; strict evidence: retained child stdout; result: **strict-clean**
      after child stdout-reader cancellation.
- [x] `code/sys/process/src/m.process/-test/-u.port.test.ts` — original: none; Commit 2:
      `sanitizeResources: false`; strict evidence: retained child stdout; result: **strict-clean**
      after child stdout-reader cancellation.
- [x] `code/sys.ui/ui-dev/src/ui.react.devharness/u/m.Bus/-.test.ts` — original: none; Commit 2:
      `sanitizeOps: false`, `sanitizeResources: false`; strict evidence: retained Rx interval failed
      with either single-signal opt-out; result: **strict-clean** after disposal-owned subscriptions
      and `takeUntil(dispose$)` on the debounced tail.
- [x] `code/sys.driver/driver-cloudflare/src/m.r2/-test/-m.Files.test.ts` — original: none; Commit
      2: `sanitizeOps: false`, `sanitizeResources: false`; strict evidence: 24 pending MessagePort
      receives and one retained MessagePort; result: **strict-clean** after every
      `Files.Client.local()` handle is disposed.
- [x] `code/sys/cell/src/m.cli/-test/-u.kill.test.ts` — original: none; Commit 2:
      `sanitizeResources: false`; strict evidence: retained child stdout; result: **strict-clean**
      after child stdout-reader cancellation.

**Thread C gate: PASSED.** All 41 paths retain their original/Commit 2 provenance and now have
strict execution evidence plus a final classification: 37 are strict-clean and four retain the
minimum operation/resource pair. All local equivalents are green, no audited path disables exit
sanitization, and the facade alarms still fail deliberately for the expected Deno-owned reasons.

### Commit 3 independent review adjudication

An independent Opus/TMIND/XHIGH static review reopened final closure. Live Deno 2.9.4 adjudication
accepted the undiscovered render-hook test, exact-manifest, publication-wording, and ledger-accuracy
findings; preserved the Vite child boundary after reproducing 13 pending signal operations at an
in-process config-load boundary; and rejected the claim that retained Automerge timers belonged to
only one sanitizer signal. Corrective evidence now includes:

- the discovered render-hook replacement passing directly as **1 test / 2 steps** under strict
  policy;
- a bounded Vite readiness/execution/drain alarm whose build body succeeds before strict sanitizers
  trace `rolldown@1.2.1` `SignalExit.load`;
- strict and both single-signal Automerge probes reporting five dependency-owned WebSocket timers
  after the repository-owned server debounce interval was lifecycle-bound;
- restored rejected-Promise semantics for synchronous `CrdtRepo.create()` failures;
- recovery after a rejected HappyDOM close, explicitly named tail-only drains, registration-owned
  repo construction, and cleanup in assertion failure paths.

Focused re-review then found that `Promise.all` could report one rejected HappyDOM close before
another tracked close settled. The causal regression failed with
`expected true to deeply equal false`; `DomMock.unpolyfill()` now uses `Promise.allSettled`,
preserves a sole rejection, and throws `AggregateError` only for multiple close failures. Its final
strict proof passed **1 test / 7 steps**, and the full Std plus dependent UI React, UI CSS, UI Dev,
and Monaco package lanes remained green.

The review-created `.git/index.lock` was removed before final composition. Git name-status
inspection subsequently verified the exact Commit 3 scope.

### Commit 3 final validation

1. [x] Commit 1 direct alarm matrix.
2. [x] Adapter type and behavior contracts.
3. [x] Facade alarm matrix.
4. [x] Focused `@sys/types`, `@sys/std`, and `@sys/testing` check/test tasks after review
       corrections.
5. [x] All 41 inventory items with leak tracing only where strict policy reports a leak.
6. [x] Every affected owner-package task after review corrections.
7. [x] Repository-template integration proof.
8. [x] Dependency and authored-source residue scans after review corrections.
9. [x] Exact migration-owned formatting and focused lint after review corrections.
10. [x] Root 53-package check after review corrections.
11. [x] Human-owned final workspace test on the composition tree.
12. [x] Discovered direct/facade alarm suites remained connected in the final workspace lane.
13. [x] Record final evidence and landed identity in this plan.

Final Commit 3 evidence under Deno 2.9.4:

- sanitizer inventory: **41/41 classified**, comprising **37 strict-clean** paths and **four** local
  Automerge exceptions retaining only `sanitizeOps: false` plus `sanitizeResources: false`; no
  audited path retains `sanitizeExit: false`;
- the last focused authority matrix passed **3 tests / 39 steps / 0 failures**; the human-owned
  final workspace run exercised the same discovered alarm registrations on the composition tree;
- focused packages: `@sys/types` **21/64**, `@sys/std` **163/2,145**, and `@sys/testing` **23/217**,
  all green; the deliberate ignored BDD controls remain visible;
- affected owners: `@sys/ui-react` **23/92**, `@sys/ui-dev` **18/154**, `@sys/ui-css` **11/200**,
  `@sys/driver-monaco` **26/348**, `@sys/driver-vite` **59/337**, `@sys/driver-automerge`
  **51/329**, `@sys/driver-deno` **33/158**, `@sys/process` **14/69**, `@sys/driver-cloudflare`
  **7/44**, and `@sys/cell` **31/241**, with package checks and tests green;
- the final DomMock causal proof passed **1 test / 7 steps** after its observed red failure, and Std
  plus all direct UI/Monaco dependents were rerun successfully;
- repository-template integration passed **1 test / 6 steps**;
- exact formatting passed for **64 extant files**; **57** manifest files linted clean without rule
  suppression, while the full 64-file lint surfaced **36** known legacy findings confined to seven
  pre-existing suite/type files;
- dependency/source scans found no `@std/testing` authority in `deps.yaml`, `imports.json`, or
  `deno.lock`; remaining source matches are the template negative assertions, adapter attribution,
  README doctrine, and isolated `node:test` contrast fixture;
- root check passed **53 packages / 0 skipped / 0 failed** after the final DomMock source
  correction;
- the human independently ran the final workspace suite before composition. No exact aggregate count
  was supplied to this session; the last captured pre-DomMock-correction workspace count was
  **11,039 tests** and is retained only as historical evidence, not relabeled as the final count;
- a duplicate agent workspace run was aborted at startup after the human identified it as redundant;
  it contributes no validation evidence;
- Git name-status inspection verified exactly **65 committed paths**, comprising 64 extant files and
  the UI React deletion, at `732d17bdcedc22cc9e130a74bf788d00dd992546`.

Unrelated repository-wide formatting/lint debt remains baseline debt and was not rewritten into this
campaign.

**Commit 3 gate: LANDED.**
`732d17bd fix(testing): narrow sanitizer exceptions across dependent suites` contains the exact
reviewed manifest. Local implementation is complete; canon, stash, bump, publication, and release
work remain separate.

## Coordinated cross-repository completion: canonical doctrine

Commit message in the owning `sys.canon` repository:

```text
docs(canon): route testing examples through @sys/testing
```

- [ ] Verify `../sys.canon/-canon/-sys.md` uses `@sys/testing`, not deprecated Std or raw Node
      authority.
- [ ] Validate the example against the final local public export surface before publication.
- [ ] Preserve canon's own check/format requirements.
- [ ] Record completion in this plan; do not create another canon migration plan.

The canon edit is cross-repository implementation output governed by this plan, not a local `sys`
arc item. It does not require a published package to validate its import contract and must not
create a pre-release/post-release cycle.

**Canon gate:** Commit 3's final local campaign state is proven, the example matches Commit 2's
final public surface, canon-owned validation passes, and the human controls composition in the
`sys.canon` repository.

## Final acceptance criteria

- [x] The pre-hardening experiment is preserved as an audited checkpoint and never landed as the
      default authority.
- [x] Commit 1 deterministic alarm controls are independently green.
- [x] Commit 2 Deno-native authority is independently green with the restored 35 exception sets
      unchanged and six strict-root discoveries explicit.
- [x] Commit 3 narrows or justifies every sanitizer exception without changing public BDD authority.
- [x] No deprecated Std testing dependency/import remains.
- [x] `deno.lock` contains no `@std/testing` entry.
- [x] No exact `node:test` value/type is the default BDD authority.
- [x] No installed Node.js runtime, npm runner, or external Node executable is required.
- [x] All public testing entry points share one registration symbol set.
- [x] Outgoing BDD overloads, contexts, handles, hooks, and modifiers remain source-compatible.
- [x] Todo's deliberate ignored semantics are documented and proven.
- [x] Native Deno test/step execution owns result propagation and reporting.
- [x] Operation/resource policy is explicitly strict at workspace root and inherited by members.
- [x] No member explicitly weakens root operation/resource policy.
- [x] Default exit sanitization is active and proven with `Deno.exit(0)`.
- [x] Nested permissions/timeout fail clearly; no unsupported option is silently dropped.
- [x] Deliberate timer, operation, resource, exit, nested-failure, and modifier controls behave for
      the exact expected reasons through the actual `@sys/testing` facade.
- [x] Hook order, nested order, teardown-on-failure, focus, and module isolation are proven.
- [x] All 41 sanitizer-sensitive paths carry original/Commit 2 policy and final evidence-backed
      outcomes.
- [x] Every retained exception is local and per-signal.
- [x] Publication-only Vite resolution is separated from locally proven sanitizer behavior.
- [ ] README, template proof, dependency outputs, canon, and this plan describe one authority.
- [ ] The coordinated `docs(canon): route testing examples through @sys/testing` commit is complete
      in `sys.canon`.
- [x] Commit 2 focused packages, discovery owner packages, root check, and full workspace test are
      green.
- [x] Commit 3 affected owner packages, root 53-package check, and corrected workspace closure are
      green after independent review corrections.
- [x] Alarm controls remain connected through the final Commit 3 workspace lane.
- [ ] No bump/publication occurs before every preceding item is complete.

## Git and release boundary

This plan does not authorize stash, staging, commit, restore, rebase, history surgery, tag, bump,
publication, or any other Git/release mutation.

The checkpoint decision records the intended reconstruction strategy; it does not authorize the Git
action. The human operator controls checkpoint creation, staging, and final commit composition.
Readiness, green tests, and proposed subjects are not Git authorization.

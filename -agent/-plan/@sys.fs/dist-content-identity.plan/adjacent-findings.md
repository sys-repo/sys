# Dist content identity — adjacent findings, not an expanding landing scope

## Disposition

Preserve these observations; do not implement them merely because they were discovered during Dist
work. The current target remains
`feat(dist)!: unify build pins and verification on canonical content
identity`. Proposed subjects
below name future bounded work, not landed commits or implementation approval. Reinspect the future
baseline before acting.

The governing
[landing discipline](../dist-content-identity.plan.md#landing-discipline--bounded-replacement-not-adjacent-hardening)
separates current correctness, adjacent improvements and execution prerequisites. Required proofs
remain required. A blocked lane is not a pass, and parking an improvement does not authorize an
unsafe execution. Promote a parked item only for a concrete current-contract failure or a separately
agreed, named proof prerequisite—not because a larger cleanup would be desirable.

## AF-01 — Vite resolution has independent dependency-policy owners

**Future commit:** `fix(driver-vite): enforce explicit dependency policy across resolution paths`

**Owners and observations:**

- `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve/u.plugin.ts` creates the loader with
  `noLock: true`; `u.loader.ts` forwards that option to `@deno/loader`.
- The inspected installed `@deno/loader@0.5.0` source applies `cachedOnly` to npm, while its HTTP
  fetcher separately uses `CacheSetting::Use`. Frozen lock behavior is configured separately. These
  are installed-source observations, not active-WASM attestations.
- `code/sys.driver/driver-vite/src/m.vite.config/u/u.app.specifierRewrite.ts` conditionally prewarms
  npm through `deno info --json`; `m.vite.transport/u.resolve/u.npmPath.ts` has a `deno eval`
  fallback. Parent CLI arguments do not constrain these independent paths.

**Boundary:** these pre-existing execution behaviors were not caused by changing the Dist identity
preimage. No unauthorized fetch or lock mutation was observed; existing localhost-only build network
permissions remain relevant. Do not repair the entire resolver as incidental Dist work or change
ordinary developer policy to obtain green tests.

**Future acceptance:** a supported explicit policy is enforced before each applicable resolution
path, with cache-miss/lock-change refusals and unchanged ordinary-mode behavior. Preserve config and
workspace semantics, no-workspace-write boundaries, permissions and original errors. If supported
controls require an upstream dependency change, identify that prerequisite rather than patch
vendored bytes or invent a bypass. This is not a preapproved implementation design.

**Current relationship:** R3-E01 is still an execution blocker for affected proofs. Establish the
smallest compliant route or bring back a separately bounded prerequisite; do not treat all AF-01
hardening as part of the identity feature. Existing partial R3 containment changes need an explicit
keep/defer disposition before landing and do not themselves establish whole-chain containment.

Detailed source evidence is preserved in
[R3.execution-containment.design.md](./reviews/03/R3.execution-containment.design.md).
Its proposed design-review scope is parked, not a reviewer launch instruction.

## AF-02 — Vite fixture graph discovery lacks a supported cache-only command

**Future commit:** `test(driver-vite): constrain fixture dependency graph discovery`

**Owner:**
`code/sys.driver/driver-vite/src/m.vite/-test/u.bridge.fixture.ts::reachablePackageSpecifiers`.

The fixture uses `deno info --json`; R3 added frozen checking. The argument-only probe
`deno info --frozen --cached-only --help` rejected `--cached-only`. No graph lookup was executed
during that investigation. A frozen lock alone does not prohibit missing-dependency acquisition.

**Future acceptance:** supported constrained discovery retains correct fixture imports and
dependency expectations, fails truthfully on missing authority, and does not regenerate dependencies
or weaken checks. Do not substitute an unproved parser or broader imports catalog just to obtain a
green build.

**Current relationship:** the affected Vite proof remains blocked until a compliant route exists. If
a small fixture-only correction suffices, classify and prove that exact prerequisite; otherwise keep
this as a separate work item. It does not justify a general graph framework.

## AF-03 — existing bridge-fixture lint debt

**Future commit:** `refactor(driver-vite): remove bridge fixture lint debt`

**Owner:** `code/sys.driver/driver-vite/src/m.vite/-test/u.bridge.fixture.ts`.

The R3 exact-file lint run reported 11 existing diagnostics: the duplicate named-capture RegExp,
unused bindings and require-await. The inspected Git diff for that file contained only the added
`--frozen` argument. This is lint evidence, not a demonstrated runtime RegExp failure.

**Future acceptance:** exact-file lint and focused bridge behavior tests pass without suppression,
weakened assertions, changed dependency selection or accidental asynchronous scheduling changes. Do
not make unrelated lint cleanup a new content-identity acceptance requirement.

## Already recorded separately — do not duplicate

The other thread added
`refactor(dist): consolidate inventory accounting and retain build failure
causes` as the fourth
item in the governing plan. Its detailed owner split and proof remain there. This register does not
move it into the current replacement, rewrite its design, or claim it has landed. Any material
failure that actually violates the current contract still needs an explicit current-item
disposition; a future refactor is not a hiding place for an admission defect.

## Priority and stop rule

Core `@sys` correctness and composition come first. Repository `deploy/` consumers receive only the
migration needed for this contract; provisional product hardening belongs to later work. No such new
product defect is invented by this register. If provisional work, adjacent tooling or optional
polish starts driving the schedule, pause with the concrete dependency and scope decision. Record
findings; do not lose them, silently absorb them, or launch another broad review by default.

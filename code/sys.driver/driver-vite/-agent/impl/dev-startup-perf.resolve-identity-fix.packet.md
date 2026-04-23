# Packet E step 4: early remote identity collapse

## Status
Implementation-planning note for step 4.
Derived from the completed Packet E audit and findings.

## Depends on
- `./dev-startup-perf.callsite-cache-truth.md`
- `./dev-startup-perf.resolve-key-audit.packet.md`
- `./dev-startup-perf.resolve-key-audit.findings.md`

## Why this exists
The audit is complete.
We now need a narrow implementation plan before editing code.

Current evidence across at least two worlds (`@sys/ui-react-components` and `@sys/driver-automerge`) shows:
- equivalent semantic targets enter the resolve lane as both `https:/jsr.io/...` and `https://jsr.io/...`
- the malformed form is present at `resolve.request` and `resolve.miss`
- alias keys containing both forms appear only after resolution returns
- importer parent ids can preserve malformed `https:/...` vocabulary while child dependency edges are canonical `https://...`
- Packet A single-flight and settled reuse are working, but only after a fragmented first request already exists
- repeated `/sw.js` negative misses are real, but remain a secondary seam

## Step 4 headline
Collapse equivalent malformed/canonical concrete remote URL spellings at the resolver-owned concrete-remote lookup-key boundary, before inflight/settled/miss accounting and before the first expensive resolve miss is paid.

## STIER / TMIND upgrade after adversarial review
- **STIER:** keep step 4 narrow, but do not assume the malformed `https:/...` form is merely external input. First confirm where it is written.
- **TMIND:** two explanations remain compatible with the traces:
  1. malformed and canonical forms are entering from outside and must be collapsed at the expensive boundary,
  2. malformed forms are being produced by driver wrapping/provenance machinery and must be stopped at the source.
- **Operational conclusion:** step 4 still stands, but it begins with one small causal-source check before code lands.

## Primary implementation goal
Make these converge to one resolver lookup-key identity within the same cwd authority world:
- `https:/jsr.io/...`
- `https://jsr.io/...`

## Non-goals
Do not mix any of these into step 4:
- persistent resolve cache
- repeated negative miss caching for `/sw.js`
- transform cache work
- Vite dep-optimizer tuning
- unrelated transport cleanup
- broader URL normalization not proven by the trace

## Planned implementation shape
This is one implementation packet, but it now has three disciplined parts:

### Step 4A — causal-source check before editing behavior
Before landing the fix, confirm where `https:/jsr.io/...` is first written.

The key question is:
- does the malformed form originate in driver code (especially wrapped-specifier/provenance machinery),
- or does it enter from outside and only become expensive once it reaches the resolve-key boundary?

Primary suspicion surfaces:
- `code/sys.driver/driver-vite/src/m.vite.transport/u.specifier.ts`
- wrapped-id boundaries used by:
  - `toDenoSpecifier(...)`
  - `parseDenoSpecifier(...)`

This is not a new research phase.
It is one final causality check so step 4 does not accidentally patch a downstream symptom while leaving the writer untouched.

### Step 4B — canonical resolver lookup key before expensive resolve work
Apply a narrow canonical concrete-remote collapse before:
- request-key formation
- inflight lookup
- settled lookup
- `deno info --json ...`

This should happen in:
- `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve.ts`

This remains mandatory even if the malformed form is driver-produced, because it is the first defensive boundary against paying duplicated expensive resolve work.

The canonicalization used here must be narrow and truthful:
- repair `https:/...` → `https://...`
- repair `http:/...` → `http://...`
- preserve cwd authority in the request key
- do **not** collapse different paths, packages, versions, cwd worlds, or unrelated URL structure
- do **not** broaden into generic URL normalization

### Step 4C — conditional wrapped remote provenance cleanup
Prevent wrapped Deno importer ids from reintroducing malformed parent identity vocabulary once the equivalent canonical remote form is already known/truthful.

This likely touches:
- `code/sys.driver/driver-vite/src/m.vite.transport/u.specifier.ts`
- possibly the wrapped-id read/write boundary used by:
  - `toDenoSpecifier(...)`
  - `parseDenoSpecifier(...)`

Goal:
- importer/parent ids should stop carrying `https:/...` when the same semantic target should already be represented canonically as `https://...`

Priority note:
- step 4B is the primary perf fix and should land
- step 4C is conditional by default and should land only if:
  - step 4A confirms the malformed form is first written by driver wrapping code, or
  - failing tests / remeasurement prove malformed wrapped provenance still creates distinct work or graph-identity drift after step 4B
- if step 4A confirms the malformed form is first written by driver wrapping code, step 4C becomes causal-primary and should not be deferred behind the safety net

## Code targets
Primary:
- `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/u.specifier.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/-test/-u.resolve.test.ts`

Secondary only if forced by proof:
- `code/sys.driver/driver-vite/src/m.vite.transport/u.load.ts`

## Required helper shape
Use one shared pure helper for the narrow remote-spelling collapse.
Do not hand-inline competing regexes in multiple places.

Contract:
- only repair scheme-authority delimiter for concrete `http` / `https` URLs
- `https:/foo` → `https://foo`
- `http:/foo` → `http://foo`
- all other schemes: identity
- all other path/package/version distinctions: identity
- pure function, no side effects, no broader normalization

Reason:
- step 4B and step 4C must use the same rule or the malformed vocabulary will drift again

## Test plan
### Must-collapse test
Prove that these converge without paying duplicated first-miss work:
- `https:/jsr.io/@std/path/1.1.4/posix/resolve.ts`
- `https://jsr.io/@std/path/1.1.4/posix/resolve.ts`

Expected:
- same canonical lookup-key identity in the same cwd world
- only one expensive first miss is paid
- the equivalent canonical spelling becomes inflight-hit / settled-hit / alias-hit rather than paying a second first miss

### Concurrent malformed/canonical race test
Prove that malformed and canonical spellings entering concurrently do not both pay first-miss cost.

Expected:
- one canonical expensive resolve path wins
- the competing equivalent spelling coalesces instead of paying a second independent miss
- Packet A single-flight now protects the semantic target, not merely whichever malformed raw spelling got there first

### Must-not-collapse test
Prove that nearby but distinct targets remain distinct:
- `https://jsr.io/@std/path/1.1.4/posix/resolve.ts`
- `https://jsr.io/@std/path/1.1.4/windows/resolve.ts`

Expected:
- no over-collapse
- separate resolve work remains legitimate

### Same-remote different-cwd-world test
Prove that the same repaired remote concrete URL under different cwd authority worlds does not collapse to one lookup key.

Expected:
- cwd/world authority remains part of the key
- no global over-collapse across authority worlds

### Importer-provenance test
Prove that malformed wrapped importer ids no longer reintroduce fragmented identity for equivalent canonical child targets.

The test should be deterministic on strings/ids, not dependent on a live dev-server trace.
It should show explicitly:
- wrapped malformed parent input
- canonical child/provenance output
- request-key behavior before/after the fix

## Success criteria
After the fix and remeasurement, we want to see:
- fewer fragmented first misses for equivalent remote targets
- fewer duplicated `https:/...` / `https://...` raw identities in traces
- lower `transport.resolveDeno count`
- lower `transport.resolveDeno total`
- no regression in targeted transport tests
- meaningful outside-in startup improvement, not only prettier internal logs

## Secondary seam explicitly deferred
Repeated unresolved `/sw.js` misses are proven, but they are not part of step 4.
They are a different fault class: repeated negative-miss suppression, not remote semantic-identity collapse.
If still worthwhile after the primary fix, they belong in a separate narrow follow-up lane.

Post-step-4 remeasurement should separate `/sw.js` negative churn from remote-identity churn so a secondary miss seam does not obscure the primary fix payoff.

## Risks / watchouts
- If `https:/...` is first written by driver wrapping code, landing only the request-key guard would be a partial win and an incomplete causal fix.
- The collapse rule must be scheme-aware; `http` / `https` authority repair is justified, but broader URL rewriting is not.
- Vite-facing ids should not continue to see malformed remote spellings after step 4, or graph identity may remain split even if `deno info` work is reduced.
- The concurrent malformed/canonical race is part of the real bug and must be covered in tests, not inferred only from sequential reuse.

## Review questions
1. Is the first truthful collapse boundary correctly identified as the resolver-owned concrete-remote lookup-key boundary?
2. Does the current evidence justify treating wrapped importer-vocabulary repair as causal-primary only if the malformed form is first written there?
3. Is the narrow remote canonicalization rule sufficiently constrained to avoid over-collapse?
4. Is there any remaining evidence that the first owner seam is later than request-key formation, such that this plan would still be patching a downstream symptom?
5. Does the test plan now cover the real concurrent malformed/canonical race, first-miss suppression, and same-remote different-cwd-world guard well enough?
6. Is `/sw.js` correctly left out of step 4?

## Recommended commit message when implementation is ready
```text
perf(driver-vite): collapse equivalent remote resolve identities earlier
```

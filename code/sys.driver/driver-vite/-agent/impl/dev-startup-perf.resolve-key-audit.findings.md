# Packet E findings checkpoint: resolve provenance audit

## Status
Audit findings recorded from a representative `@sys/ui-react-components` call-site run.
This note is now the pre-implementation checkpoint for Packet E.

## Purpose
Record the first meaningful divergence, first causal owner seam, primary fault class,
and the narrowest defensible next fix shape before any Packet E implementation change.

## Inputs
- `./dev-startup-perf.callsite-cache-truth.md`
- `./dev-startup-perf.resolve-key-audit.packet.md`
- trace sample: `code/sys.driver/driver-vite/.tmp/foo.log`

## 1. Representative trace used
- call-site world: `@sys/ui-react-components`
- command / scenario: `SYS_DRIVER_VITE_PERF=2 SYS_DRIVER_VITE_TRACE_RESOLVE=1 deno task dev`, then load the browser app
- date: 2026-04-23
- trace knobs enabled:
  - `SYS_DRIVER_VITE_PERF=2`
  - `SYS_DRIVER_VITE_TRACE_RESOLVE=1`

## 2. Semantic target summary
### Dominant semantic target class: malformed/canonical remote duplicates
Representative targets observed under mixed spellings:
- semantic target: `@std/path/1.1.4/posix/resolve.ts`
  - raw spellings seen:
    - `https:/jsr.io/@std/path/1.1.4/posix/resolve.ts`
    - `https://jsr.io/@std/path/1.1.4/posix/resolve.ts`
  - request keys seen: two distinct raw-key spellings under the same cwd authority world
  - fan-in count: repeated miss + inflight reuse on malformed form; later canonical reuse also present
  - fan-out source boundary: request entry and importer provenance
  - interpretation: one semantic target is entering expensive resolve work under two raw identities before collapse

- semantic target: `@std/path/1.1.4/_common/normalize_string.ts`
  - raw spellings seen:
    - `https:/jsr.io/@std/path/1.1.4/_common/normalize_string.ts`
    - `https://jsr.io/@std/path/1.1.4/_common/normalize_string.ts`
  - request keys seen: two distinct raw-key spellings under the same cwd authority world
  - fan-in count: malformed miss observed; canonical inflight/settled reuse also observed
  - fan-out source boundary: importer provenance from malformed parent ids plus direct request entry
  - interpretation: importer/child hydration is preserving mixed vocabularies for the same semantic target

- semantic target: `@std/testing/1.0.18/_test_suite.ts`
  - raw spellings seen:
    - `https:/jsr.io/@std/testing/1.0.18/_test_suite.ts`
    - `https://jsr.io/@std/testing/1.0.18/_test_suite.ts`
  - request keys seen: malformed request key first; canonical form only appears after resolution metadata is known
  - fan-in count: first malformed miss, then malformed inflight reuse, then resolved alias keys containing both forms
  - fan-out source boundary: request entry and importer provenance
  - interpretation: alias write-back is happening after the first fragmented miss, not before it

### Secondary repeated target: negative local-like miss
- semantic target: `/sw.js` unresolved local request
  - raw spellings seen:
    - `/sw.js`
  - request keys seen: one repeated key under the same cwd authority world
  - fan-in count: repeated misses across the same run; no reuse suppression observed
  - fan-out source boundary: caller/request entry
  - interpretation: repeated negative miss churn is real, but currently looks secondary to the malformed/canonical remote fragmentation lane

## 3. Coalescing effectiveness summary
- `miss` count: present broadly for first-touch remotes and repeatedly for `/sw.js`; malformed `https:/...` forms also miss first
- `inflight-hit` count: clearly present and useful once a given raw key is already in flight
- `settled-hit` count: clearly present for canonical direct requests and `jsr:` requests after first resolution
- `alias-hit` count: alias keys are recorded after resolution, but the trace sample does not show alias reuse early enough to prevent the first malformed miss
- interpretation:
  - Packet A single-flight and settled reuse are working
  - they are not sufficient to prevent the first miss when the same semantic target enters under malformed and canonical raw spellings
  - alias collapse is real but arrives after expensive work has already been paid for the malformed first request

## 4. Divergence point
- first meaningful split observed at: resolver request entry / importer provenance, before alias write-back
- first causal owner seam: request/provenance identity entering `resolveDenoWith(...)` under mixed raw spellings
- exact raw ids involved:
  - `https:/jsr.io/@std/path/1.1.4/posix/resolve.ts`
  - `https://jsr.io/@std/path/1.1.4/posix/resolve.ts`
  - `https:/jsr.io/@std/path/1.1.4/_common/normalize_string.ts`
  - `https://jsr.io/@std/path/1.1.4/_common/normalize_string.ts`
  - `https:/jsr.io/@std/testing/1.0.18/_test_suite.ts`
  - `https://jsr.io/@std/testing/1.0.18/_test_suite.ts`
- whether `https:/...` and `https://...` were semantically equivalent in this path: yes; the malformed and canonical forms resolved to the same `actualId`, `redirected`, and final local cache path
- whether the visible split was causal or symptomatic: causal enough for Packet E; the malformed form is observed at `resolve.request` and `resolve.miss`, so this is not only a downstream formatting artifact

## 5. Must-collapse pair
- pair:
  - `https:/jsr.io/@std/path/1.1.4/posix/resolve.ts`
  - `https://jsr.io/@std/path/1.1.4/posix/resolve.ts`
- why these must collapse:
  - they resolve to the same semantic target and same final local cache path
  - current fragmented first request causes redundant expensive work before alias collapse is known
- proposed canonical boundary:
  - collapse equivalent remote URL spellings before the expensive request-key path pays first resolve work, while preserving cwd authority in the key

## 6. Must-not-collapse nearby pair
- pair:
  - `https://jsr.io/@std/path/1.1.4/posix/resolve.ts`
  - `https://jsr.io/@std/path/1.1.4/windows/resolve.ts`
- why these must remain distinct:
  - they are nearby and similarly named but represent genuinely different semantic targets and different module contents
- boundary that preserves the distinction:
  - canonicalize remote URL spelling only; do not collapse different paths, packages, versions, or cwd authority worlds

## 7. Confirmed primary fault class
Primary fault class:
- request key formed before effective canonical collapse

Contributing observed behavior:
- importer/dependency hydration reintroduces split ids
- redirect alias timing is too late to prevent the first malformed miss

Practical interpretation:
- request/provenance identity collapse happens too late; malformed and canonical remote forms enter expensive resolve work as distinct first-class requests

4A source-check refinement:
- `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve.ts` is itself a live writer boundary for malformed wrapped parent ids because `resolveViteSpecifier(...)` returns `toDenoSpecifier(resolved.loader, id, resolved.id)` using the raw incoming request `id`
- if that incoming request is malformed `https:/...`, the driver writes a malformed wrapped parent id even after resolution has already produced a truthful local file target
- `code/sys.driver/driver-vite/src/m.vite.transport/u.specifier.ts` preserves that vocabulary verbatim because `toDenoSpecifier(...)` and `parseDenoSpecifier(...)` do not canonicalize `id`
- `code/sys.driver/driver-vite/src/m.vite.transport/u.load.ts` canonicalizes child remote dependency ids through `canonicalRemoteSpecifier(...)` before re-encoding them, which explains the observed malformed-parent / canonical-child asymmetry
- that wrapped malformed parent id later re-enters the resolver through `parseDenoSpecifier(importer)` → `resolveDenoWith(parentId, ...)`, so the driver is not only preserving malformed vocabulary but feeding it back into distinct resolver lookup-key formation

Operational consequence:
- step 4B remains the mandatory defensive perf boundary
- step 4C is now causally justified in the same packet because the driver is a writer of malformed wrapped parent vocabulary

## 8. Proposed narrow fix
- target file(s):
  - `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve.ts`
  - `code/sys.driver/driver-vite/src/m.vite.transport/u.specifier.ts`
  - `code/sys.driver/driver-vite/src/m.vite.transport/-test/-u.resolve.test.ts`
- exact change shape:
  - apply canonical remote URL spelling collapse at the earliest truthful request/provenance boundary used for expensive resolve keys
  - preserve cwd in the request key
  - ensure importer/parent vocabulary does not reintroduce malformed `https:/...` raw forms when equivalent canonical `https://...` identity is already known/truthful
- why this is the smallest truthful first identity-boundary fix:
  - it targets the first proven fragmented boundary without broadening into persistent resolve cache or unrelated transform work

## 9. Rejected alternatives
- broader normalization rejected because:
  - Packet E should not broadly rewrite all identity semantics or erase real authority distinctions; only equivalent malformed/canonical remote URL spellings are justified by current evidence
- persistent resolve cache rejected because:
  - the current evidence still points first to a fragmented in-session request vocabulary problem; broad persistent resolve state would be a larger and riskier lane
- resolver-local symptom patch rejected because:
  - if collapse happens only after expensive resolve work or only after importer provenance has already drifted, the first miss still survives; the fix must target the first truthful boundary
- other alternatives rejected because:
  - repeated `/sw.js` negative miss churn is real but currently appears secondary and narrower than the malformed/canonical remote fragmentation seam

## 10. Risks / watchouts
- authority/cwd correctness risk:
  - do not erase cwd authority from the request key; only collapse equivalent remote spellings within the same authority world
- Vite module-graph identity risk:
  - if earlier canonicalization changes ids visible to Vite-facing boundaries, verify that no duplicate-node or graph-split behavior is introduced
- user-visible startup payoff risk:
  - internal resolve-count reduction must still produce meaningful outside-in startup improvement; otherwise Packet E should be judged a false win
- other:
  - repeated `/sw.js` negative misses should be recorded as a secondary seam and may justify a follow-up lane if they remain noisy after the primary identity-boundary fix

## 11. Post-fix outcome
Implementation and validation result:
- the Packet E fix landed as a narrow shared concrete-remote authority-delimiter repair across:
  - resolver lookup-key formation in `u.resolve.ts`
  - wrapped Deno specifier write/read boundaries in `u.specifier.ts`
  - browser/dev wrapped-id emission in `u.load.ts`
- deterministic tests now cover:
  - must-collapse malformed/canonical pair
  - concurrent malformed/canonical race
  - must-not-collapse nearby distinct targets
  - same-remote different-cwd-world guard
  - importer-provenance repair
  - browser/dev wrapped-id repair

Proof-world remeasurement:
- world A: `@sys/ui-react-components`
  - trace file: `code/sys.driver/driver-vite/.tmp/trace-3/A.log`
  - malformed `https:/jsr.io` request/importer vocabulary after the fix: none observed
  - sampled `transport.resolveDeno` tail: `count=7 total=491`
- world B: `@sys/driver-automerge`
  - trace file: `code/sys.driver/driver-vite/.tmp/trace-3/B.log`
  - malformed `https:/jsr.io` request/importer vocabulary after the fix: none observed
  - sampled `transport.resolveDeno` tail: `count=7 total=382`

Practical conclusion:
- Packet E achieved its intended effect
- the earlier partial-win risk was real but was eliminated once the browser/dev wrapped-id writer in `u.load.ts` was aligned with the same repair rule
- the remaining `/sw.js` seam stays deferred as a distinct negative-miss lane

## Exit rule
Packet E implementation is complete:
1. deterministic tests are in place for must-collapse, must-not-collapse, cwd-world, race, importer, and browser writer behavior
2. the narrow implementation change landed at the truthful expensive-boundary + writer-boundary seams
3. outside-in remeasurement in both proof worlds removed the malformed/canonical remote split from traced request/importer identity

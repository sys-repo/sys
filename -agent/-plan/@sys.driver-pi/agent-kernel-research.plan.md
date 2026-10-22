@sys.driver-pi
agent-kernel-research.plan.md
- [ ] docs(agent-kernel): assess minimal headless engine boundaries

## Purpose

Find the smallest original, headless @sys agent kernel for our own UI and isolated nodes, using
existing Cmd<T> mechanisms. The research unit produces design evidence, not an engine implementation.
The package name and implementation landing location remain undecided.

## Design direction

Phil explicitly clarified the destination: ZERO PI REUSE. No Pi runtime or type dependency, wrapper,
compatibility contract, vendored/extracted code, copied tests or hidden provider adapter in the new
kernel graph. Pi supplies reference patterns and failure cases only. The implementation must derive
from @sys requirements and conventions, not port Pi.

This supersedes the original reuse/extract/own comparison as the product decision. It does not assert
that Pi is entirely Node-bound, that replacement is universally cheaper, or that fewer lines prove
correctness. Preserve the existing working integration until a separately authorized replacement
is proved; do not change its dependency pin or security policy as part of this research.

## Supporting records

- [Design synthesis](agent-kernel-research.plan/design.md): current zero-Pi direction, minimum loop,
  ownership boundaries, invariants, provisional choices, source pointers and a proposed offline proof.
  It consolidates the second blind review supplied in conversation and the subsequent discussion.
- [Original research report](agent-kernel-research.plan/report.md): historical source assessment under
  the earlier broader question. Preserve it as evidence. Its reuse-first recommendation is NOT the
  selected direction and does not override the design synthesis or Phil's explicit constraint.

The supplied second review supports a conditional design GO, not a validated Pi replacement.
Neither research report establishes executed test results, runtime portability, provider/auth parity
or durable recovery. Proposed contract sketches are not existing APIs or implementation instructions.

## Closed upstream path and recovery evidence

Phil abandoned the upstream contribution and released-adoption path after the supplied issue
screenshot showed `davidbrai` removing `untriaged` and adding `no-action` on
[proposal #11242](https://github.com/earendil-works/pi/issues/11242). This was human triage after the
initial automatic closure, not merely the bot's `not planned` status. No explanation or qualifying
`lgtm` was recorded. No PR was submitted. No official-release adoption was completed.

The obsolete `pi-compile-cache-pr.plan.md` and `upstream-runtime-compatibility.plan.md` are removed
as abandoned workflows, not archived as successfully completed plans. Their previously committed
versions are recoverable at sys commit `31817e6ecf5e9077f92e928ab5743e8fd765632f` under the same
`-agent/-plan/@sys.driver-pi/` paths. The final evidence accumulated after that snapshot is retained
below and in the separate Pi checkout's validation receipt.

- Pi checkout: `/Users/phil/code/-oss/pi`, branch `fix/optional-compile-cache`.
- Published patch: [7e44966e33f1bc1b8060f71eca5a53fbb5fa8606](https://github.com/philcockfield/pi-mono/commit/7e44966e33f1bc1b8060f71eca5a53fbb5fa8606),
  `fix(coding-agent): tolerate runtimes without enableCompileCache`.
- Patch base: `bdd9f0399d785189eb1920255e0a5a393bb389e3`, Pi 1.3.0. Exactly the launcher generator
  and four-case regression test; no dependency or generated-artifact changes in the contribution.
- Recorded local validation: offline build, four launcher regressions, check, full suite and ten
  package consumers passed. Phil separately reported generated-CLI version, provider-free RPC and
  natural EOF shutdown under Node 22.23.3 (cache enabled/disabled) and Deno 2.9.7.
- Full receipt, including earlier failures and evidence limits:
  `/Users/phil/code/-oss/pi/.artifacts/compile-cache-validation-bdd9f0399.md`.
  Local harness: `/Users/phil/code/-oss/pi/.artifacts/compile-cache-proof.ts`.
  These ignored local artifacts are recovery aids, not durable committed proof transcripts.
- The bounded CLI result is not general Deno support, hosted CI, provider/TUI/extension proof,
  official-release acceptance or Driver-Pi adoption. No Bun proof was performed.
- Landed sys support work remains intact: `fb8b5dfdf` (`test(driver-pi): verify upstream CLI
  compatibility in isolation`) and `691bb36c9` (`fix(driver-pi): preserve Pi child exit status`).
- Historical exact-pair checks rejected Pi 0.86.1 and 0.87.1 on Deno 2.9.7 for the missing
  `enableCompileCache` export; dependency-selected Pi 0.85.1 passed the isolated host check.
  The recovery selection was not replaced by a verified official release in this work.

Cleanup changes no dependency selection, launcher, policy, OSS checkout, remote branch or issue.
There is no active PR/adoption prerequisite, polling task or appeal implied by these records.

## Minimum behavior to preserve

`input → prepare context → finalized model response → authorized serial tools → results → continue or settle`

- One active run per conversation; one independent host owner.
- Cmd submit / observe / cancel; UI observation does not own run lifetime.
- No tool execution from model previews, incomplete arguments or unvalidated final call sets.
- Cancellation is not rollback; uncertain effects are not automatically retried.
- Prepare/budget every model request; separate retained history, request projection and private
  provider continuity.
- Explicit finite limits, truthful settlement and bounded observation.
- Strict zero-Pi runtime/type/fixture dependency acceptance for the new graph.

Snapshot-only observation is provisional, not a permanent ban on Cmd event streaming. Automatic
compaction can be deferred for the first offline proof but remains a separate long-session need.
Do not grow a provider framework, extension platform or durable workflow scheduler by default.

## Park and resume

Parked at Phil's request. No further research, proof or implementation runs automatically.
The earlier embedded launch prompt is retired: it would reopen the superseded reuse comparison.

On an explicit resumption request:

1. Read this plan and the design synthesis; inspect current source rather than assuming the recorded
   sys/Pi baselines or API contracts still match.
2. Confirm the bounded offline slice and its landing location. Follow canonical human-led scaffold
   and type-first protocols before creating a real module; no speculative package creation.
3. Authorize an original scripted-model/fake-tool proof through Cmd. Its assertions cover finalization,
   cancellation, admission identity, observation/reconnect, context and uncertain outcomes.
4. Keep provider/auth and target-runtime proof distinct. Decide host lifetime and recovery requirements
   before claiming an isolated-node deployment. No real provider is required for the offline slice.

A new implementation arc requires an explicit plan-scope instruction; do not infer one from this
research item. The current checkbox records landing only. A report or design document is not evidence
that its proposed engine or proof has been implemented.

## Authority

This plan authorizes no code changes, installs, runtime migration, builds, tests, provider requests,
credential access, tool/profile-policy changes, Git mutations or upstream action. Documentation
preservation does not itself authorize Git mutation; any commit requires Phil's explicit instruction.
The upstream submission/adoption workflows are closed above. The existing launcher remains unchanged;
this is not approval to submit a PR or resume dependency adoption.

# Dist content-identity review coordination

These are review charters, not implementation plans or completed review receipts. Each
`*.review.plan.md` is a complete copyable reviewer prompt. Use a fresh session for each; do not
supply the implementing conversation, handoffs, other reports, or prior verdicts.

- Repository: `/Users/phil/code/org.sys/sys`.
- Governing artifact: `-agent/-plan/@sys.fs/dist-content-identity.plan.md`.
- Target: `feat(dist)!: unify build pins and verification on canonical content identity`.

## Start here — numbered dispatch

The human supplies this README path and one review number, `01` through `10`. Read this README, then
open the corresponding charter listed under **Parallel allocation and calibration** in this same
directory. Execute that charter's review, not a review of this README. The filename's two-digit
prefix is the dispatch key. Run only the assigned slice and write only its assigned report. Do not
run all ten reviews or read sibling reports. If the number is absent, ambiguous, or outside
`01`–`10`, ask which review to run before proceeding.

The charter supplies the calibration, concrete scope, evidence requirements, and output path. The
shared baseline, security, and runtime coordination rules below still apply.

## Review baseline and launch boundary

Baseline label: **Dist review R1**. HEAD observed while preparing these charters:
`8d97fe4088bed6764e804424b767b089ffb13cf3`.

The subject is the attributable worktree replacement, including untracked files, not HEAD alone.
This is a procedural freeze, not an immutable snapshot or a Git checkpoint. The implementer will
make no target edits during the passes. Before launching, the coordinator must ensure other writers
also leave target source, fixtures, tasks, and shared build outputs unchanged. If that cannot be
ensured, defer launch or obtain human authorization for a separate immutable review snapshot.

Each reviewer records HEAD, scoped status, staged/unstaged diff, and relevant untracked source at
entry and checks for drift at exit. A changed target invalidates affected conclusions; stop and ask
for re-baselining rather than reviewing mixed revisions. Do not infer byte stability from matching
filenames or status alone. Runtime commands that can change shared fixtures/build output are
coordinator-serialized, not independently run by parallel reviewers.

Concurrent work includes sample image links in
`code/sys.driver/driver-cloudflare/-sample/deploy/src/ui/index.html`, their assertions in
`code/sys.driver/driver-cloudflare/-sample/deploy/-scripts/-test/-ui.images.test.ts`, their asset
configuration in `code/sys.driver/driver-cloudflare/-sample/deploy/vite.config.ts`, visualizer
configuration in `code/sys.ui/ui-components/vite.config.ts`, and other domain planning documents. Do
not claim or edit those deltas as Dist migration work. They can still affect shared build evidence:
freeze relevant dependencies too, and report any interaction rather than assuming independence.
Follow dependencies outside the primary slice as needed to establish a claim; proximity and dirty
status alone do not establish attribution.

## Common review contract — read before the slice

Apply canonical **STIER and TMIND**, including BMIND's first-principles reading. Review from three
positions: an API consumer learning the contract, a maintainer changing a failure path, and a
hostile caller trying to cross an authority boundary. Quality means clarity and durable correctness,
not extra abstractions, ornate prose, maximal criticism, or a predetermined finding count.

For documentation and comments, use the brief's Tufte/Pirsig lens concretely: high explanatory
signal, visible relationships, precise language, and care for the reader's mental model. Start with
the concept and its limits, then show a minimal truthful example. Comments should explain why an
invariant or asymmetry exists, not narrate syntax. Test names and organization should teach the
contract: setup → action → observable invariant, with failure output that identifies what broke.
Require no loss of meaningful prior signal; an obsolete acceptance assertion may disappear only
because the new contract explicitly rejects it, with the applicable refusal proof identified.

1. Traverse applicable AGENTS/canon. Reconcile the governing opening arc through read-only history.
   Read the plan's contract, A–H workstreams, adversarial matrix, and completion boundary as
   requirements to test. Do not use its verification checkpoint, research verdict, handoffs, or
   prior reports as conclusions. Plans and commit subjects are evidence, not proof.
2. Assess live source, public contracts, reachable pre-change behavior, and tests. Include untracked
   source. Every reviewer owns correctness, security, readable naming/comments/docs, economical
   implementation, and defensible imports within its slice—not just whether existing tests pass.
3. The sole supported identity is `sys.dist/v2`: compact UTF-8 JSON of
   `["sys.dist/v2", [[path, canonical-sha256, byte-length], ...]]`, ordered by UTF-16 code units,
   with native escaping and no normalization, package slot, or trailing newline. Pins are exact
   independent `{ scheme, digest }` expectations. Root metadata is descriptive; covered payload
   metadata remains ordinary authenticated content. Recompute rather than trust a declared digest.
4. Keep content authority, exact-document continuity, deletion ownership, byte checksums,
   signatures, SRI, and unpinned observations distinct. Same content does not renew a document fence
   or prove publication provenance. Manifest-only admission does not verify later assets or browser
   execution.
5. Preserve bounded hostile-input admission, exact inventories, cancellation/draining, no-clobber,
   cleanup and publication truth, credentials/origin confinement, leases, and narrow dependency
   authority. No compatibility lane, old-store fallback, automatic repinning, or metadata refresh.
6. Review test economy through an invariant-to-proof map. Identify duplicate setup/assertions only
   with a concrete consolidation preserving distinct failure phases, authority boundaries, resource
   limits, lifecycle controls, and independent vectors. Reduced counts are not a goal by themselves.
   Explain when keeping separate tests is the simpler, safer design. Trace cross-package test
   imports through barrels to public owner boundaries and their real permissions; do not borrow
   downstream fixtures merely to exploit another package's runtime authority.
7. Review only. No source edits, Git mutations, dependency regeneration, publication, credentials,
   profile/permission changes, evidence rebinding, or real sample builds. Read owning `deno.json`
   before any configured task; use existing authority and frozen dependencies. A permission or
   provenance denial is a stop, never a reason to widen permissions. Do not run a task that mutates
   shared outputs in parallel. Request a serialized runtime slot with exact command and effects.
8. Return a clear verdict and prioritized findings. Each material finding needs exact path/symbol,
   executable failure or misuse sequence, violated invariant, smallest coherent correction and
   owner, and closing proof. Separate observed facts, predictions, unexecuted commands, external
   unknowns, and optional simplifications. A clean review is valid. State scope limits explicitly.

Every report must inventory inspected files and obligations, with exact evidence anchors. Map prior
load-bearing assertions to retained/replaced proof or a reasoned obsolete-contract disposition. For
each nonlocal test import, record the actual package owner, public/private surface, dependency
direction, fixture purpose, and required runtime authority; `../../` spelling alone proves nothing.
Account for added production concepts by responsibility, not line count. Unnecessary new concepts
need a concrete reduction proposal; necessary security complexity needs a clear explanation.

A review is not exhaustive merely because a suite passed. Mark uncovered obligations and unexecuted
proofs explicitly. If time, context, access, or runtime limits prevent covering the assigned slice,
return an incomplete assessment with the exact remainder, not a clean whole-slice verdict.

Reviewers may write only their uniquely assigned report under this directory. They must not read
sibling reports. If report writes are unavailable, return the report in the session; do not
improvise another IO path. Do not place findings in the governing plan.

## Parallel allocation and calibration

All recommendations use the canonical default model. Levels reflect the specific proof burden, not
file count or a prior review configuration.

- `01-contract.review.plan.md` — **high**: encoding, hostile guards, hash/signature separation.
- `02-fs.review.plan.md` — **xhigh**: admission, exact-tree IO, projection/document continuity.
- `03-server.review.plan.md` — **xhigh**: publication provenance, settlement, leases and hosting.
- `04-tools.review.plan.md` — **high**: operator inputs, deletion ownership and publication order.
- `05-cloudflare.review.plan.md` — **high**: route admission and sample selection/proof ownership.
- `06-vite.review.plan.md` — **high**: build authority, SRI seams and test dependency direction.
- `07-pi.review.plan.md` — **xhigh**: package checks, cancellation/draining and retained evidence.
- `08-downstream.review.plan.md` — **high**: producer refusal and truthful observation surfaces.
- `09-composition.review.plan.md` — **xhigh**: independent complete authority-flow falsification.
- `10-economy.review.plan.md` — **high**: sprawl, documentation and coverage-preserving test design.

Owner slices may inspect in parallel. Composition and economy also inspect independently; they do
not wait for or consume owner verdicts. Shared R2/Vite/SRI/Pi/Stripe build and browser tasks are
serialized by the coordinator. Prefer source inspection and narrow isolated proofs; a reviewer can
request broader execution rather than independently running every owner suite.

## Coordinator adjudication

Collect reports before showing findings to other reviewers. Deduplicate by failed invariant, not
wording. For every material finding, record accepted/rejected/unresolved, evidence, correction
owner, and exact closing test. Do not vote on correctness or average verdicts. Unresolved material
claims remain visible; unavailable provider/OS evidence is not repaired by extra reasoning.

After corrections, establish R2 and re-review affected owner boundaries plus the relevant
composition trace. Further blind passes require a named information gain, not a target review count.
Preserve separate document/publication/cleanup outcomes throughout adjudication. No review pass or
green local suite grants Git mutation, publication, provider acceptance, or Pi release authority.

## Minimal launcher usage

Open a fresh reviewer at the repository root and send:

```text
Read -agent/-plan/@sys.fs/dist-content-identity.plan.reviews/README.md. Run review 01. Go.
```

Change only `01` to the assigned number through `10`. No second path or implementing context is
needed. Each charter's model/title footer is a convenience copy, not another assignment. Its
adjacency follows the exact blind-review prompt contract even though Markdown formatting requests
blank lines there. The selected model/effort is a recommendation, not evidence that a tool or
reviewer is callable in this session.

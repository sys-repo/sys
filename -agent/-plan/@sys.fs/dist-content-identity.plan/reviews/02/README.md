# Dist review round 02 — focused blind review

## Dispatch

Read this README, then open and execute exactly the charter selected by `Go: N`. This is a review
assignment, not a request to review the README or draft another plan.

| Go | Charter                              | Report                          | Recommended configuration |
| -- | ------------------------------------ | ------------------------------- | ------------------------- |
| 1  | `01-fs-server.review.plan.md`        | `01-fs-server.review.md`        | gpt-6-astra • xhigh       |
| 2  | `02-tools.review.plan.md`            | `02-tools.review.md`            | gpt-6-astra • high        |
| 3  | `03-composition.review.plan.md`      | `03-composition.review.md`      | gpt-6-astra • xhigh       |
| 4  | `04-observation-docs.review.plan.md` | `04-observation-docs.review.md` | gpt-6-astra • high        |

Use a fresh session per assignment. Missing, conflicting or out-of-range IDs require clarification.
Do not run other charters, read sibling reports, or overwrite an existing report. If the assigned
report already exists, ask whether this is a new run and obtain a distinct output path.

The configurations are prospective recommendations, not runtime attestations. Review 1 couples
caller capture, lower evidence admission and lifecycle settlement; review 3 crosses real producer,
package-admission and signing boundaries. Reviews 2 and 4 have narrower failure/observation seams.
These reasoning burdens, not the number of files or a previous review's settings, set the levels.

## Target and independent authority

- Repository: `/Users/phil/code/org.sys/sys`.
- Governing artifact: `-agent/-plan/@sys.fs/dist-content-identity.plan.md`.
- Arc item: `feat(dist)!: unify build pins and verification on canonical content identity`.
- Subject: attributable live worktree behavior, including untracked source and tests; not HEAD
  alone.
- HEAD observed during preparation: `8d97fe4088bed6764e804424b767b089ffb13cf3`.

Traverse applicable AGENTS/canon. Reconcile the plan's opening arc through permitted read-only Git
history; the opening scope/filename and three arc items are the first five lines. Read only those
lines and the requirement sections named by your charter. Do not read the plan's implementation
checkpoints, research verdict, historical finding narratives, or verification-receipt sections.
Plans and commit subjects establish intended scope, not correctness.

Do not read `../01/`, implementing conversations, handoffs, prior adjudications, correction records,
preparation/recovery copies under `-tmp/`, or another review's report. Derive findings from source,
public contracts, tests, relevant reachable source history and your own bounded executions. Do not
search the whole review tree for context. If prior verdicts enter the session, disclose the
contamination instead of claiming an unqualified blind review.

## Shared invariants

The sole supported Dist scheme is `sys.dist/v2`. Content identity is SHA-256 over compact UTF-8 JSON
of `["sys.dist/v2", [[path, canonical-sha256, byte-length], ...]]`: UTF-16 code-unit path order,
native JSON escaping, exact admitted spellings, no package slot or trailing newline. Recompute the
descriptor; a downloaded digest is not its own independent expectation. Pins are exact independent
`{ scheme, digest }` records. No legacy acceptance, conversion, old-store fallback or automatic
repin.

Root package/build/signature metadata is descriptive for content identity. An inventoried package
file is ordinary authenticated payload; package policy belongs to the consumer. Keep content pins,
exact-document continuity, deletion ownership, file checksums, detached signatures, SRI and unpinned
observations distinct. Content equality does not renew document/deletion authority or prove a
separate publication winner. Manifest admission alone does not verify later payload responses.

Preserve bounded hostile-input admission, own-key fidelity, exact inventories, cancellation and read
draining, no-clobber behavior, lease ownership, credential/origin confinement, and truthful
publication/cleanup outcomes. No filesystem-race, browser-execution or provider guarantees may be
inferred from a narrower check. Apply STIER/TMIND within the slice: clear types, economical
ownership, precise names/comments and tests that teach the invariant. Fewer tests or more findings
are not goals.

## Source state and concurrent work

This is a procedural review round, not an immutable snapshot. The preparation HEAD does not identify
the dirty source bytes, and no historical execution is automatically bound to this round.

At entry, record HEAD, scoped staged/unstaged changes, relevant untracked files, and actual source,
fixture, task and dependency-authority inputs. Preserve enough content evidence, using permitted I/O
and read-only Git, to compare the material inputs at exit. Matching HEAD, filenames or status alone
is not a byte-stability check. Qualify dependency/cache/environment evidence rather than claiming a
complete reproducible-build receipt.

The coordinator and other writers must leave reviewed inputs stable while relied upon. If another
writer changes a material input, stop the affected proof and request re-baselining; do not combine
mixed revisions into a clean verdict. If stability cannot be established, name that evidence limit.
Do not stage, stash, commit, regenerate dependencies or create an alternative checkout to
manufacture a baseline. Source inspection may proceed while a runtime slot is pending, with limits
explicit.

The human's concurrent App/UI refinements are intentional. Preserve them and all unrelated dirty
work. In particular, do not edit the Cloudflare sample's `src/ui/ui.App.tsx`, HTML/CSS, image-link
fixtures, HTTP exposure work, or either sample/UI-components Vite configuration. Dirty proximity is
not Dist attribution. Follow a dependency only when needed to establish a scoped claim; if it
interacts with concurrent work, report the interaction without silently adopting or reverting it.

## Execution and write boundary

Review only. The only authored output is the assigned report beside its charter. No production/test
edits, formatting writes, Git/remote mutations, publication, credential use, permission/profile
changes, release-evidence rebinding, or real sample regeneration. Existing tests may use their own
isolated temporary fixtures after inspecting their effects; report-only does not prohibit that
normal test lifecycle. It does prohibit rewriting retained source/artifacts to obtain a pass.

Read owning `deno.json` tasks and selected permission presets before execution. Use declared tasks
with frozen/cached dependency authority where supported. A permission/provenance denial is a stop,
not a reason to expand authority or select another runtime. Do not borrow downstream-private
fixtures or another package's permissions. Follow nonlocal test imports to their actual owner and
public API.

Parallel source inspection and proven-disjoint isolated tests are permitted. All build/browser lanes
and any task that touches shared fixtures/output require an explicitly granted serialized slot from
the coordinator. A `Go` seed is not that slot. Request the exact command, owning task, outputs and
cleanup effects; do not launch Vite/Pi/SRI/Stripe builds concurrently. Prefer narrow discriminating
proofs; do not run a workspace-wide suite as a substitute for a missing branch assertion.

## Report contract

Choose one scoped verdict: **no material finding**, **changes required**, or **incomplete**. No
report alone gives landing clearance. A clean review is valid; an uncovered required boundary must
not be hidden behind a clean verdict.

Include:

1. Target, actual inspected files and source-state/attribution evidence, with entry/exit comparison.
2. An invariant-to-proof map, including load-bearing prior assertions retained/replaced or retired
   for an explicit contract reason. Identify test-path reachability and meaningful negative
   controls.
3. Prioritized material findings: exact path/symbol, executable failure or misuse sequence, violated
   invariant, smallest coherent correction and owner, and the proof that would close the finding.
4. Exact commands actually run and outcomes; separate source inspection, predicted failures,
   executed proof, unavailable slots and external unknowns. Do not copy another agent's receipts.
5. Remaining coverage, nonlocal import/permission boundaries, and optional simplifications
   separately. Say why leaving the implementation unchanged is justified where the evidence supports
   it.

Write only the assigned report, then return its path and a short verdict. If report writing is
denied, follow the governing permission-stop protocol and return the report in-session; do not
invent an alternative write surface. Never claim an unavailable review tool/model ran.

The coordinator collects all four reports before adjudication, deduplicates by invariant rather than
votes, and reopens only a concrete unresolved boundary. No automatic ten-way restart follows.

The charters' adjacent model/title opening and footer lines follow the canonical blind-review prompt
contract. Preserve that required adjacency even when Markdown formatting requests blank lines.

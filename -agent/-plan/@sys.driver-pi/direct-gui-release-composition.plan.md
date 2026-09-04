direct-gui-release-composition.plan.md
- [ ] refactor(driver-pi): collapse GUI release orchestration to direct composition

## Purpose

Make the Driver Pi GUI release call site visibly and semantically thin from the landed
ownership-migration baseline. Begin from the public package contracts available at that baseline,
not from the current Driver Pi module graph or the implementation history that produced it.

This plan is the final referenced child of
[verified-package-ui-release.plan.md](verified-package-ui-release.plan.md). That parent establishes
the ownership foundation. Its local lifecycle shape, proof matrix, and preservation decisions are
evidence to reassess, not requirements to reproduce.

## Entry assessment

Before implementation, enter DMIND and perform a fresh first-principles responsibility assessment.
Classify every surviving production responsibility as exactly one of:

- package or product policy;
- browser or terminal presentation;
- unavoidable direct call-site sequencing; or
- lifecycle or ownership machinery that belongs below Driver Pi or should no longer exist.

The assessment must answer:

- What is genuinely Driver Pi package policy?
- What is presentation rather than orchestration?
- What remains a shadow lifecycle implementation?
- Can the landed package contracts support one linear call site without local lifecycle emulation?
- If not, which exact owner contract and package must change?
- Which inherited behaviors are product-visible requirements, and which should be dropped?
- What is the strongest case for leaving the design unchanged or not building another abstraction?

The assessment must leave a concrete responsibility census and proposed endpoint shape in this plan
before review. Do not carry bridge-review conclusions forward as endpoint premises.

Assessment and review are not opening-arc items or gates. If the answer requires a lower-package
change or more than the current local item, stop and revise the opening arc under explicit
plan-scope authority before implementation.

## Hard outcome

At most three Driver Pi production modules own GUI release orchestration and package policy:

1. one obvious linear orchestration module;
2. one immutable policy and evidence module; and
3. optionally, one presentation adapter.

Existing terminal-rendering implementation and tests are excluded from this budget only while they
remain presentation-only and acquire no release ownership or lifecycle coordination. Do not satisfy
the budget by concatenating unrelated responsibilities into large files or hiding machinery behind
nested closures.

A reader must be able to see the successful path in one place:

```text
snapshot immutable Driver Pi policy
  → open a release Generation, or select the development directory directly
  → apply generation package policy when applicable
  → start the verified application host
  → apply hosted package policy
  → present and run the session
  → settle package owners in their declared order
```

The final shape has no Driver-owned:

- resource registry or mutable resource bag;
- cleanup graph or cleanup-evidence model;
- supervisor-shaped closure of flags, deferreds, and terminal arbitration;
- operation or retention registry;
- Promise transport or captured-intrinsic substrate;
- emulation of lower-owner release, retry, or settlement semantics; or
- duplicated materialization, Rooted, hosting, or package-result graph validation.

## Responsibility rule

Every retained branch must be justified by a product-visible decision. Exact compatibility with an
inherited internal sequence is not sufficient. For each non-presentation failure or race, choose one
coherent disposition:

- remove behavior that is not a product requirement;
- rely directly on the typed package owner;
- move generic ownership into its semantic package; or
- retain the smallest visible Driver Pi policy response.

Do not create a higher-level facade merely to reduce file count. If a missing lower contract is the
only coherent answer, name its owner and minimal semantics before designing its API.

## Invariants

- Release and development authority remain explicitly distinct; development never opens release
  evidence.
- Generation and hosted package admission remain independent unless the assessment establishes a
  stronger package-owned contract.
- Driver Pi does not retry or reconstruct Server-owned terminal release truth.
- Frozen evidence, package expectation, store selection, browser policy, and retained diagnostics
  remain bounded and immutable.
- No filesystem, network, subprocess, fixture, publication, or browser authority is widened.
- Generated release evidence and browser bytes do not change incidentally.
- Unrelated worktree changes and reachable history remain untouched.
- Planning, review, and completion do not authorize staging, committing, publication, or release.

## Blind review sequence

### Before implementation

After the DMIND assessment is coherent, author a fresh blind, independent architecture-review
prompt. Calibrate the pass from the live target. Give the reviewer the repository, this plan, the
landed public contracts, the hard outcome, and the exact decision to falsify, but never the
implementing transcript, bridge-review report, assessment conclusions, candidate verdict, or praise.

The reviewer must independently derive the minimum coherent endpoint, inspect every surviving
orchestration or policy responsibility by exact symbol, identify shadow lifecycle machinery, and
make the strongest evidence-based case for direct composition, a lower-owner correction, or no
further change. Require prioritized findings with concrete failure or misuse sequences, the smallest
coherent owner correction, and proof that would close each finding.

Run one primary blind pass. Add another pre-implementation pass only for named information gain:
independent replication of a disputed claim or orthogonal falsification of a demonstrated coverage
gap. Do not commission broad duplicate review for reassurance. Adjudicate every material finding in
the implementing thread. If review exposes a missing lower-owner contract or a larger coherent unit,
revise the opening arc under explicit plan-scope authority before implementation.

### After implementation

Author a separate fresh blind closure prompt against the resulting live source and proof. It must
falsify the module budget, linear happy path, responsibility census, selected product behavior,
ownership and cleanup boundaries, and absence of hidden lifecycle machinery. Do not award success
for net deletion, renamed abstractions, test volume, or exact preservation of unselected inherited
behavior. Repeat only for a named unresolved risk or deliberately different evidence surface.

## Verification

- Produce a final responsibility census for every orchestration or policy module.
- Prove the retained release and development paths and both retained package-admission boundaries.
- Prove only product-selected cancellation, presentation, and cleanup behavior; do not recreate an
  implementation-detail matrix.
- Run scoped format, lint, package test, package check, dry publication, and `git diff --check`.
- Run dependency-graph proof only if the implementation changes a package boundary.
- Report the exact production-module count and any excluded renderer paths with their presentation
  justification.

## Stop conditions

Stop and return to assessment if:

- the successful path cannot remain legible in one module;
- more than three production modules need orchestration or package-policy responsibility;
- preserving an inherited edge case recreates a supervisor, cleanup graph, or lifecycle substrate;
- a lower package must change but the opening arc still names only Driver Pi;
- meeting the file budget would require file concatenation or a speculative facade; or
- implementation would widen authority, alter generated evidence, or mix unrelated work.

## Completion

This plan completes only when the hard module budget, linear ownership story, responsibility census,
selected product behavior, package proof, and both blind review stages agree. A smaller diff or
another round of cleanup is not completion if Driver Pi still wears a shadow implementation around
package-owned lifecycles.

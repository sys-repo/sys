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

Before implementation, enter DMIND and derive the endpoint from live source and public package
contracts rather than inherited decomposition. These planning probes are body deliverables, not
implementation commits, opening-arc items, or gates.

- [ ] Census every surviving GUI-release responsibility from live source and public package contracts; for each, record the product need, truthful owner, and current mechanism.
- [ ] Derive the minimum endpoint by disposing every responsibility as retain, remove, or move; compare direct composition, one minimal lower-owner correction, and no further change.
- [ ] Record the selected design: one visible success path, ownership and settlement order, retained product behavior, rejected inherited behavior, production-module ownership, invariants, non-goals, and proof boundary.
- [ ] Blindly falsify the design from source and contracts, adjudicate every material finding, and revise the implementation arc only if the coherent change boundary differs.

The census must classify every production responsibility as package or product policy, browser or
terminal presentation, unavoidable direct call-site sequencing, or lifecycle and ownership
machinery that belongs below Driver Pi or should no longer exist. Recording a current mechanism does
not make it a preservation requirement.

The comparison must answer whether landed package contracts support one linear call site without
local lifecycle emulation, which inherited behaviors are product-visible requirements, and what the
strongest evidence-based case is for leaving the design unchanged. If a lower contract is missing,
name its exact owner and minimal semantics without designing a speculative API.

The first three probes must leave a concrete responsibility census and proposed endpoint in this
plan before independent review. Plan conclusions remain claims to falsify, not proof of themselves;
do not carry bridge-review conclusions forward as endpoint premises.

If the answer requires a lower-package change or more than the current local item, stop and revise
the opening arc only under explicit plan-scope authority before implementation.

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

After the first three DMIND probes are coherent, prepare one self-contained architecture-review
prompt for human handoff into a fresh reviewer session. Calibrate the pass from the live target and
follow the canonical blind-review prompt contract.

Give the reviewer the exact repository root, this plan and local arc item, landed public contracts,
live source and tests, reachable history, hard outcome, and decision to falsify. Because the plan
contains the responsibility census and selected design, require the reviewer to derive its verdict
independently and treat those conclusions as evidence rather than proof. Never provide the
implementing transcript, bridge-review report, prior review reports, verdicts or adjudication,
unpublished candidate conclusions, or praise.

The reviewer must independently derive the minimum coherent endpoint, inspect every surviving
orchestration or policy responsibility by exact symbol, identify shadow lifecycle machinery, and
make the strongest evidence-based case for direct composition, a lower-owner correction, or no
further change. Require a clear verdict and prioritized findings. Every material finding must name
exact source evidence, an executable failure or misuse sequence, the violated invariant, the
smallest coherent correction and owner, and the proof that would close it.

Return the report to the implementing thread for evidence-based adjudication. Accept, reject, or
defer every material finding and record only durable design, constraint, and proof consequences in
this plan; the report itself has no authority and does not become a second ledger.

Run one primary blind pass. Add another pre-implementation pass only for named information gain:
independent replication of a disputed claim or orthogonal falsification of a demonstrated coverage
gap. Do not commission broad duplicate review for reassurance. If a supported finding exposes a
missing lower-owner contract or a larger coherent unit, stop and revise the opening arc only under
explicit plan-scope authority before implementation.

### After implementation

Prepare a separate self-contained closure-review prompt for human handoff into another fresh
reviewer session. Bind it to the resulting live source and proof, not the pre-implementation verdict.
It must falsify the module budget, linear happy path, responsibility census, selected product
behavior, ownership and cleanup boundaries, and absence of hidden lifecycle machinery. Do not award
success for net deletion, renamed abstractions, test volume, or exact preservation of unselected
inherited behavior. Repeat only for a named unresolved risk or deliberately different evidence
surface, then adjudicate every material finding under the same evidence rules.

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
selected product behavior, package proof, and every material finding from both blind review stages
have supported dispositions. A smaller diff or another round of cleanup is not completion if Driver
Pi still wears a shadow implementation around package-owned lifecycles.

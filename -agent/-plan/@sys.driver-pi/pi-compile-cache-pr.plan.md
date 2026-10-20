@sys.driver-pi
pi-compile-cache-pr.plan.md
- [ ] fix(coding-agent): make compile cache initialization optional
- [ ] GATE Pi maintainers approve contributor PR submission
- [ ] GATE Human approves final PR wording and submission

## Purpose and repository ownership

This is the upstream Pi PR work plan, driven from the current `/sys` session. Keep this single
contribution plan here; do not create another plan in the OSS checkout. The `@sys.driver-pi`
directory names this plan's storage location, not the implementation package or commit destination.

Make the smallest tested launcher fix in `/Users/phil/code/-oss/pi`, then prepare the upstream PR
with the human. The first arc item is that OSS code change and its regression proof. The two gates
control PR submission, not local implementation. No `@sys/driver-pi` production code, tests,
dependencies, or launch behavior are to be changed in this PR thread.

Originating call site and technical contract:
[upstream-runtime-compatibility.plan.md](./upstream-runtime-compatibility.plan.md), section 4. That
plan retains the observed failure, official-source evidence, proposed launcher semantics, and
Node/Deno proof requirements. This plan owns the upstream work sequence, commit arc, and submission
decisions. The originating plan references this one as a prerequisite; this backlink is context, not
a reverse prerequisite.

Implementation and submission destinations:

- Checkout: `/Users/phil/code/-oss/pi`.
- Upstream repository: `https://github.com/earendil-works/pi`.
- Contribution branch: `fix/optional-compile-cache`, created from updated local `main`.
- Production target: `/Users/phil/code/-oss/pi/scripts/build-coding-agent-bundle.mjs`, `cliLauncher`.
- PR base: `earendil-works/pi`, `main`.
- PR head: the human's contribution branch; confirm the submitting account and fork destination
  before any fork creation, remote configuration, or push. No fork is assumed to exist.

The human created the contribution branch and subsequently fast-forwarded it from upstream `main`.
The selected source base is `6fb2e7815167e6b19006fc526d1a5d0f5f998787`, with coding-agent package
version `1.1.0`. The earlier `cb7969d212836b8939001dce159fbd2ed6ad395f` / `0.87.1` checkout is
historical context, not the implementation base. Verify branch and base before editing; do not
repeat completed Git operations or automatically chase a moving `main`.

Setup provenance: the human installed Node `22.23.3` through `n`, with bundled npm `10.9.9`, then
ran `npm ci --ignore-scripts`, `npm run hydrate:model-data`, and `npm run build:offline` against the
updated checkout. The reported successful build emitted 78 bundle files / 8.7 MiB. Read inspection
confirmed the generated `packages/coding-agent/dist/bundle/cli.js` still contains the unconditional
named import and call. The tracked worktree was clean at reconciliation. These are setup/source
observations, not Deno failure reproduction, post-fix proof, or a released-artifact acceptance claim.

Root installation and model hydration are build prerequisites, not contribution changes. Keep
Node's declared `>=22.19.0` engine floor and npm's installed version; do not upgrade tooling, repair
audit findings, regenerate tracked catalogs, or alter lockfiles as part of this launcher PR. Human
execution of setup commands does not grant ambient authority for further Git or remote actions.
This document itself grants none; committing, fork creation, remote configuration, pushing, and PR
submission still require their corresponding explicit instructions.

All implementation paths below are relative to the OSS checkout. Reconcile the first arc item only
against that checkout's reachable history, never `/sys` history. A local contribution commit is not
an upstream merge or release. Follow the checkout's live agent and contribution rules.

## 1. Establish the checkout and reproduction

- The official npm `latest` lookup during preparation selected `1.1.0`; the inspected GitHub `main`
  ref identified the selected base above. Its generator still contains the same launcher defect.
  Recheck relevant open issues/PRs before duplicate work or submission. The recorded Pi `0.87.1` /
  Deno `2.9.7` failure remains historical evidence; fresh proof must use this rebuilt `1.1.0` base.
- Use the established checkout and contribution branch. Verify the active branch before any
  implementation edit. Do not work on `main`, clone a second checkout, reset, or clean unrelated
  work. Confirm the human's GitHub account, upstream push access, and any required fork destination
  for submission separately; no fork is needed for local implementation.
- Read upstream `AGENTS.md`, scoped rules, `CONTRIBUTING.md`, build scripts, and test instructions.
  Inspect toolchain availability and agree the required install/build commands before execution. Do
  not upgrade the human's runtimes or run dependency lifecycle scripts implicitly.
- Prepare and execute a public standalone reproduction with exact versions and diagnostics. It must
  not depend on private Driver-Pi code. Separately reproduce the failure from the generated Pi bin
  in the chosen base checkout so the eventual before/after result has the same entry boundary.
- Check whether the submitting account already has maintainer `lgtm` approval. If not, prepare the
  factual material for a short issue in the required template, written by the human in their own
  words. Link the related Node report without claiming Node 20 is supported. Publishing an issue
  requires its own explicit instruction. Local preparation may proceed before maintainer approval;
  the approval gate controls PR submission, not source inspection or an authorized local fix.

## 2. Make the smallest upstream change

Target one production file: `scripts/build-coding-agent-bundle.mjs`, specifically `cliLauncher`. Use
the optional property-call approach described in the originating plan. Change the generator; do not
patch npm caches or hand-edit generated `dist` output. The production delta should be limited to the
launcher import and property calls, not a new helper, configuration option, or exported abstraction.

The `1.1.0` generator adds codemode worker bundling and validation, OAuth lazy-entry validation, and
another OAuth entry. None changes the five-line launcher or its `bin.pi` ownership. Preserve that
surrounding build behavior byte-for-byte. New codemode/MCP dependencies and their runtime behavior
are not a reason to expand this fix; the generated-bin proof must reveal any later incompatibility.

Preserve the Node optimization when available, its order before loading the real CLI runtime,
complete Pi initialization, and visible failures other than the absent optional API. No async
bootstrap, broad catch, fake export, dependency change, engine downgrade, or runtime selector.

One-file total is an aspiration, not a reason to omit regression evidence. First inspect existing
upstream tests. Add only the smallest necessary regression file/change, and explain any additional
production file before expanding scope. Do not extract a framework to make a few launcher lines
testable. No changelog edit, version bump, unrelated formatting, or generated-file churn.

Run the generated-bin proof early. If another incompatibility appears, report its exact boundary and
ask before expanding this contribution; do not claim current Pi works merely because the first
import error disappeared. Preserve a narrowly true claim if the launcher fix remains independently
useful, and agree any change to acceptance criteria with the human.

## 3. Validate and assemble evidence

Execute the originating plan's upstream proof contract in this checkout: unchanged failing base,
rebuilt candidate, supported Node behavior with cache enabled/disabled, and provider-free Deno RPC
startup/request/shutdown. Keep owned state, bounded output, child settlement, offline execution, and
scoped Deno permissions. No provider credentials, permission expansion, or cache tampering.

Use the narrowest regression tied to real emitted code, under the existing `scripts/*.test.mjs`
Node test runner. Cover absent API, present API called once before runtime loading, and propagation
of cache-call or CLI-load errors. A copied optional-call snippet or a textual spelling assertion is
not that regression. Keep the fixture bounded; do not extract a production framework for testing.

The old `scripts/coding-agent-consumer.mjs` and its test no longer exist at this base. The current
policy smoke is `scripts/coding-agent-smoke.mjs` / `scripts/coding-agent-smoke.test.mjs`; its tests
use stub packages and do not establish this launcher fix. The declared real consumer check is
`npm run check:package-install`, now backed by `scripts/check-package-install.mjs` and the package
artifact/install helpers. It checks all public package consumers and invokes the coding-agent SDK
and CLI policy smoke. Inspect its effects and agree its temporary artifact/install execution before
running it; do not use the retired path or invent another consumer framework.

Then run upstream's required `npm run check` and `./test.sh` under the inspected execution rules.
`check` still runs Biome with `--write`, but no longer checks a coding-agent shrinkwrap; do not
accept unrelated changes. Record any test that could not run and why. Do not imply that `--version`
or a skipped test establishes full startup. Keep Deno local proof distinct from upstream CI.

Prepare a compact evidence packet: base/head identities, exact runtime versions, build provenance,
commands, before/after diagnostics, Node results, Deno results, and remaining limits. The human
reviews the scoped diff before any explicitly requested commit; preserve signing and authorship.

## 4. Shape the issue and PR with the human

Reserve deliberate time for wording after the evidence is real. Do not automatically turn these
planning notes into a submission. The human supplies or rewrites the voice; the assistant checks
clarity, structure, and factual precision. Use the human's normal technical voice, not forced quirks
or stock agent phrasing.

The concise PR should answer four questions, without a mandatory wall of headings:

1. What breaks? The unconditional named import fails before Pi starts when the optional API is
   absent. Name the exact observed runtime/package pair.
2. What changes? Read the optional API as a property and call it only when present; preserve the
   real CLI startup path and Node's existing optimization.
3. Why this scope? Deno already caches code; this change avoids requiring that particular Node
   export. It does not lower Pi's Node engine requirement or promise universal runtime support.
4. What was tested? List only executed commands/results, exact runtimes, and relevant limits. Link
   the issue and upstream evidence where useful, without dumping the private integration history.

Use short sentences and concrete verbs. Remove promotional language, unnecessary apologies,
boilerplate summaries, and claims the diff or tests cannot support. Read the final text aloud with
the human: does it sound like something they would actually write and confidently explain?

Human voice is not a claim of unaided authorship. Follow Pi's current AI-assistance/disclosure
requirements, particularly its human-written issue rule and any agent-posted comment requirements.
Do not manufacture a personal anecdote, hide required disclosure, or invent test results. Preserve
the human's real contribution identity without changing Git configuration implicitly.

## 5. Approval gates, submission, and handoff

Pi's [contribution policy](https://github.com/earendil-works/pi/blob/main/CONTRIBUTING.md) was
inspected on 2026-09-24; recheck it before submission. The two opening gates control opening the PR:

- **Pi maintainer approval:** resolver is a Pi maintainer under `CONTRIBUTING.md`. Evidence is an
  approving `lgtm` comment URL for the submitting account, in the required position. `lgtmi`, issue
  closure, and a passing test do not qualify. Rejection or absent approval means no PR submission;
  return the decision to the human rather than bypassing the policy.
- **Human wording/submission approval:** resolver is the human contributor. Show the exact title,
  body, relevant disclosure, target repository/branch, scoped diff, and evidence. Check this gate
  only after explicit approval of that submission. Rejected wording is revised together; silence or
  a general acknowledgement is not permission to post. Record what text/revision was approved.

A checked gate is evidence of its decision, not permission for unrelated Git or remote actions. Push
and PR creation require explicit instructions naming those actions through an authorized execution
surface. Never treat this plan, contributor approval, or prepared prose as ambient posting
permission. No credentials or private worktree data belong in the public evidence.

The preparation delivery is a verified contribution commit in the selected Pi checkout, its
evidence, and the approved submission text with both gates resolved. Actual PR publication is a
separate explicit action; record its URL when it happens. A PR URL is not evidence of acceptance,
merge, or release. Keep later review responses equally concise and human-approved.

Return issue/approval/PR links and actual outcomes to the originating plan without duplicating this
commit ledger. Downstream adoption there still requires an official released artifact and the
unchanged Driver-Pi compatibility proof. Neither a prepared PR nor a local contribution commit
changes the recovery pin or completes current-Pi adoption.

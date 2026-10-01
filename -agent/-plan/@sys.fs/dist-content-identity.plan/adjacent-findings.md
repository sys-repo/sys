# Dist content identity — adjacent findings, not an expanding landing scope

## Disposition

Preserve these observations; discovery during Dist work alone does not authorize implementation. The
governing plan's opening arc owns the source slices and explicitly promoted corrections; the former
aggregate feature subject is historical. Future subjects below are not extra required commits or
implementation approval. Reinspect the owning baseline before acting.

The ordinary Vite repair is different: it is mandatory immediately after Dist closure, owned by
[vite-build-repair.plan.md](../../@sys.driver-vite/vite-build-repair.plan.md), not optional debt in
this register. Its concrete obligations and the relevant finding summaries survive there when
Dist's supporting records retire. Dist no longer depends on broad Vite repair; required real build
paths and execution restrictions remain binding.

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

**Current relationship:** R3-E01 remains an execution blocker for affected proofs, not an active
resolver implementation queue. The governing plan separately retains the two-file
`fix(driver-vite): honor immediate-child dependency policy` item because its public declaration and
caller already landed in S6. That completes only the documented immediate-child handoff. Broader
loader/prewarm/fallback enforcement stays outside this arc. Establish the smallest compliant route
or bring back a separately bounded prerequisite; neither native producer greens nor the command
flags establish whole-chain containment. Do not infer that more proof work justifies an upstream
upgrade or rewrite.

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

**Current relationship:** the affected proof remains blocked until a compliant route exists. The
Vite containment decision keeps repository build fixtures on actual ancestor workspace authority, so
those cases need no synthetic bridge construction. Other existing callers still use the helper;
removing it wholesale would lose a different proof world. Preserve its prior frozen-discovery delta
as separately attributed work outside the Dist command cut and mandatory successor repair. Do not
delete that flag to enable a run, treat it as cache-only proof, or carry it unexamined with the
failure-cause repair. If a small fixture-only correction is necessary, identify the exact required
lane, authority and supported route before promoting it. This does not justify a general graph framework.

## AF-03 — bridge-fixture cleanup and lint debt

**Former proposed commit:** `refactor(driver-vite): remove bridge fixture lint debt`.

**Owner:** `code/sys.driver/driver-vite/src/m.vite/-test/u.bridge.fixture.ts`.

**Evidence:** the R3 exact-file lint run reported 11 existing diagnostics: the duplicate
named-capture RegExp, unused bindings and require-await. At that checkpoint its diff contained only
`--frozen`. This is lint evidence, not a demonstrated runtime RegExp failure or fresh type error.
Later source inspection confirms that `writeLocalFixtureImports` writes missing `deno.json` and
`tsconfig.json` before graph discovery, but returns its restore callback only after all setup.
Discovery rejection therefore has no restoration branch. No fresh fault-injected execution is
claimed. The historical lint count is not a new check of the later seam.

**Containment decision:** the former instruction to finish this helper within ordinary Vite repair
is superseded. The new `-bridge.fixture.test.ts` and `writeLocalFixtureImportsWith` invocation seam
were an unearned expansion, not a demonstrated prerequisite for the native producer or corrected
workspace fixtures. The mandatory Vite successor plan owns their targeted withdrawal in a later
authorized source pass, preserving the shared helper, its callers and the earlier frozen flag. This note
preserves the cleanup finding; withdrawal is not evidence that cleanup works, nor permission to
remove a production regression test or suppress default test discovery.

**Future acceptance:** if the helper remains needed, own setup from the first write, distinguish
absent from existing empty documents, attempt independent restoration and preserve primary plus
cleanup failures. Keep dependency selection, import discovery and scheduling behavior explicit;
prove them at the narrowest useful boundary. Synthetic graph results may test construction or
failure arbitration, never real graph resolution or containment. Exact-file lint/format must pass
without suppression for a future selected whole-file change. Prefer removing unnecessary fixture
machinery over expanding it, but do not replace real dependency discovery with an unproved scanner.

**Re-entry:** activate only for an explicit fixture-maintenance task or a demonstrated prerequisite
to a named required lane. Bring that smallest correction back before implementation. No blanket
inherited-debt waiver is granted: the shared helper is excluded from the command and successor
repair cuts, not declared clean. Failed or unexecuted ordinary tests still prevent a whole-driver
health claim; they are not automatically prerequisites to Dist's specific composition proofs.

## AF-04 — observation-owner import lint debt

**Former proposed commit:** `chore(ui): align observation imports with lint policy`

**Owners and evidence:** the S10 exact-file lint run reported four diagnostics in imports already
present at `8ba45c06f`. Under `code/sys.ui/ui-components/src/ui.react/ui/Http.Origin/`,
`common.ts:1` imports unused `t`; `u.log.ts:1` uses a value import for a type-only binding;
`ui.Action.Verify.tsx:1` imports React only for its type. The fourth is the type-only value import
at `code/sys.ui/ui-react/src/use/use.Dist/use.Dist.sample.ts:1`. Read-only HEAD inspection confirmed
these import forms and usages predate the selected S10 delta. The
[S10 receipt](./landing/S10.landing.md) records the failed lint check alongside passing owner tests,
typechecks and exact-file formatting; it makes no clean-lint claim.

**First correction checkpoint (historical):** the returned independent review promoted these four
imports to S10 finish work; the human subsequently authorized their correction. All four were
corrected without suppressions or rule changes. At that first correction checkpoint, exact-file lint
passed for the corrected 24-file source cut, observation/render controls passed, and all six full
owners passed **222 suites / 1,298 steps**. The newly selected production ModuleList file also
closes its inherited `no-window` diagnostic with `globalThis.location`; its React type import and
number guard follow canon. These are selected-file finish corrections, not a runtime identity
redesign or broader cleanup campaign. The receipt preserves the failed historical lint check
separately from fresh proof. That checkpoint established neither a new independent verdict nor an
S10 landing. The former subject remains historical attribution, not a second required commit.

The later targeted review accepted those import corrections but held two inherited Http.Origin
correctness defects. The human approved their correction and selected-file docs/residue; the
[S10 follow-up](./landing/S10.landing.md#targeted-review-return-and-authorized-finish) preserves
that hold, qualified blindness and source-only counterexamples separately from implementer red →
green proof. Exact 24-file lint and 26-file source/config format pass again; three affected full
owners pass **143 suites / 846 steps**. This does not create a broader cleanup obligation or new
independent GO, and the two task configurations remain independently approved outside the source
cut.

## AF-05 — HTTP static sibling-prefix traversal — separate security correction

**Arc commit:** `fix(http): reject sibling-prefix static path escapes`.

**Owner:** `code/sys/http/src/http.server/m.HttpServer/u/u.serveStatic.ts`, the adjacent
`u/u.middleware.ts`, and existing `-test/-u.serveStatic.test.ts`. The original two-file candidate was
held after independent review; the human approved the middleware amendment and separate Std
prerequisite. Std owns `code/sys/std/src/m.Path/u/within.ts` and
`code/sys/std/src/m.Path/-test/-.test.ts`. The governing ledger now records observed Std landing
`e9baa28574ebd5492df5884280dda25333cf86d0` and three-file HTTP source landing
`60cd6377b318e9dec2ebca6d20b69abe5106bd32`, in that order before S10. The HTTP `check:frozen`
configuration landed separately at `1c22d2f8a9ed8f1d264c7051736b62bc4e75d2c8`. These observations do
not close AF-06 or establish S10 delivery.

**Finding evidence:** the independent S10 review identified decoded `/..%2Fdist-secret/secret.txt`
under root `/private/tmp/s10/dist`. Joining/normalizing reached the prefix-sharing sibling, and the
string-prefix check permitted `Fs.stat`/serving if readable. Git blame attributed the branch to
`69090b66a6`, predating this migration. The authorized HTTP regression subsequently reproduced a 200
response instead of 403 and one stat instead of zero before the correction. No deployed exposure is
established. DenoEntry reaches this handler through `HttpServer.static`; its separate
caller-directory containment defect remains an S10 obligation.

**Smallest correction/proof:** resolve root/candidate as absolute paths consistently and use the
existing segment-aware predicate. Prove encoded sibling traversal refuses before filesystem lookup
and does not invoke not-found/SPA fallback. Retain ordinary/default/relative-root files, directory
indexes/redirects, SPA fallback, ETag and Range success controls, plus settled test resources. This
is lexical containment, not a new path framework, atomic no-follow guarantee or pinned-serving
redesign. Do not weaken the assertion or grant filesystem authority to obtain green.

**Implementation and returned-review evidence:** the
[HTTP containment receipt](./landing/HTTP.static-containment.landing.md) retains the initial 1-suite
/ 12-step focused and 59-suite / 460-step full unit greens, then records the independent hold and
source-backed adjudication. The reviewer reported three failing independent controls: valid POSIX
backslash-name refusal, an off-origin directory redirect, and a raw/decoded directory collision that
redirects rather than refusing. The first becomes an HTTP regression through the inherited Std
helper; both middleware defects are inherited. Accept all three within the now approved owners, not
as optional polish. The reviewer demonstrated no outside middleware lookup, sibling-byte disclosure
or deployed exposure. No corrective runtime check ran in this plan pass.

**Closing scope:** preserve native path semantics without changing `relativePosix` or Dist part-name
rules; keep redirects on the request origin; admit decoded paths before directory lookup/redirect.
Retain real-byte/root/fallback/ETag/Range controls and settle owned fixtures. Correct the selected
header comment. The receipt owns exact whole-file cuts and unexecuted proof commands; broader
symlink/race, route-framework, transport and toolchain work remains excluded. AF-06 is separate.

## AF-06 — HTTP test-server setup ownership — separate follow-up

**Future commit:** `test(http): settle server fixtures after setup failure`.

**Owner:** `code/sys/http/src/http.server/m.HttpServer/-test/u.fixture.usingServer.ts` and a focused
fixture regression at that owner. This is not part of the approved Std/HTTP source cuts or a new
required arc item.

**Evidence:** the returned HTTP reviewer identified `Deno.serve` before URL/client construction and
before `try`; a throwing `mkFetch` leaves no protected listener teardown. Cleanup currently catches
and suppresses client/shutdown errors. Implementer source inspection confirms that order and error
handling. No fault-injected setup failure or leak in the executed candidate tests was reported. This
is an inherited fixture defect, not a newly demonstrated production leak.

**Future acceptance:** listener ownership starts at allocation; client-construction/body failures
still settle acquired resources. Independently attempt teardown, await actual server settlement and
preserve primary plus cleanup failures. Prove throwing `mkFetch`, body failure and independent
cleanup failure without globals, sleeps-as-drainage claims or widened permissions.

**Current disposition and reconsideration:** park the repair separately as the human requested. New
HTTP controls can use direct `app.fetch` and explicitly owned temporary directories. Existing
transport controls remain. If a required check exercises this failure or a necessary current proof
cannot settle without the fixture correction, bring back that exact prerequisite for promotion; do
not suppress its diagnostic, weaken the proof or silently enlarge the current cut.

## AF-07 — deeper Vite proof factoring, separate from Dist delivery

**Possible future commit:**
`test(driver-vite): separate fixture authority from build lifecycle proofs`. This is a
cleanup/design return note, not a new arc item, prerequisite plan or execution instruction.

**Concrete owners:** `code/sys.driver/driver-vite/src/m.vite/-test/u.bridge.fixture.ts`, its actual
bridge/dev/consumer callers, and `src/m.vite/-test.external/u.fixture.build.ts` under the same
driver. The ordinary build/workspace tests and Dist pipeline are evidence consumers, not an excuse
to make runtime production imports depend on test infrastructure.

**Reason to revisit:** the shared fixture discovers a graph, scans source, synthesizes dependency
maps/package/config files, rewrites driver imports and returns restoration as one operation. The
external build helper then owns a separate child boundary. Failure attribution and lifecycle proof
become hard to separate. This source structure supports a maintenance concern; it does not establish
that production Deno/Vite transport is broken or that every existing proof is invalid.

**Design questions for the future pass:**

- Name each proof's world: inherited repository workspace, isolated local consumer, or published
  consumer. Do not quietly use one as evidence for another or fabricate an isolated lock authority.
- Separate fixture authority selection, actual process execution and resource ownership only where
  that reduces concrete coupling. Start from existing helpers and real callers, not a generic
  fixture engine, graph service or new production policy API.
- Keep a claim-to-assertion map before replacing legacy tests. A smaller test must preserve the same
  causal negative, positive control, trust boundary and forbidden effects. Use independent
  expectations, not two calls to one helper as the entire oracle. Retain thin real adapter
  capstones.
- Keep content identity, controlled-fixture repeatability and execution containment distinct. A
  metadata-invariance control can use one real artifact and independently varied documents; that
  alone cannot replace a required repeated-build or overlapping-preview lifetime control.
- Trace setup/teardown from first acquisition. Prove command/bootstrap disposal, original-document
  restoration and independent failures, not just a cleanup helper called after successful setup.
- Label source checks, injected-unit evidence, real child builds, transport builds and browser proof
  separately. Preserve raw diagnostics; a version probe or synthetic graph never certifies the next
  stage. Do not solve an unexecuted lane by weakening its claim or deleting its assertion.

**Boundary:** Dist retains immediate-child command proof and its real composition/Pi capstones;
the mandatory Vite successor retains ordinary fixture/producer repair. Only concrete necessary
fixture/settlement corrections belong to each. Broad proof rearchitecture is not an additional
completion condition for either plan. Activate this note after delivery, or promote a precisely
demonstrated prerequisite by explicit scope decision. AF-01/AF-02 execution
restrictions remain binding even while this maintenance is deferred. No source edits, upgrades,
downloads, permission expansion, lock changes or test execution were authorized by writing this
note.

## Already recorded separately — do not duplicate

The former combined subject,
`refactor(dist): consolidate inventory accounting and retain build failure causes`, is superseded by
the human-requested arc refinement. Returned build causes and ordinary fixture repair now belong
to the mandatory Vite successor plan, including experiment withdrawal and the exact source boundary.
Dist retains the separate immediate-child command item and the two-caller FS/Server extraction,
`refactor(dist): consolidate inventory accounting without merging authority`, before its two
integration proofs. Accounting does not depend on broad Vite repair. Each plan owns its own opening
arc and landing state; this register adds no duplicate item. No required proof is dropped. A future
refactor is not a hiding place for an admission defect or an explanation for an unobserved runtime
failure.

## Priority and stop rule

Core `@sys` correctness and composition come first. Repository `deploy/` consumers receive only the
migration needed for this contract; provisional product hardening belongs to later work. No such new
product defect is invented by this register. If provisional work, adjacent tooling or optional
polish starts driving the schedule, pause with the concrete dependency and scope decision. Record
findings; do not lose them, silently absorb them, or launch another broad review by default.

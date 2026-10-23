# Review 01 — canonical content contract

## Verdict

**Changes requested: one P2 acceptance-proof gap.** No representation collision or production
pin-admission bypass was found in the inspected slice. Keep the tuple design and existing ownership
split. The required real-file compute → sign/writeback → load → pinned-verification proof is missing.
Passing the separate owner tests does not close that integration obligation.

This is a bounded source/runtime assessment, not approval of the whole migration, publication, or
release. Executed: **11 tests / 101 steps, zero failures** across five narrow task invocations.

## Baseline, authority, and independence

- Repository: `/Users/phil/code/org.sys/sys`.
- Baseline: Dist review R1; entry and exit HEAD:
  `8d97fe4088bed6764e804424b767b089ffb13cf3`.
- Target: attributable worktree replacement, including untracked source, for
  `feat(dist)!: unify build pins and verification on canonical content identity`.
- Governing artifact: `-agent/-plan/@sys.fs/dist-content-identity.plan.md`.
- Read the coordination README, charter 01, loaded workspace instructions, canonical AGENTS, and all
  24 files under `../sys.canon/-canon/`. Applicable scoped-AGENTS discovery found none in the inspected
  package/agent paths. Applied STIER/TMIND/BMIND to consumer clarity, maintenance, and hostile inputs.
- Read-only reachable-history reconciliation found exactly one match for each checked prerequisite:
  `e6316e80b8cd74b0982f25c8f635ba4a28f3b219` and
  `872b5a34d55ecee83d8bede21446c76ebd13965d`. Their subjects match the arc. No reachable exact-subject
  match for the third item; it remains the current unlanded item. The opening block was reopened at
  exit. No plan edit was made.
- Independence caveat: the initial broad plan read returned its verification-checkpoint and research
  prose alongside the requirements. Those receipts/verdicts were not used to establish findings or
  passing evidence below. No sibling report, handoff, or implementing transcript was read. This
  caveat prevents describing the pass as perfectly isolated from prior plan narration.

## Prioritized finding

### P2 — add the promised integrated signer/content proof at the signer owner

**Evidence**

- `code/sys.driver/driver-signer/src/m.dist/-test/-.test.ts:213` (`ownKeyCases`) signs independently
  authored JSON containing prototype-sensitive members. `canonicalOwnKeyFixture` at line 559 uses
  artificial zero checksums; these fixtures are not real payload trees. They prove canonical signed
  bytes, writeback preservation, and signature refusal after descriptive-member mutation.
- The same file at line 311, “sign → writes detached signature descriptor into canonical dist.json
  and preserves Dist.compute hash”, creates only `a.txt`, compares a second compute result, and
  verifies the signature. It never calls `Pkg.Dist.Pinned.verify`.
- `code/sys/fs/src/m.Pkg.Dist/-test/-content.production.test.ts:58` creates real `__proto__`,
  `constructor`, and `toString` files and runs compute → load → strict verification, but never signs.
- Workstream H and the governing adversarial matrix explicitly require the combined sequence.
  Searches across FS, Crypto, and Signer found no other `DistSigner` integration covering it.

**Failure/misuse sequence the existing proof permits**

Create real prototype-sensitive files → compute and retain the original pin → sign with descriptor
writeback → treat successful signing and a matching recomputed pin as proof that the resulting tree
still passes strict verification. The current signer test stops at exactly that weaker assurance.
Its colocated `dist.json.sig` is excluded by compute but is not admitted payload; a strict-tree check
must not silently accept it. This is a source-derived assurance gap, not a newly executed production
exploit or a proposal to relax the tree contract.

**Invariant and smallest correction**

Owner: `@sys/driver-signer` test suite. Add one integration test using public FS APIs and signer-owned
temporary fixtures, not an FS test importing its downstream signer. Put the detached sidecar outside
the verified payload root. Retain the first compute pin; after default descriptor writeback, load
and strictly verify against that same pin, asserting exact own membership and digest preservation.
Mutate a prototype-sensitive descriptive member: the old signature must fail while a separate pinned
verification still accepts unchanged payload content. Mutating the actual payload must refuse.

**Closing proof**

The new test must exercise real bytes and all five stages, retain the pre-sign pin without recapture,
and assert successful strict verification rather than merely a second computation. Run:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-signer
deno task test --trace-leaks ./src/m.dist/-test/-.test.ts
```

No production redesign is indicated by this finding.

## Representation / guard / proof map

Paths below are repository-relative; test titles identify the exact assertions.

| Obligation | Implementation and boundary | Proof inspected / executed |
|---|---|---|
| Exact tuple and domain | `code/sys/std/src/m.Pkg/m/m.Dist.Content.ts::encode`; `sys.dist/v2`, array tuples, compact `Json.stringify(..., 0)` | Std “literal payload tuple”; FS content admission “independently fixed UTF-8 preimage and SHA-256 vector”; executed |
| Path/hash/length binding | `encode` copies each own enumerable path and parsed checksum/size into one tuple | Std “commits path, checksum, and size”; FS valid different inventory gives `pin-mismatch` with positive controls; executed |
| Unicode and ordering | `String.isWellFormed`, `Str.Compare.codeUnit`; no locale ordering, case folding, or normalization | Std numeric/astral/NFC/NFD/order and escaping cases; FS literal 608-byte Unicode vector; executed |
| Canonical digest and integer grammar | `code/sys/std/src/m.Pkg/m/m.Dist.Part.ts::parse` checks complete regex consumption and safe integer size; encoder requires size | Std Part rejection matrix includes trailing LF, uppercase, signs, leading zero, exponent, fraction, unsafe integer; executed |
| Independent exact pin | `m.Is.ts::distPin`: exactly two own data keys, supported scheme, canonical unsuffixed digest | DistPin old/mixed/symbol/hidden/accessor/prototype refusal and JSON final-member cases; executed |
| Named capture | `m.Dist.Pins.ts::capture/data`: capture first, validate owned data, freeze individual pins and map; exact name witness | Names, prototype-sensitive names, mutation, exact requirements, malformed/accessor tests; executed |
| Hostile execution boundary | FS `u.verify/u.input.ts::snapshotExactDataObject/snapshotPin` refuses native Proxy identities before reflection; `snapshotManifestArgs` uses native typed-array slots/copy before lifecycle hooks | FS `-pinned.admitManifest.input.test.ts`: Proxy/revoked Proxy/accessor/species/iterator/shared/detached/resizable/caller mutation/cancellation cases; executed |
| Recompute, do not trust declaration | FS `u.verify/u.manifest.ts::admitManifest/captureContent` computes `Hash.sha256(Content.encode(inventory))`, then compares declaration and independent pin | Forged declaration and valid-but-different pin tests; no payload read/tree traversal on mismatch; executed |
| One document interpretation | FS fatal UTF-8 decoder and `Json.parse` once; only parsed descriptor is captured | Duplicate hash/scheme/digest/parts/path, escaped names, single/double BOM, malformed UTF-8/JSON; executed |
| Finite work | Encoder entry/path/aggregate/conservative encoding ceilings; FS byte ceiling, safe totals, charged directory-prefix work before Rooted normalization | Encoder boundary/refusal cases; FS tightened byte/path/entry/file/total/prefix limits and 20,000-level excluded metadata; executed; full worst-case runtime stress not established |
| Path safety is not encoding | FS delegates lexical/structural targets to Rooted and checks unchanged spelling; encoder itself intentionally accepts strings not usable as paths | FS leading-space positive control; alias/traversal/backslash/reserved/collision/surrogate refusal; executed; complete Rooted audit outside this slice |
| Immutable authenticated evidence | FS freezes copied inventory, content, parts, evidence; excluded observations not exposed as verified Dist | FS content admission exact evidence keys/freeze and input snapshot tests; executed |
| Metadata does not name content | Encoder accepts only parts; FS evidence contains no root `pkg`, build, or signature hint authority | Metadata/layout/BOM invariance, different root-label builds, distinct `manifestChecksum`; executed |
| Document fence remains distinct | FS content production verifier test replaces root metadata during a file read | Within-operation `changed`, subsequent independent operation succeeds under same pin; executed; enclosing projection/materialization fences belong to other slices |
| Generic CompositeHash unchanged | `code/sys/crypto/src/m.Hash.Composite/u.digest.ts` still hashes key-sorted constituent hashes joined by LF; builder uses private null-prototype storage and detached snapshots | Generic default/SHA-1/custom/empty/cache/own-key controls; builder suites executed; URI/size/verify/public-surface suites inspected only |
| Signature subject remains document | Signer `u.run.dist.ts::canonicalizeJson` uses lossless own-property construction recursively; `u.run.ts` signs returned canonical document bytes, not content digest | Literal canonical bytes and descriptive own-member mutation; raw manifest bytes, wrong key, layout/key-order controls; executed |
| Remove compatibility | Types delete `DistPkgLegacy`; Std deletes `Compat` and `distCompat`; FS load has no legacy branch and recomputes supported content | Std export/old-input tests executed; FS API/load negative controls inspected; targeted residue search found only negative controls |
| Real compute/sign/load/strict verification | Separate FS and signer tests do not compose this sequence | **Missing: P2 above** |

### Why the encoding should remain unchanged

For admitted inventories, each tuple contains one exact scalar-string path, one exact canonical
checksum, and one nonnegative safe integer. Sorting fixes order; JSON escaping preserves string
boundaries; the tuple positions distinguish path/hash/length roles. No inspected transformation
removes a path or aliases scalar spelling before encoding. Encoding is injective over those admitted
descriptors; this is not a claim of mathematical collision freedom for SHA-256.

The new `DistContent`, scheme, and pure `Content` surface each have a concrete responsibility.
`manifestChecksum` preserves a different operation/document fact; collapsing it into the content pin
would discard evidence. No generic canonicalization framework, crypto dependency in Std, or alternate
Dist algorithm was introduced. Replacing this with another encoding would add churn without closing
the actual missing proof.

## Guard limits and documentation observations

- `Pkg.Is.dist` recognizes shape; it does not authenticate a declared digest. That distinction is
  explicit in `code/sys/std/src/m.Pkg/t.ts` and the shape-only test fixture.
- Universal Std shape/encoding helpers are **not** the native Proxy-refusal boundary. `distPin` and
  `Pins.capture` use reflection; `Content.encode` calls `Is.plainObject`, whose
  `Object.prototype.toString` can invoke `Symbol.toStringTag`. FS performs native identity refusal
  before capture and supplies parsed JSON/owned inventories to admission. No remote authority escape
  from these helper limitations was found.
- Optional documentation correction: narrow `m.Dist.Content.ts:24–25`'s broad “accessors are refused”
  comment and its test title to **enumerable part-value accessors**. An object with a valid `a` part
  plus a `Symbol.toStringTag` getter invokes that getter in `Is.plainObject`; this source-derived case
  was not executed. State the intended owned-data precondition rather than implying universal
  hook-free introspection or adding a server dependency to Std.
- The public types explain content versus document versus observational metadata well. The tuple
  example and literal tests teach the encoding. No JCS or atomic filesystem guarantee is asserted.

## Prior proof disposition and test economy

Compared the current tracked diffs with HEAD and inspected the pre-collection-split suite at
`872b5a34d^:code/sys/crypto/src/m.Hash.Composite/-.test.ts`.

| Prior load-bearing signal | Retained/replaced disposition |
|---|---|
| Generic builder creation, initial forms, overwrite/remove, independent snapshots, cached digest, algorithm options, empty digest | Retained in `-builder.test.ts`; own-key and direct-empty-map distinctions strengthened in `-builder.own-keys.test.ts` and the explicit empty-map test |
| Generic conversion/guards, size/filter/no-size, URI malformed/non-string/sized/unsized, verification good/bad/missing/different algorithm | Retained in `-.test.ts`, `-size.test.ts`, `-uri.test.ts`, `-verify.test.ts`; no old acceptance assertion lost in that split |
| Std unknown/pkg guards and partial Dist shapes | Consolidated in `-m.Pkg.Is.test.ts`, retaining positive and refusal cases |
| Optional root pkg, sign descriptor and ignore descriptive shapes | Retained in shape tests; strict metadata authority intentionally removed at FS, replaced by content-evidence/metadata-invariance assertions |
| Complete part parse grammar | Retained in `-m.Dist.test.ts`; hash-only remains valid as a standalone checksum but is now explicitly refused as a complete Dist part |
| Old Dist compatibility and conversion acceptance | Obsolete under the explicit clean break; replaced by absent-export checks, unsupported/missing scheme tests, old/mixed pin refusal, and FS invalid-load controls |
| Exact pin ownership/accessor/prototype/freeze/type witness checks | Retained with the new two-field shape; mutation now exercises both scheme and digest |
| Signer literal own-key/writeback/no-writeback/ordinary-key/inherited-setter proof | Retained; fixture digest updated using an independently assembled tuple so new load admission succeeds |
| Signer raw-file signatures, wrong-key/tamper and layout normalization | Unchanged tests retained and executed |
| FS Dist equals generic directory digest | Intentionally replaced by equal inventory / distinct digest assertions; literal Dist vector and actual-byte verification are the new positive controls |

Keep the pure Std encoding, FS byte-admission, FS real-files, and signer canonical-byte tests separate:
they detect different failures and must not all generate expectations through the same helper.
The missing signer capstone should not replace the independent literal tests. Optional economy:
Signer’s two “prints ... sample” cases duplicate successful signing/verification while emitting random
paths and signatures; their distinctive assertions could live in the existing success/descriptor
cases, keeping printing in an explicit sample. This is not an acceptance blocker or permission to
delete coverage. No new abstraction is needed for the proposed capstone.

## Test import and runtime-authority audit

| Import path / owner | Surface and direction | Purpose and authority actually used |
|---|---|---|
| Std tests → `../../-test.ts` → `m.Testing/mod.ts`; local Pkg/Json modules | Package-local production/test lanes, no downstream fixtures | BDD assertions and pure data; configured Std `test` grants read/write/env/net, but these selected tests perform no application filesystem/network work |
| Crypto tests → `src/-test/mod.ts` → `@sys/testing/server`; local Hash/CompositeHash | Public testing owner, local subject; common helpers use public Std subpaths | BDD, optional timer, pure hashes; Crypto `test` grants read/write/env, no run/net |
| Signer tests → `src/-test/mod.ts` → `@sys/testing/server` | Public test facade, not a private downstream fixture | BDD and assertions under signer read/write/env task authority |
| Signer `m.dist/common.ts` → `@sys/fs/pkg`, `@sys/crypto/hash`, `@sys/crypto/sign/ed25519`; common libs → public FS/Std | Downstream signer uses its upstream production owners | Temporary local payloads/documents/sidecars, ephemeral generated test keys; no real credentials, provider calls, subprocesses, or shared build output |
| FS content tests → `src/-test/mod.ts` → `@sys/std/testing`; local Pkg/DirHash and private `u.verify` IO seams | FS owns both fixture and private injection seam; no cross-package private fixture | In-memory admission and isolated OS temporary trees; read/write/env task authority, no run/net |
| FS API test → `@sys/fs/pkg/dist/verify`, `@sys/types`, dynamic `@sys/std/pkg` | Public self/upstream surfaces | Export identity and type path checks; inspected, not run in this pass |
| FS `-u.manifest.fixture.ts` | Same-owner private fixture | In-memory JSON, public Hash/Ignore/Json via local barrel; no extra authority |
| `@sys/testing/server` barrel → public FS, color, Std testing/server, Crypto/Std common helpers | Shared testing facade; no owner task grants are inherited by import | Importing the barrel does not invoke its Browser helpers or grant browser/subprocess permissions; none used here |
| FS `ServerIs.Native` → `@sys/std/is/server` → `node:util.types` | Public server-specific identity owner | Native Proxy/typed-array identity, not JS property probing; no external process |

The existing testing facade has a broader dependency closure than these tests need, but no new
reverse fixture import or permission borrowing was introduced in the inspected delta. The proposed
integration belongs at Signer specifically to keep that direction honest.

## Commands actually run

All task invocations followed owning `deno.json` inspection. These selected tests use pure inputs or
unique temporary directories; no shared build/runtime slot was needed.

```sh
cd /Users/phil/code/org.sys/sys/code/sys/std
deno task test --trace-leaks ./src/m.Pkg/-test/-m.Dist.Content.test.ts ./src/m.Pkg/-test/-m.Dist.test.ts ./src/m.Pkg/-test/-m.Dist.Pins.test.ts ./src/m.Pkg/-test/-m.Pkg.Is.distPin.test.ts ./src/m.Pkg/-test/-m.Pkg.Is.test.ts
# 5 passed / 38 steps / 0 failed

cd /Users/phil/code/org.sys/sys/code/sys/crypto
deno task test --trace-leaks ./src/m.Hash.Composite/-test/-builder.test.ts ./src/m.Hash.Composite/-test/-builder.own-keys.test.ts
# 2 passed / 18 steps / 0 failed

cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-signer
deno task test --trace-leaks ./src/m.dist/-test/-.test.ts
# 1 passed / 21 steps / 0 failed

cd /Users/phil/code/org.sys/sys/code/sys/fs
deno task test:unit --trace-leaks ./src/m.Pkg.Dist/-test/-content.admission.test.ts ./src/m.Pkg.Dist/-test/-content.production.test.ts
# 2 passed / 17 steps / 0 failed

deno task test:unit --trace-leaks ./src/m.Pkg.Dist/-test/-pinned.admitManifest.input.test.ts
# 1 passed / 7 steps / 0 failed
```

Also ran path discovery, narrow candidate searches, `git rev-parse HEAD`, scoped `git status --short`,
`git diff`, `git diff --cached`, `git diff --stat`, exact-subject reachable `git log`, prerequisite
`git show`, historical test-blob `git show`, and scoped `git diff --check` (no whitespace errors).
No Git mutation, dependency regeneration, formatter write, source edit, publication, or profile change.
An initial `find -agent` discovery had an option-parsing error; corrected to `find ./-agent`.

Report-only check:
`deno fmt --check ./-agent/-plan/@sys.fs/dist-content-identity.plan.reviews/01-contract.review.md`
reported Markdown wrapping/table alignment differences. Its diff output exceeded the capture limit;
no formatter write was attempted. Report formatting remains unnormalized; this is separate from the
passing code tests and the review finding.

## Inspected-file inventory

Each base plus the listed relative leaf names identifies the exact files inspected. Git-only and
partial inspections are identified; this is not a claim to have read every file in a named package.

| Base | Files / extent |
|---|---|
| `code/sys/types/src/t/` | `t.Pkg.dist.ts` |
| `code/sys/std/src/m.Pkg/` | `t.ts`, `t.dist.ts`, `common.ts`, `mod.ts`, `m/m.Pkg.ts`, `m/m.Dist.ts`, `m/m.Dist.Content.ts`, `m/m.Dist.Part.ts`, `m/m.Dist.Pins.ts`, `m/m.Is.ts`; deleted `m/m.Compat.ts` via Git diff |
| `code/sys/std/src/m.Pkg/-test/` | `-m.Dist.Content.test.ts`, `-m.Dist.test.ts`, `-m.Dist.Pins.test.ts`; `-m.Pkg.Is.distPin.test.ts`, `-m.Pkg.Is.test.ts` via complete tracked diffs |
| `code/sys/std/src/` | `-test.ts`, `common/u.is.ts`, `m.Is/m.Is.ts`, `m.Is.Server/m.Native.ts`, `m.Is.Server/common.ts`, `m.Str/m.Compare.ts`, `m.Json/u.parse.ts`, `m.Json/u.stringify.ts`, `m.Json/u.circularReplacer.ts`, `m.Testing/mod.ts`; `-test/-namespace.freeze.test.ts` changed hunk via Git |
| `code/sys/crypto/src/m.Hash.Composite/` | `t.ts`, `m.CompositeHash.ts`, `m.Uri.ts`, `u.builder.ts`, `u.digest.ts`, `u.wrangle.ts`, `u.size.ts`, `u.toComposite.ts`, `u.verify.ts`; all six files in `-test/`: `-.test.ts`, `-builder.test.ts`, `-builder.own-keys.test.ts`, `-size.test.ts`, `-uri.test.ts`, `-verify.test.ts` |
| `code/sys/crypto/src/` | `m.Hash/u.hash.ts`, `-test.ts`, `-test/mod.ts`, `common/mod.ts`, `common/libs.ts` |
| `code/sys.driver/driver-signer/src/` | `m.dist/t.ts`, `m.dist/common.ts`, `m.dist/u.run.ts`, `m.dist/u.run.dist.ts`, `m.dist/-test/-.test.ts`, `-test.ts`, `-test/mod.ts`, `common.ts`, `common/mod.ts`, `common/libs.ts` |
| `code/sys/fs/src/m.Pkg.Dist/` | `u/u.compute.ts`, `u/u.load.ts`, `u/u.hash.ts`, `u.verify/u.manifest.ts`, `u.verify/u.input.ts`, `u.verify/u.admitManifest.input.ts`, `u.verify/u.admitManifest.ts`, `u.verify/common.ts`; `u.verify/u.tree.ts` lines 1–150 only |
| `code/sys/fs/src/m.Pkg.Dist/-test/` | `-Pkg.Dist.test.ts`, `-content.production.test.ts`, `-content.admission.test.ts`, `-pinned.admitManifest.input.test.ts`, `-u.manifest.fixture.ts` |
| `code/sys/fs/src/` | `m.Pkg/t.ts` tracked diff and live lines 150–514; `-test.ts`, `-test/mod.ts` |
| `code/sys/testing/src/` | `m.server/mod.ts`, `m.server/common.ts`, `common/libs.ts` |
| Task/config authority | Root `deno.json`; `code/sys/std/deno.json`, `code/sys/crypto/deno.json`, `code/sys/fs/deno.json`, `code/sys.driver/driver-signer/deno.json`; `code/sys/testing/deno.json` lines 1–100 for public exports/permission context, no testing-owner task run |
| Review requirements | Coordination `README.md`, `01-contract.review.plan.md`, governing plan contract/A–H/matrix/completion boundary; canon listed in session bootstrap |

## Drift and evidence limits

- Entry/exit scoped status and staged diffs were recorded in the session. The scoped index was empty
  of changes. Crypto was clean. Core tracked Types/Std/Signer patches were reread at exit and matched
  entry content, not merely status names. FS compute/load/admission/input patches likewise matched;
  newly followed helper diffs matched their live inspections.
- All four relevant untracked source files were read again and matched: Std `m.Dist.Content.ts`,
  Std `-m.Dist.Content.test.ts`, FS `-content.admission.test.ts`, FS `-content.production.test.ts`.
  Root config, import map, lockfile, and inspected owner task configs had no Git diff. HEAD remained
  the R1 value. No target drift was observed. This is a procedural worktree check, not an immutable
  snapshot or proof against a transient concurrent edit restored between observations.
- The only authored worktree output is this assigned report. Existing unrelated changes were left
  alone. Some pre-existing signer tests leave isolated OS temporary directories; no ad-hoc cleanup
  was attempted.
- The complete FS race/lifecycle/Rooted implementation, consumer callbacks, projection/materialization
  publication fences, browser/SRI, transport credentials, provider behavior, and release evidence are
  outside this contract slice. Reading the plan’s A–H requirements does not establish those proofs.
- No full package/workspace check, cross-OS run, or exhaustive worst-case 16-MiB parser/maximum-inventory
  runtime benchmark was performed. Native parsing remains synchronous and byte-bounded, not deadline
  interruptible. The selected tests establish the listed cases on the local Deno runtime only.
- No new counterexample source was written, and no hypothetical correction was tested. P2 is an
  observed missing acceptance test; the optional hook/comment case is explicitly source-derived.
  The pass does not claim complete migration acceptance despite the green selected suites.

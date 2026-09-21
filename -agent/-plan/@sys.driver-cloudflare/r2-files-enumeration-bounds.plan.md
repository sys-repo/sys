r2-files-enumeration-bounds.plan.md
- [x] 2d4e9d2ce fix(driver-cloudflare): bound R2 Files enumeration work

## Closeout

The bounded enumeration correction is complete. The opening item reconciles to its reachable
implementation commit, including driver/transport tests and the Deploy fixture adjustment. The
implementation decisions and recorded package/consumer verification below establish the delivered
scope; no required implementation or proof remains.

Pagination, raw-key projection, public HTTP delivery, and larger-namespace scalability remain
separately owned concerns, not unfinished obligations here. Preserve this completion snapshot in
history before archiving the plan; retain its exact filename and recovery identity in references.
The remaining sections preserve the delivered contract and historical proof, not a new work queue.

## Purpose and scheduling

Harden the already-landed R2 Files backing without changing its Files/Cmd grammar or pretending
result pagination bounds provider work. This remains one independently useful driver fix, not a new
publication layer or a prerequisite for the small, controlled first R2 upload and HTTPS delivery.

[r2-files-delivery.plan.md](../@sys.tools/r2-files-delivery.plan.md) used the existing Files backing
and its whole-prefix upload/list/prune index in a small, controlled, reused namespace. That
completed storage proof is independent of this completed enumeration fix.
[r2-web-exposure.plan.md](r2-web-exposure.plan.md) owns subsequent private-R2-backed application
serving. Exact-key bucket reads and presigned object delivery do not traverse the Files index. This
separate ledger does not enter either opening arc as a prerequisite. Do not use a small Files page
limit as evidence that an arbitrarily large or untrusted namespace is cheap or safe.

## Evidence and owner

The backing landed in `28faad7b4 feat(driver-cloudflare): add R2 Files backing`. Its completed
former plan is recoverable at `bd7d0e6c7` and was removed by `dd5bd2450`; this correction does not
reopen it.

Original behavior and owners under `code/sys.driver/driver-cloudflare/src/m.r2/`:

- `m.Files/u/runtime.ts`: `readIndex` collects the complete backing prefix; `descendantObjects`
  collects descendants unless supplied a limit.
- `m.Files/u/entry.ts`: `buildEntryIndex` synthesizes directories and detects file/tree collisions.
- `m.Files/u.cmd/list.ts` and `manifest.ts`: build the index, filter/sort it, then page the result.
- `m.Files/u/page.ts`: the cursor is an offset into the reconstructed visible result, not a provider
  continuation token. Every page can repeat the full scan.
- `m.Files/u.cmd/remove.ts`: enumerates descendants and validates every target's removal policy
  before deletion; preserve that preflight ordering.
- `u/u.transport.s3.ts`: delegates listing to the pinned S3 client with `maxResults` and `pageSize`.
  The original bucket interface exposed an async iterable without request-budget accounting.

The correction belongs in this driver, including the smallest transport support actually needed to
bound its effects. Generic Files capabilities, Cmd transport, and Deploy publication policy do not
need a new contract for this one backing.

## Required contract

1. Introduce one complete driver-owned enumeration budget with finite defaults and finite validated
   ceilings. Snapshot it at backing construction. Define local types and literal defaults before
   plumbing them. Each Files operation gets counters from that frozen policy; neither subrequests
   nor retries reset them. No unlimited/missing-budget escape hatch. Keep this policy separate from
   the result-page limit and inline body limits; it is not a lifetime or cross-client quota.
2. Bound provider enumeration work and retained index work separately: dispatched list
   pages/requests, observed object records, retained key/path bytes, and synthesized file/directory
   entries. Count records before policy/glob/depth filtering; discarded, duplicate, or unusable
   records still cost work. Include all phases and probes of one operation in its budget.
3. Prove the actual pinned-client dispatch/page boundary. Setting Files `limit` or stopping an async
   iterator after N yields alone does not prove a request bound: hidden continuation, empty pages,
   and page buffering matter. If the current client iterator cannot enforce the bound, add only the
   necessary driver-owned bounded page seam over the pinned client. Do not upgrade dependencies or
   implement a generic storage paginator to avoid proving the existing mechanics.
4. Bound page/key admission before retaining records or growing the index. Account for directory
   synthesis and duplicated path storage, not only raw object count. State exactly which buffers and
   dispatches are bounded; do not present logical counters as a process-RSS or request-completion
   guarantee. Any claimed response-byte/parser bound must be enforced at the actual transport read.
5. Budget exhaustion is an explicit `FilesR2Error.EnumerationLimit`, added to the driver-local error
   union without widening generic Files error suffixes. Preserve it locally and emit an
   unmistakable, redacted limit message through the existing Cmd error path. Do not claim that Cmd
   preserves a typed provider error branch. Invalid budget input fails before provider calls.
6. Fail before returning any allegedly successful list/manifest page when the required index cannot
   be completed within budget. A transport stopping at `maxResults` does not establish namespace
   exhaustion: require explicit end-of-list evidence or a budgeted overflow lookahead, including its
   request/record cost. Do not return a capped tree as complete, or use `truncated: true` without a
   valid continuation. Existing paging follows only successful bounded enumeration/admission.
7. Apply the same authority to list, manifest, and removal enumeration. Bounded existence probes may
   remain bounded probes, not full scans. A non-recursive directory refusal must not needlessly
   collect every descendant when bounded evidence already establishes non-emptiness.
8. Removal must finish bounded enumeration, index/path admission, and all-target policy checks
   before its first delete. Overflow, invalid input, collision, or policy refusal means zero
   deletions. A later provider failure after admitted deletes remains truthful partial failure. This
   is neither atomic deletion nor a snapshot against concurrent raw bucket writers.
9. Preserve prefix confinement, path/key validation, deterministic ordering, synthetic directories,
   collision refusal, policy filtering, dynamic fidelity, and existing cursor admission. Do not
   silently change query scope to avoid difficult cases. Narrow provider scans to a requested
   subtree only when tests prove the same visible semantics and necessary ancestor checks.
10. Stop scheduling provider work on exhaustion and close owned iterators/bodies where supported. Do
    not add an ignored abort signal or claim cancellation terminates an already-issued request.

## Deterministic proof in the same commit

Extend the driver-owned tests, primarily `src/m.r2/-test/-m.Files.test.ts` and transport fixtures:

- a huge namespace with Files `limit: 1` has finite provider calls and bounded index growth;
- limits at exact capacity with proven end-of-list succeed; a capped iterator without exhaustion
  evidence cannot report completeness, and overflow lookahead consumes its reserved budget;
- policy, glob, and depth filters cannot hide unbounded scan work behind a tiny/empty result;
- deeply nested keys exhaust synthesized-directory/path-byte bounds even with few objects;
- duplicate records, empty continuation pages, and repeated/non-progressing continuations cannot
  dispatch unbounded requests or reset the budget;
- list and manifest return no misleading success/cursor after overflow; successful small namespaces
  retain ordering, filtering, directory synthesis, and paging behavior;
- creation-input mutation cannot change the retained budget; invalid/non-finite/unsafe values fail
  before calls, and callers cannot enlarge authority through a result-page limit;
- recursive removal overflow, late policy denial, and collision each produce zero deletes;
- successful admitted removal and provider partial failure retain existing truthful behavior;
- direct handlers and Files clients surface clear redacted refusal without a Cmd redesign;
- fake transport/request observations prove dispatch bounds, not only counts of yielded records;
- no credentials, network calls, bucket changes, or large physical test fixtures are needed.

Package proof:

```text
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-cloudflare
deno task check
deno task test
```

## Implementation decisions and verification evidence

- `m.Files/u/enumeration.ts` owns complete finite policy validation, frozen defaults/ceilings, and
  sticky operation-local counters. `m.Files/m.create.ts` creates one budget per command and shares
  it through runtime helpers; no result-page option enlarges it.
- An operation-local S3 client overrides only the pinned client's public `makeRequest` seam to
  invoke the bucket's `beforeRequest` hook. Signing and parsing remain upstream-owned. Full-index
  scans omit `maxResults`; a successful uncapped iterator end establishes completion under the
  pinned parser's existing semantics. Existence probes retain their explicit one-record cap.
- Records and UTF-8 keys are charged before retention, including duplicates and discarded records.
  Index admission charges root, synthetic directories, files, and duplicated logical path slots.
  Removal also reserves target/result paths before retention and completes collision/policy
  preflight before mutation. Manifest content-reference paths share the same budget.
- Limit errors use `Err.normalize` so existing Cmd transports the redacted message rather than
  `[object Object]`. The driver recognizes both native and standard R2 errors locally; no generic
  Files error union or Cmd wire contract changes.
- Custom buckets must honor request accounting and uncapped exhaustion. The Deploy R2 test fixture
  was adjusted to call the hook; no Deploy production code or publication policy changed.
- `README.md` documents defaults, ceilings, logical accounting, and excluded guarantees: upstream
  XML/page buffering, arbitrary-key/parser correctness, process RSS, redirects, output metadata/URL
  bytes, elapsed time, atomic deletion, and concurrent-writer snapshots are not bounded by this fix.

Executed from `code/sys.driver/driver-cloudflare`:

```text
deno task test
deno task check
deno task dry
```

Results: 9 suites / 76 steps passed; package type-check and publication dry run passed. The two new
focused suites contain 29 steps covering default/explicit limits, hidden empty/short continuations,
terminal-page request cost at exact object capacity, operation isolation, filters, UTF-8/index/path
admission, deletion preflight/partial failure, probe closure, and direct/Cmd refusal. Driver
changed-file format checks and TypeScript lint passed. These deterministic tests use fake objects
and scoped Fetch fixtures, not live R2 credentials or operations.

Consumer regression, executed from `code/sys.tools`:

```text
deno task test:deploy --filter='R2 Provider: push'
```

Result: 1 suite / 25 steps passed; 33 other suites filtered out. This includes unchanged publishing,
API-reading a remote manifest without `readOrigin`, missing-file repair, and stale pruning using
injected storage. No live upload/readback or independent blind/MAX review is established by these
checks. The consumer fixture passes formatting; its separate lint run reports three pre-existing
`require-await` findings in unchanged `send`, `list`, and `remove` methods. Those unrelated fixture
methods were left unchanged. No dependency or permission change is part of the fix.

## Limits and stop conditions

Finite budgets provide safe refusal, not scalable pagination. Truly incremental enumeration is a
later requirement only when a real consumer needs larger namespaces. A provider object limit is not
a Files entry limit because filtering and synthetic directories change the result set. Any future
continuation design must preserve those semantics and remain honest under dynamic mutation.

Stop and narrow/replan under the driver owner if the budget cannot reach the actual dispatch/index
boundary, removal would mutate before complete admission, or the fix needs generic Files/Cmd
changes, a dependency upgrade, or a broad pagination framework. None of those uncertainties becomes
a new gate on the separately bounded first delivery. Enumeration budgets do not by themselves fix
raw-key/Files-path projection aliases; that remains a separately owned driver concern, not an added
implementation item here. Planning grants no implementation or remote authority.

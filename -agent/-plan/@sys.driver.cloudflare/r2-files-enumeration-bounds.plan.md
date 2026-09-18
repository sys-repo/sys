r2-files-enumeration-bounds.plan.md
- [ ] fix(driver-cloudflare): bound R2 Files enumeration work

## Purpose and scheduling

Harden the already-landed R2 Files backing without changing its Files/Cmd grammar or pretending
result pagination bounds provider work. This is one independently useful driver fix, not a new
publication layer or a prerequisite for the conditional R2 harness, generation publisher, or direct
public HTTPS delivery. Those paths do not use the whole-prefix Files index.

Keep the delivery sequence in
[r2-dist-generation-publication.plan.md](../@sys.tools/r2-dist-generation-publication.plan.md) and
[r2-web-exposure.plan.md](r2-web-exposure.plan.md) unchanged. This separate ledger records the
accepted enumeration work without falsely inserting it into either protocol's dependency chain. Do
not use the current adapter over an arbitrarily large or untrusted namespace on the assumption that
a small Files page limit makes the operation cheap.

## Evidence and owner

The backing landed in `28faad7b4 feat(driver-cloudflare): add R2 Files backing`. Its completed
former plan is recoverable at `bd7d0e6c7` and was removed by `dd5bd2450`; this correction does not
reopen it.

Current owners under `code/sys.driver/driver-cloudflare/src/m.r2/`:

- `m.Files/u/runtime.ts`: `readIndex` collects the complete backing prefix; `descendantObjects`
  collects descendants unless supplied a limit.
- `m.Files/u/entry.ts`: `buildEntryIndex` synthesizes directories and detects file/tree collisions.
- `m.Files/u.cmd/list.ts` and `manifest.ts`: build the index, filter/sort it, then page the result.
- `m.Files/u/page.ts`: the cursor is an offset into the reconstructed visible result, not a provider
  continuation token. Every page can repeat the full scan.
- `m.Files/u.cmd/remove.ts`: enumerates descendants and validates every target's removal policy
  before deletion; preserve that preflight ordering.
- `u/u.transport.s3.ts`: delegates listing to the pinned S3 client with `maxResults` and `pageSize`.
  The bucket currently exposes an async iterable, not page/request-budget accounting.

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

## Limits and stop conditions

Finite budgets provide safe refusal, not scalable pagination. Truly incremental enumeration is a
later requirement only when a real consumer needs larger namespaces. A provider object limit is not
a Files entry limit because filtering and synthetic directories change the result set. Any future
continuation design must preserve those semantics and remain honest under dynamic mutation.

Stop and narrow/replan under the driver owner if the budget cannot reach the actual dispatch/index
boundary, removal would mutate before complete admission, or the fix needs generic Files/Cmd
changes, a dependency upgrade, or a broad pagination framework. None of those uncertainties becomes
a new gate on the independent conditional experiment. Planning grants no implementation or remote
authority.

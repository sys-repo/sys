# Handoff: Packet D landed; UI entry seam remains separate

## Status
This note captures the last useful thread context before compaction trouble.

## Landed / working lane
Packet D narrow first slice was implemented in `@sys/driver-vite` and validated locally.

### Intent
Persistent **dev-only** transform cache for **remote immutable transported modules** under Vite cache ownership.

### Touched files
- `code/sys.driver/driver-vite/src/m.vite.transport/u.cache.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/u.load.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/u.specifier.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/t.internal.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/-test/-u.load.test.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/-test/-u.resolve.test.ts`

### Behavior now covered
- cache root derived from resolved Vite `cacheDir`
- cache stored under `<cacheDir>/.sys-driver-vite/transport/`
- dev/browser transport only
- remote immutable modules only
- no persistent resolve cache in this packet
- bypasses build transport
- bypasses local workspace-style modules
- misses when rewritten dependency targets change
- explicit direct tests for `canonicalRemoteSpecifier(...)`

### Validation run that passed
From `code/sys.driver/driver-vite`:

```bash
deno check ./src/m.vite.transport/u.cache.ts ./src/m.vite.transport/u.load.ts ./src/m.vite.transport/u.resolve.ts ./src/m.vite.transport/u.specifier.ts ./src/m.vite.transport/-test/-u.load.test.ts ./src/m.vite.transport/-test/-u.resolve.test.ts

deno task test --trace-leaks ./src/m.vite.transport/-test/-u.resolve.test.ts ./src/m.vite.transport/-test/-u.load.test.ts
```

### Current commit message guidance for this lane
```text
perf(driver-vite): cache remote dev transport transforms under vite cache
```

## Important separation
A separate UI/package-level experiment happened while checking dev startup feel in:
- `code/sys.ui/ui-react-components`

That work is **not** part of Packet D and should not ride along with the driver-vite cache commit.

## Separate red / seam
The `ui-react-components` dev startup path exposed a real upstream/toolchain seam around Vite 8 / `vite:oxc` / rolldown typed entry handling.

Observed failure families included:
- direct HTML entry to `./-test/entry.tsx`
- direct HTML entry to `./-test/entry.ts`
- inline HTML module import producing `index.html?html-proxy&index=0.js`

Representative errors seen:
- `Failed to recover TsconfigCache type from napi value`
- `Plugin: vite:oxc`
- file examples:
  - `src/-test/entry.tsx`
  - `src/-test/entry.ts`
  - `src/index.html?html-proxy&index=0.js`

## Key conclusion from that debug pass
This UI entry seam is:
- **not** caused by Packet D transport cache work
- **not** yet resolved doctrinally
- a separate upstream/toolchain/pattern-boundary issue

The strongest STIER conclusion was:
- do **not** contaminate the Packet D landing with this entry experimentation
- treat UI entry/OXC seam as a separate lane
- if entry is a system pattern, any workaround must be judged at pattern level, not as an isolated local exception

## UI entry experiment state
Files that were experimented with during the thread:
- `code/sys.ui/ui-react-components/src/-test/entry.app.tsx`
- `code/sys.ui/ui-react-components/src/-test/entry.tsx`
- `code/sys.ui/ui-react-components/src/index.html`

The user explicitly rejected ugly/ad hoc shim doctrine and pushed hard on entry-pattern uniformity.
The thread conclusion was to **back out / separate** these UI entry experiments rather than mixing them into the cache lane.

## Recommended next actions
1. Keep / commit Packet D separately if repo state is still clean for that lane.
2. Do **not** mix `ui-react-components` entry experimentation into the Packet D commit.
3. Open a separate investigation for the Vite 8 / OXC typed-entry seam if needed.
4. After Packet D is landed, remeasure the real call site with:

```bash
SYS_DRIVER_VITE_PERF=1 deno task dev
```

and compare:
- first cold run
- second fresh restart after cache warm

## Misc note
Compaction failed with:
- `Compaction failed: Summarization failed: error reading a body from connection`

This was judged likely to be transient infra/connection trouble, not repo code.

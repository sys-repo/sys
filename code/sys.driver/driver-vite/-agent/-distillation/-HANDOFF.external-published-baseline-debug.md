# HANDOFF — external published baseline debug

## Purpose
This handoff isolates the current local red state in the external published-boundary lane so it can be debugged in a separate thread without contaminating the main Phase 0 / Phase 1 implementation campaign context.

## Primary package
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite`

## Primary command under debug
```bash
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno task test:external
```

## What this is
This is a debug thread for:
- local failure in the external published-boundary test lane
- especially published JSR `@sys/driver-vite` consumption from external call-site scenarios

## What this is not
This is **not** the Phase 1 refactor thread.
It is not about splitting:
- projection
- delivery
- coordinator

That work has not begun yet.

---

## Current known truth

### No local refactor changes caused this
At the point this debug handoff was created:
- no Phase 1 refactor had started
- no bootstrap/startup factoring changes had been made as part of the implementation campaign
- the failure was discovered during Phase 0 baseline freeze/classification

### The failing lane is the external published lane
The local red state came from:
- `deno task test:external`

Task wiring from `deno.json`:
```json
"test:external": "deno task test --trace-leaks ./src/m.vite/-test.external/mod.ts"
```

So the failing aggregate is:
- `./src/m.vite/-test.external/mod.ts`

### This lane consumes the published package, not the local working tree
Observed stack traces show execution through:
- `https://jsr.io/@sys/driver-vite/0.0.368/src/m.vite.transport/u.load.ts`
- `https://jsr.io/@sys/driver-vite/0.0.368/src/m.vite.transport/u.resolve.ts`

That means the external scenarios are exercising the **published package version**:
- `jsr:@sys/driver-vite@0.0.368`

not the local source tree directly.

This is the most important classification fact.

---

## Main observed failure signatures

### 1. esbuild / Deno runtime failure in published transport path
Representative failure:
```text
TypeError: Cannot read properties of undefined (reading 'unref')
    at ChildProcess.unref (ext:deno_node/internal/child_process.ts:443:19)
    at ensureServiceIsRunning (.../node_modules/esbuild/lib/main.js:2299:9)
    at transform (.../node_modules/esbuild/lib/main.js:2168:37)
    at loadDenoModule (https://jsr.io/@sys/driver-vite/0.0.368/src/m.vite.transport/u.load.ts:27:24)
```

### 2. unresolved published JSR driver import in external `vite.config.ts`
Representative warning:
```text
Could not resolve 'jsr:@sys/driver-vite@0.0.368' in vite.config.ts
```

### 3. external build assertions fail
Representative assertion:
```text
expect(build.ok).to.eql(true)
```
received false.

### 4. external dev assertion fails
Representative assertion:
```text
expected 500 to deeply equal 200
```

### 5. separate generated-workspace install failure was also seen earlier
Representative failure:
```text
npm error 404 Not Found - GET https://registry.npmjs.org/@jsr%2fdeno__loader - Not found
```
for:
- `@jsr/deno__loader@^0.5.0`

This may be a separate local/environment/package-resolution issue.

---

## Important local experiment already attempted
A local experiment changed:
- `src/m.vite.transport/u.load.ts`

from async:
- `transform(...)`

to sync:
- `transformSync(...)`

This did **not** change the external published-lane failure, because the external lane was still loading:
- `https://jsr.io/@sys/driver-vite/0.0.368/...`

So the experiment was useful only as classification:
- local source edits do not affect the currently failing published external lane.

---

## BMIND classification
The local external red state is currently best understood as one or more of:

1. published package behavior issue in `0.0.368`
2. local Deno / Node-compat / esbuild runtime drift
3. local environment mismatch vs green cloud CI
4. package-resolution / registry drift in generated external worlds

This is **not yet** evidence that the local planned refactor campaign is blocked on source architecture.

---

## Clean debug questions

### Question 1
Is the `unref` crash fundamentally:
- a local Deno runtime regression/drift
- or a published package implementation issue in the transport layer?

### Question 2
Is the failing async esbuild service path avoided by:
- `transformSync`
- or some other esbuild invocation change?

### Question 3
If a local fix exists, how should it be validated?
Options:
- reproduce in a local scenario that does not depend on JSR published package loading
- patch a local fixture to consume local source instead of published package
- or publish a fixed version and rerun the external lane honestly

### Question 4
Why is cloud CI green while local is red?
Check for:
- Deno version mismatch
- runtime/platform drift
- npm/jsr/cache drift
- registry/package availability differences
- fixture/environment differences

### Question 5
Should local Phase 0 for the implementation campaign treat this as:
- a classified external published-lane issue
rather than
- a blocker on beginning local Phase 1 factoring?

---

## Suggested debug sequence

### 1. Confirm exact local Deno/runtime/tool versions
Capture:
```bash
deno --version
node --version
npm --version
```

### 2. Re-run the smallest failing external world first
Prefer one targeted file rather than the full aggregate, e.g.:
```bash
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno task test --trace-leaks ./src/m.vite/-test.external/-baseline.ts
```
or:
```bash
deno task test --trace-leaks ./src/m.vite/-test.external/-ui-components.ts
```

### 3. Confirm whether the failure path is always the published JSR package
Look for stack traces referencing:
- `https://jsr.io/@sys/driver-vite/0.0.368/...`

### 4. Inspect fixture inputs
Relevant fixture/sample files include:
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/-test/vite.sample-published-baseline/vite.config.ts`
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/-test/vite.sample-published-ui-baseline/vite.config.ts`
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/-test/vite.sample-published-ui-components/vite.config.ts`

These use:
- `jsr:@sys/driver-vite@0.0.368`

### 5. Decide the right proof path
Choose one:
- local debug-only fixture path against local source
- published-package reproduction path
- environment parity investigation

Do not blur them.

---

## Files likely relevant to the debug

### Local source reference
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/m.vite.transport/u.load.ts`
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/m.vite.transport/u.resolve.ts`
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/m.vite/u.wrangle.ts`
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/deno.json`

### External lane aggregate
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/m.vite/-test.external/mod.ts`

### Published external scenarios
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/m.vite/-test.external/-baseline.ts`
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/m.vite/-test.external/-ui-baseline.ts`
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/m.vite/-test.external/-ui-components.ts`
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/m.vite/-test.external/-repo-generated.workspace.ts`

### Published sample vite configs
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/-test/vite.sample-published-baseline/vite.config.ts`
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/-test/vite.sample-published-ui-baseline/vite.config.ts`
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/-test/vite.sample-published-ui-components/vite.config.ts`

---

## Current published acceptance state after `@sys/driver-vite@0.0.371`
The newest published line materially changed the failure shape.

### What improved
The earlier published external build failures were dominated by esbuild JS API startup problems such as:
- `unref`
- `startSyncServiceWorker`

After publishing the transport change that runs transforms through the esbuild binary, the primary visible failure is no longer that worker/service startup family.

### Current primary failure
The published external lanes now fail on a concrete esbuild binary spawn path that does not exist.
Representative failure:
```text
NotFound: Failed to spawn '.../node_modules/.deno/@esbuild+darwin-arm64@0.27.5/node_modules/@esbuild/darwin-arm64/bin/esbuild': No such file or directory (os error 2)
```

Observed stack:
- `https://jsr.io/@sys/driver-vite/0.0.371/src/m.vite.transport/u.load.ts`
- `https://jsr.io/@sys/driver-vite/0.0.371/src/m.vite.transport/u.resolve.ts`

This is a narrower and more actionable failure than the earlier `unref` crash family.
It suggests the binary-exec direction is correct, but the published external world is still computing or inheriting the wrong esbuild binary path.

### Current version-mismatch truth
In the same failing external worlds, the temp consumer environment is initializing:
- `esbuild@0.28.0`
- `@esbuild/darwin-arm64@0.28.0`

But the spawned binary path points at:
- `@esbuild/darwin-arm64@0.27.5`

So the current published-boundary failure is best classified as a concrete esbuild binary path/version mismatch, not as a bootstrap-architecture failure.

### Current dev-lane interpretation
The remaining external dev `500` failures are likely the same transport failure surfacing at module-load time:
- HTML and startup can succeed
- entry/module fetch then fails because the transport transform path is broken

So the dev red should be treated as part of the same narrowed transport-path issue until proven otherwise.

### Still-separate external issue
The generated-workspace lane still has the separate npm/registry failure:
```text
npm error 404 Not Found - GET https://registry.npmjs.org/@jsr%2fdeno__loader - Not found
```
for:
- `@jsr/deno__loader@^0.5.0`

This remains a distinct proof-world problem and should not be conflated with the esbuild binary-path mismatch.

### Current state after closeout fixes
The earlier published external reds described in this handoff are now resolved locally.

#### What is now green
- published baseline build/dev world
- published `ui-baseline` build world
- published `ui-components` build/dev world
- published minimal-crutch build/dev world
- generated-workspace bootstrap/install + build world
- aggregate external lane via `deno task test:external`

#### What changed to get here
The decisive closeout fixes were narrow and lane-owned:
- published transport/esbuild path corrections already reflected in the current line
- published fixture truth updates for `@sys/ui-react-components/button`
- bounded external dev proof shaping where the earlier crawl was broader than the claim
- generated-workspace bootstrap corrected from raw npm install mechanics to the generated repo's Deno-owned install flow
- minimal-crutch probe execution corrected to run through the test preset rather than an ad hoc `deno eval` subprocess shape

#### Current interpretation
This handoff should now be read as historical debug context rather than an active red-state report.
The main architecture/rewrite line remained intact, and the local published external acceptance lane is now honest-green.

#### Why this still matters
This lane is still valuable because it is now the right outside-in baseline for later published-boundary performance work.
But the correctness/debug frontier documented earlier in this file has been crossed.

---

## Relationship to the main implementation campaign
The main implementation campaign remains:
- planning complete
- Phase 0 started
- external published lane classified red locally
- Phase 1 not yet started

This debug thread exists so the main campaign thread can stay focused on:
- baseline truth classification
- Phase 1 factoring discipline
- later proof-preserving redesign

without mixing in a separate published-package/runtime-environment debug problem.

---

## Outcome of this debug thread
This thread reached outcome 4.

### 4. local external lane restored green
The local external lane is restored green with explicit explanations for the decisive closeout moves:
- generated-workspace failure was owned by bootstrap verb/mechanics
- minimal-crutch red was owned by fixture/protocol execution shape plus bounded dev-proof shape
- aggregate `deno task test:external` is now green locally

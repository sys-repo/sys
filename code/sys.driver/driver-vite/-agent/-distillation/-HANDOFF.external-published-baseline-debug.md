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

## Desired outcome of this debug thread
Reach one of these explicit outcomes:

1. **local environment issue confirmed**
   - with clear reproduction and local-only explanation

2. **published package issue confirmed**
   - with a concrete local-source fix candidate
   - and a clear statement that external published tests require a republish to validate

3. **fixture/protocol issue confirmed**
   - with a clean explanation of why local baseline should classify it separately

4. **local external lane restored green**
   - with explicit explanation of what changed and why

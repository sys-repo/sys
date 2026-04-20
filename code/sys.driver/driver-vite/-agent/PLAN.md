# EVERGREEN NOTES — driver-vite Vite 8 / Deno hardening

## Scope

- Package: `code/sys.driver/driver-vite`
- Purpose of this note: retain only the durable invariants and proof posture from the Vite 8 hardening line.

## Landed truth

The Vite 8 adaptation line is complete enough to treat as established behavior, not an open rescue campaign.

Key landed results:
- Vite 8 config evaluation was adapted to run truthfully under Deno.
- Child build/dev runtime was stabilized under real permissions.
- Workspace import authority is merged into the Vite bootstrap path where required.
- Dev-only Deno transport ids are kept out of production bundles.

Representative landed commits:
- `fix(driver-vite): adapt config seams for vite 8 under deno`
- `fix(driver-vite): stabilize vite 8 child build and dev runtime`
- `refactor(driver-vite): narrow local common import surfaces`
- `test(driver-vite): align transport prefix tests with current plugin context`
- `fix(driver-vite): merge workspace import authority into vite bootstrap`
- `fix(driver-vite): keep dev-only deno transport ids out of production bundles`

## Evergreen invariants

### 1. Bootstrap authority is its own seam
Keep bootstrap/import authority distinct from app/plugin resolution concerns.
Do not casually collapse those layers in the name of cleanup.

### 2. Vite 8+ uses `--configLoader=native`
This is an earned compatibility seam, not a style preference.

### 3. Vite 7 remains on the default config-loader path
Do not back-port the Vite 8 loader choice without fresh evidence.

### 4. Dev and build transport paths are intentionally different
- dev path => browser ids
- build path => encoded Deno specifiers

If these are conflated again, built assets can leak dev-only ids and fail under static serving.

### 5. Keep proven runtime seams over speculative rewrites
When a seam is empirically required and covered by proof, preserve it until replacement is equally proven.
Reject clean-room rewrites that erase boundary knowledge without buying a concrete win.

## Explicitly rejected paths

These were examined and should stay rejected unless new evidence appears:
- mirrored test-local `@sys/driver-vite` bridge rewrite
- Vite 8 `--configLoader=runner`
- transport/bootstrap rewrites done only for cleanliness after the proofs were already green

## Verification posture

Run from:

```bash
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
```

Focused proof baseline:

```bash
deno task test --trace-leaks ./src/m.vite.transport/-test/-u.load.test.ts ./src/m.vite.transport/-test/-u.resolve.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-build.transitive-jsr.test.ts
```

Broader branch CI remains the merge/backstop proof.

## Decision rule for future edits

1. If a failure appears, classify it before editing.
2. If it is the same solved seam, do not reopen it casually.
3. If it is genuinely new, isolate it narrowly and preserve the invariants above.
4. Keep unrelated toolchain or dependency noise out of the runtime line unless it is reproducibly blocking.

## Non-goals carried forward

- do not reopen the earlier package-build sweep by default
- do not reopen speculative published-fixture config-path experiments pre-publish
- do not mix transient upstream warnings into this runtime line unless they are causal
- do not rewrite the transport layer just because it is now understandable

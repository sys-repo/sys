# Driver Pi Public Surface and Profile Path Plan

## Status

Open live plan. Public export polish is landed in the working tree; profile/runtime path
migration is next.

This follows the README / JSR summary cleanup and should be executed as small mechanical commits.
No compatibility aliases: this is greenfield cleanup.

## Goal

Make `@sys/driver-pi` read as a clean package surface:

- root at `@sys/driver-pi` exports the core `Pi` surface
- core at `@sys/driver-pi/core`
- CLI at `@sys/driver-pi/cli`
- root executable aliases to the CLI entrypoint
- profile/runtime paths migrated only after the public import shape is settled

## 0. Done: README / JSR summary

- README now states the package plainly:
  - `A typed Deno boundary for running Pi as a profile-driven system agent.`
- Conceptual Primitives remain near the top as package framing.
- Historical starting truth was documented before export cleanup:
  - CLI import/invocation used `@sys/driver-pi/pi/cli`
  - core import used `@sys/driver-pi/pi`
  - profiles still resolve to `-config/@sys.driver-pi.pi/<name>.yaml` until step 3

## 1. Done: move CLI export path

Goal: remove redundant `/pi/cli` from the CLI surface.

Change:

```txt
@sys/driver-pi/pi/cli        → @sys/driver-pi/cli
jsr:@sys/driver-pi@x/pi/cli → jsr:@sys/driver-pi@x/cli
```

Update:

- `code/sys.driver/driver-pi/deno.json` exports
- `code/sys.tools` passthrough target and generated `src/cli.pi/mod.ts`
- root passthrough registry
- help text
- README
- existing tests only

Do not migrate profile config dirs in this step.

Landed shape:

- `@sys/driver-pi/cli` is the public CLI subpath.
- `@sys/tools pi` delegates to `@sys/driver-pi/cli`.
- The legacy public `./pi/cli` export is removed.

## 2. Done: decide and move core export path

Previous core path was redundant:

```txt
@sys/driver-pi/pi
```

Landed final shape:

```txt
@sys/driver-pi       # root package surface; exports Pi and pkg
@sys/driver-pi/core  # core package surface
@sys/driver-pi/cli   # CLI surface
```

Root executable polish also landed:

```sh
deno run -A jsr:@sys/driver-pi  # alias to /cli
```

Root dynamically imports the CLI only under `import.meta.main`; the CLI-owned process entry seam
lives in `src/m.core/m.cli/-entry.ts` and routes `Profiles ...` to the profile launcher.

## 3. Next: migrate profile/runtime paths

After public import paths settle, migrate the package-owned local state names.

Current:

```txt
-config/@sys.driver-pi.pi/<name>.yaml
.log/@sys.driver-pi.pi/
```

Likely final:

```txt
-config/@sys.driver-pi/<name>.yaml
.log/@sys.driver-pi/
```

Principled migrator requirements:

- Use the canonical `-config` name/path formatter; do not hard-code profile config directory
  strings at call sites.
- Scan existing path construction and converge on one canonical DRY profile path generator.
- Detect old profile dir.
- If new dir is absent, move or copy old profiles to the new dir.
- If both old and new exist with overlapping profile names, do not overwrite; report conflict clearly.
- Preserve YAML bytes except for migrations already owned by the existing profile YAML migrator.
- Emit one clear message when migration occurs.
- Ensure profile resolution uses the new path after migration.

Tests should cover:

- old only → new profile dir materialized
- new only → no-op
- old and new with conflicting names → no clobber, clear conflict
- menu/direct profile resolution uses the new path after migration
- sandbox report log dir uses the new path/name

## Verification checkpoints

For each commit:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-pi && deno task test
cd /Users/phil/code/org.sys/sys/code/sys.tools && deno task test
cd /Users/phil/code/org.sys/sys && deno task prep
```

Run full root test only as a final broad confirmation if needed.

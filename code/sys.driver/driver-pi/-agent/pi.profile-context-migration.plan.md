# Pi profile context migration plan

Status: open live TODO, pre-implementation, scoped to compatibility only.

Keep this plan local to `driver-pi/-agent` until the profile-context compatibility migration is implemented. Delete it in the implementation commit once tests cover the migration path.

## Decision

Move persisted Pi profile context config from legacy `include` to `append`:

```yaml
sandbox:
  context:
    append: []  # extra files loaded after ./AGENTS.md and ./SYSTEM.md
```

The runtime model is intentionally small:

- Standard context is always attempted from the profile git root:
  - `./AGENTS.md`
  - `./SYSTEM.md`
- Missing standard files are ignored.
- `append` is extras only; it does not replace or disable standard context.
- No vendor/product context file names are probed.
- Upstream Pi context discovery remains disabled with `--no-context-files`.

## Compatibility problem

Old generated profile YAMLs may contain:

```yaml
sandbox:
  context:
    include: []
```

The project does not need a heavy data migration system here. The practical requirement is simply: old generated profiles must not break, and should be rewritten into the new default shape.

## Migration policy

Add a tiny numbered compatibility migration local to `m.cli.profiles`, following the existing `@sys/tools` shape without overbuilding it:

- `u.migrate.ts` — orchestrator.
- `u.migrate.-01.ts` — normalize legacy `sandbox.context.include` to `sandbox.context.append`.
- Future migrations append as `u.migrate.-02.ts`, `u.migrate.-03.ts`, etc.

This keeps compatibility out of schema, prompt resolution, menu logic, and runtime launch logic.

## Migration 01: generated default shape

For each YAML document:

1. Parse YAML as a record.
2. Locate `sandbox.context.include`.
3. If `include` is absent, skip.
4. If `include` is an array and `append` is absent, rename it to `append`.
5. If both `include` and `append` exist, delete `include` and preserve `append`.
6. Write back only when changed.

Expected real-world rewrite:

```diff
 sandbox:
   context:
-    include: []
+    append: []
```

Intentional semantic result:

- Old generated profiles load.
- Files are normalized to the new default profile shape.
- Standard `./AGENTS.md` and `./SYSTEM.md` load under the new policy.

## Load boundaries

Run migrations before strict validation at all profile entry gates:

1. Direct launch:
   - `resolveRun(...)` migrates the selected config file before `ProfilesFs.validateYaml(...)`.
2. Profile menu:
   - `menu(...)` migrates the profile directory before rendering profile choices.
   - `resolveRun(...)` remains the final file-level guard before sandbox preview or launch.
3. Default bootstrap:
   - freshly generated profiles already use `append`; migration is harmless/idempotent.

## API shape

Use local result types compatible with `t.YamlConfig.Migrate.DirResult`:

```ts
type MigrationMove = { from: t.StringPath; to: t.StringPath };
type MigrationResult = { migrated: MigrationMove[]; skipped: MigrationMove[] };
```

Suggested surface:

```ts
export const ProfileMigrate = {
  async file(path: t.StringPath): Promise<MigrationResult>;
  async dir(cwd: t.StringDir): Promise<MigrationResult>;
};
```

`dir(cwd)` scans `ProfilesFs.dir` for `*${ProfilesFs.ext}` and applies migrations in order.
`file(path)` supports `--config <path>` outside the standard profile directory.

## Tests

Add focused compatibility coverage:

- generated legacy `include: []` becomes `append: []`.
- running migration twice is idempotent.
- invalid YAML is skipped, not clobbered.
- direct profile run with legacy `include: []` succeeds after migration.
- profile menu can render legacy generated files after directory migration.

## BMIND checks

Security:

- Migration does not add child Deno read permissions.
- Context loading remains wrapper-owned.
- No ambient walk-up or vendor/product probes are introduced.

Data safety:

- Only YAML files under the profile directory are scanned by directory migration.
- Direct `--config` migrates only the requested file.
- Unparseable or ambiguous YAML is skipped rather than rewritten.
- Write happens only when a deterministic change is made.

Design stability:

- Schema remains strict and future-facing (`append` only).
- Legacy support is isolated in numbered migrations.
- Future migrations follow the same chain instead of adding ad hoc compatibility branches.

## Pre-implementation readiness

Ready to implement.

Implementation choice:

- Use parse/stringify like current `@sys/tools` migrations. This may normalize YAML formatting/comments, but the expected legacy case is generated YAML with `include: []`; deterministic compatibility is more important than preserving comments during this one-time normalization.

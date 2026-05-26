# Canonical npm overrides in deps.yaml generation

## Direct answer

This is partly in `@sys/workspace`, but the canonical implementation belongs one layer lower.

- `@sys/workspace` owns the prep orchestration:
  - `code/sys/workspace/src/m.prep/m.Deps.ts`
  - calls `DepsBase.from(...)`, `DepsBase.applyDeno(...)`, and `DepsBase.applyPackage(...)`.
- `@sys/esm/deps` owns the canonical dependency manifest API and projection logic:
  - `code/sys/esm/src/m.deps/t.ts`
  - `code/sys/esm/src/m.deps/u.from.ts`
  - `code/sys/esm/src/m.deps/u.toYaml.ts`
  - `code/sys/esm/src/m.deps/u.toJson.package.ts`
  - `code/sys/esm/src/m.deps/u.applyPackage.ts`
- `@sys/types` owns the shared package-json shape:
  - `code/sys/types/src/t/t.Pkg.ts`

So: wire through `@sys/workspace`, but do not make workspace prep the source of truth. The source of
truth should be the `@sys/esm/deps` manifest model.

## Deno API read: what is now possible

Deno 2.8 gives two relevant surfaces:

1. `deno audit fix` / `deno audit --fix`
   - Upgrades vulnerable direct npm dependencies where Deno can do so within constraints.
   - Does not solve every transitive vulnerability.
   - Does not do risky major-version transitive overrides for a parent package that has not updated
     its declared range.

2. `package.json` `overrides`
   - Deno exposes npm-style `overrides`; the spike proved the Deno 2.8 behavior across install,
     lockfile resolution, `deno audit`, and `deno why` for this mitigation.
   - This is the correct API for forcing transitive dependency versions when the direct parent is
     already current or has not yet published a patched dependency range.
   - Parent-scoped overrides are preferable for security exceptions because they avoid unnecessarily
     rewriting unrelated parts of the tree. The spike also proved global overrides work, but they are
     intentionally not used for the final repo policy.

For this repo, `deno audit fix` is not enough because the remaining issues are under current direct
packages:

- `monaco-editor@0.55.1` pins `dompurify@3.2.7`.
- `@automerge/automerge-repo@2.5.6` depends on `uuid@^9.0.0`.

## Final status

The dependency-policy generation path is implemented and the workspace pass-through is landed:

- `@sys/esm/deps` parses, preserves, and projects package override policy.
- `@sys/workspace` passes `manifest.data.packageJson` through prep instead of owning the policy.
- Commit `1550a0918 feat(workspace): pass deps package policy through prep` landed the workspace
  orchestration seam.

Landed commits for this arc:

- `49278a63b refactor(types): model package-json overrides`
  - Adds the shared recursive `PkgNodeOverrides` shape.
- `ad02fa67a feat(esm): preserve package override policy in deps state`
  - Parses, validates, merges, clones, and round-trips package override policy.
- `f319ea3a0 feat(workspace): pass deps package policy through prep`
  - Despite the subject, this is the ESM projection commit: package policy flows into
    `toPackageJson`, `applyPackage`, and `applyFiles`.
- `1550a0918 feat(workspace): pass deps package policy through prep`
  - Workspace prep passes `manifest.data.packageJson` into `DepsBase.applyPackage(...)`.

The final root chore is landed:

- `041f3243b chore(deps): apply npm overrides and refresh lockfile` updates root `deps.yaml`,
  generated `package.json`, and fresh `deno.lock`.
- Generated root `package.json.overrides` is present from `deps.yaml` with parent-scoped override
  policy.
- The old root `deno.lock` retained vulnerable transitive entries after overrides were first added;
  that stale lock reported `monaco-editor@0.55.1 > dompurify@3.2.7` and
  `@automerge/automerge-repo@2.5.6 > uuid@9.0.1`.
- Regenerating the root lock from a fresh resolver graph resolves `dompurify@3.4.0` and
  `uuid@11.1.1`; `deno audit` is green.
- `c6b6430d6 plan(create): npm overrides` preserves this plan as the historical arc record.

Resolver spike findings:

- Fresh minimal `package.json` fixtures prove Deno 2.8 does apply both parent-scoped and global
  overrides for these targets in the audit path.
- Fresh `monaco-editor@0.55.1` plus parent-scoped `monaco-editor -> dompurify: 3.4.0` resolves
  `dompurify@3.4.0`; `deno audit` is green.
- Fresh `@automerge/automerge-repo@2.5.6` plus parent-scoped
  `@automerge/automerge-repo -> uuid: 11.1.1` resolves `uuid@11.1.1`; `deno audit` is green.
- Stale-lock fixtures show `deno install --reload` updates the lockfile `workspace.packageJson`
  override metadata but does not recompute the existing npm transitive graph.
- A root fresh-lock probe using `--lock` outside the repo resolves `dompurify@3.4.0` and
  `uuid@11.1.1`; `deno audit --lock <fresh-lock>` is green.

## BMIND position

First principle: `deps.yaml` is not just an import list. It is the canonical dependency policy for
this workspace. Generated files must be projections of that policy, not places where policy is
quietly patched after generation.

Therefore npm overrides are dependency policy and must be represented canonically in `deps.yaml`.
The generated `package.json` should then be a pure projection of that policy.

Do not model overrides as normal dependencies. They are not imports, they are resolver policy.
Preserve that distinction in the API.

## TMIND adversarial review

### Failure mode: global override looks simple but is too blunt

A global override like this is not S-tier:

```json
{
  "overrides": {
    "dompurify": "3.4.0",
    "uuid": "11.1.1"
  }
}
```

It may downgrade or rewrite unrelated consumers. In this repo, `uuid@14.0.0` is also present via
another package path, so a global `uuid` override risks forcing a newer safe package backward to
`11.1.1`.

Use parent-scoped overrides first:

```json
{
  "overrides": {
    "@automerge/automerge-repo": {
      "uuid": "11.1.1"
    },
    "monaco-editor": {
      "dompurify": "3.4.0"
    }
  }
}
```

### Failure mode: generated package.json gets hand-edited

That creates drift. The next `deno task prep` can erase the security fix. The plan must make stale or
missing overrides impossible by generating them from canonical input.

### Failure mode: override support is lossy

If `Deps.from(...).data.toYaml()` drops overrides, the manifest API becomes unsafe. Round-trip must
preserve override policy.

### Failure mode: parser ignores malformed override items

Current dependency entries intentionally ignore unknown item keys. Overrides cannot be treated as
low-stakes unknown metadata. A malformed security override should fail closed with a clear parse
error.

### Failure mode: overfitting to this audit

The API should support npm override shape generically, not only `dompurify` and `uuid`. Keep the
manifest shape small, but do not hard-code package names or advisory IDs.

## Final TMIND refinements

- Treat override keys and string values as npm/Deno resolver grammar, not local semver grammar.
  Valid leaves may be exact versions, ranges, aliases like `npm:...`, or npm `$dependency` references.
  Do not over-validate beyond JSON shape and non-empty strings.
- Prefer parent-scoped overrides, but keep the schema capable of npm's broader override shape:
  global keys, version-qualified parent keys, nested child keys, and the special `.` key.
- Make canonical override policy replace generated `package.json.overrides`; do not preserve stale
  generated overrides from the previous file.
- Deep-merge multiple canonical override entries only when paths are disjoint. Duplicate leaf paths
  should fail closed, even if the value is the same, because duplicated security policy is ambiguity.
- Quote override version leaves in authored YAML examples and tests. If the YAML serializer later
  chooses plain scalars, the required invariant is round-trip type safety: override leaves must parse
  back as strings.
- Keep parsed override policy immutable-by-convention: clone and recursively sort before returning or
  projecting so callers cannot accidentally mutate canonical state.
- Do not rely solely on `deno why` for final proof. It is useful, but Deno can report no dependency
  path for some lockfile entries. The lockfile diff and `deno audit` result are the authoritative
  verification signals.
- Do not continue full-root prep/install iteration until a tiny resolver spike proves how Deno 2.8
  applies `package.json.overrides` to transitive dependencies in the audit path.

## STIER target shape

Keep the current array shape for `package.json` to minimize manifest churn, and add an explicit
single-purpose override entry:

```yaml
package.json:
  - import: npm:react@19.2.6
  - import: npm:react-dom@19.2.6
  - overrides:
      "@automerge/automerge-repo":
        uuid: '11.1.1'
      monaco-editor:
        dompurify: '3.4.0'
```

Projection target:

```json
{
  "dependencies": {},
  "devDependencies": {},
  "overrides": {
    "@automerge/automerge-repo": {
      "uuid": "11.1.1"
    },
    "monaco-editor": {
      "dompurify": "3.4.0"
    }
  }
}
```

Rules:

- Overrides are allowed only as direct entries under `package.json`.
- Override entries are resolver policy, not dependency entries.
- Use exact patched versions for security overrides unless there is a clear reason to use a range.
- Prefer parent-scoped overrides over global overrides.
- Sort override keys recursively for deterministic output.
- If no canonical overrides exist, generated `package.json.overrides` must be removed to avoid stale
  mitigation state.

## Implementation plan

### 1. Extend shared package-json types

File: `code/sys/types/src/t/t.Pkg.ts`

Add a recursive override shape and expose it from `PkgNodeJson`:

```ts
export type PkgNodeOverrides = { [key: string]: string | PkgNodeOverrides };

export type PkgNodeJson = {
  ...
  overrides?: PkgNodeOverrides;
};
```

Keep the type broad enough for npm/Deno override semantics. Do not attempt to semver-parse override
values at the type layer.

### 2. Extend the deps manifest model

File: `code/sys/esm/src/m.deps/t.ts`

Add a package policy object to parsed state:

```ts
export type PackageJsonPolicy = {
  readonly overrides?: t.PkgNodeOverrides;
};

export type State = {
  readonly entries: Entry[];
  readonly modules: t.EsmModules;
  readonly packageJson?: PackageJsonPolicy;
  toYaml(options?: YamlOptions): Yaml;
};
```

Add override support to YAML entries:

```ts
export type YamlEntry = {
  import?: t.StringModuleSpecifier;
  group?: YamlGroupName;
  subpaths?: t.StringDir[];
  name?: string;
  dev?: boolean;
  overrides?: t.PkgNodeOverrides;
};
```

### 3. Parse overrides fail-closed

File: `code/sys/esm/src/m.deps/u.from.ts`

- Collect overrides only from direct `package.json` list items.
- Reject overrides under `deno.json`.
- Reject overrides inside groups for the first pass.
- Reject an item that mixes `overrides` with `import` or `group`.
- Validate recursively:
  - object keys are non-empty strings;
  - values are strings or non-empty objects;
  - arrays, nulls, numbers, and booleans are invalid.
- Deep-merge multiple override entries only when paths are disjoint.
- Fail closed on duplicate override paths, rather than silently letting a later value win.
- Preserve npm override grammar as opaque strings; do not reject version-qualified keys, `.` keys,
  `npm:` aliases, or `$dependency` references.

### 4. Preserve overrides in YAML round-trip

File: `code/sys/esm/src/m.deps/u.toYaml.ts`

Extend `YamlOptions` with optional package policy:

```ts
export type YamlOptions = {
  groupBy?: CategorizeByGroup;
  packageJson?: PackageJsonPolicy;
};
```

`State.toYaml()` should render the parsed `packageJson` policy by default, while still allowing a
caller-supplied `options.packageJson` to intentionally replace it. The public `Deps.toYaml(entries)`
may remain dependency-entry-only by default, but it should be able to render overrides when passed
`{ packageJson }`.

Round-trip must not be lossy when the source manifest contained overrides.

### 5. Project overrides into generated package.json

Files:

- `code/sys/esm/src/m.deps/u.toJson.package.ts`
- `code/sys/esm/src/m.deps/u.applyPackage.ts`

Add optional package projection options:

```ts
export type PackageProjectionOptions = {
  packageJson?: t.EsmDeps.PackageJsonPolicy;
};

toPackageJson(entries, { packageJson });
applyPackage(path, entries, { packageJson });
```

Update the public `EsmDeps.Lib.applyPackage` signature and `ApplyPackageResult` so overrides are not
hidden side effects. Because `applyFiles(...)` is public for programmatic generation, give it the
same package policy path so `deps.yaml`, `imports.json`, and `package.json` can be projected from one
canonical state.

Behavior:

- Write `dependencies` and `devDependencies` as today.
- Write recursively sorted `overrides` when canonical overrides exist.
- Delete `overrides` when canonical overrides do not exist.
- Preserve unrelated top-level package fields as current `applyPackage` does.
- Do not preserve unrelated or stale existing `package.json.overrides`; generated override policy is
  canonical replacement, not a merge with old output.

### 6. Wire workspace prep through the canonical state

File: `code/sys/workspace/src/m.prep/m.Deps.ts`

Change workspace prep from passing only `manifest.data.entries` to also passing
`manifest.data.packageJson` into package projection.

Do not duplicate parsing or override logic in `@sys/workspace`.

### 7. Tests

Add or extend tests in:

- `code/sys/esm/src/m.deps/-test/-u.from.test.ts`
- `code/sys/esm/src/m.deps/-test/-u.toYaml.test.ts`
- `code/sys/esm/src/m.deps/-test/-u.apply.test.ts` or a package-specific test file
- `code/sys/workspace/src/m.prep/-test/-m.Deps.test.ts`

Required cases:

- Parses parent-scoped package overrides.
- Parses broader npm override grammar as opaque strings: version-qualified keys, `.` keys, `npm:`
  aliases, and `$dependency` references.
- Renders overrides into generated `package.json`.
- Recursively sorts override output.
- Removes stale generated overrides when absent from `deps.yaml`.
- Preserves overrides through `State.toYaml()` round-trip.
- Deep-merges disjoint override entries and fails duplicate override paths.
- Fails malformed override values.
- Fails overrides in `deno.json` or groups.
- Quotes scoped package keys correctly in YAML output, or otherwise proves the serialized YAML
  round-trips to string leaves.

### 8. Prove Deno resolver/audit override behavior in isolation

Before changing root dependency files again, run a throwaway spike outside the repo. This arc used
`/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/sys-npm-overrides-spike`. The spike should use
tiny package roots with hand-authored `package.json` files and no workspace prep.

Minimum matrix:

- `monaco-editor@0.55.1` with parent-scoped `monaco-editor -> dompurify: 3.4.0`.
- `monaco-editor@0.55.1` with global `dompurify: 3.4.0` if parent-scoped remains red.
- `@automerge/automerge-repo@2.5.6` with parent-scoped `@automerge/automerge-repo -> uuid: 11.1.1`.
- `@automerge/automerge-repo@2.5.6` with global `uuid: 11.1.1` if parent-scoped remains red.
- Version-qualified parent or child keys only if the first two forms fail.

For the first spike case run:

```sh
cd /var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/sys-npm-overrides-spike/monaco-parent-scoped
deno install --reload
deno audit
deno why npm:dompurify
deno why npm:uuid
```

Repeat the same command sequence from each concrete case directory that is created, such as
`/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/sys-npm-overrides-spike/monaco-global`,
`/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/sys-npm-overrides-spike/automerge-parent-scoped`,
and `/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/sys-npm-overrides-spike/automerge-global`.

Interpretation:

- If a form makes `deno audit` green and `deno why`/lockfile show the patched transitive version,
  translate only that proven form into `deps.yaml` and then regenerate root files.
- If an existing lock keeps the old graph after overrides are added, regenerate the root lock from a
  fresh resolver graph; `deno install --reload` alone is not sufficient for this Deno 2.8 case.
- If no form works in isolation, stop treating overrides as a reliable root audit mitigation and
  switch to direct-parent upgrades, upstream issue tracking, or an explicit accepted audit exception.

### 9. Apply the actual audit mitigation

After the API is landed and the resolver spike proves a working form, update root `deps.yaml` with
that proven override shape. The final repo policy uses parent-scoped overrides:

```yaml
package.json:
  - overrides:
      "@automerge/automerge-repo":
        uuid: '11.1.1'
      monaco-editor:
        dompurify: '3.4.0'
```

Then regenerate; do not hand-edit `package.json`.

## Verification plan

Use repo task authority and narrow checks first.

1. Targeted deps tests:
   ```sh
   cd /Users/phil/code/org.sys/sys/code/sys/esm
   deno task test --trace-leaks ./src/m.deps
   deno task check
   cd /Users/phil/code/org.sys/sys/code/sys/workspace
   deno task test --trace-leaks ./src/m.prep/-test/-m.Deps.test.ts
   deno task check
   ```

2. Resolver spike outside the repo:
   ```sh
   cd /var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/sys-npm-overrides-spike/monaco-parent-scoped
   deno install --reload
   deno audit
   deno why npm:dompurify
   deno why npm:uuid
   ```
   Repeat from any additional concrete spike directories that are needed.

3. Regenerate only dependency surfaces after a proven override shape:
   ```sh
   cd /Users/phil/code/org.sys/sys
   deno task prep:imports
   ```

4. Refresh lock resolution from a fresh graph:
   ```sh
   cd /Users/phil/code/org.sys/sys
   deno install --reload --lock /var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/sys-npm-overrides-spike/root-fresh.lock
   deno audit --lock /var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/sys-npm-overrides-spike/root-fresh.lock
   deno why --lock /var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/sys-npm-overrides-spike/root-fresh.lock npm:dompurify
   deno why --lock /var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/sys-npm-overrides-spike/root-fresh.lock npm:uuid
   ```
   After this probe is green, replace the tracked `deno.lock` by regenerating it from a fresh graph.
   Do not trust `deno install --reload` against the stale tracked lock for this override change.

5. Security verification:
   ```sh
   cd /Users/phil/code/org.sys/sys
   deno audit
   deno why npm:dompurify
   deno why npm:uuid
   ```

6. Full root prep and wider confidence pass only after audit is green or an explicit non-green
   acceptance is documented:
   ```sh
   cd /Users/phil/code/org.sys/sys
   deno task prep
   deno task check
   deno task test
   ```

## Acceptance criteria

- `deps.yaml` is the only hand-edited dependency policy surface.
- Generated `package.json` contains parent-scoped `overrides`.
- Generated `package.json` is stable after repeated `deno task prep`.
- `deno.lock` resolves `monaco-editor → dompurify@3.4.0` or newer patched version.
- `deno.lock` resolves `@automerge/automerge-repo → uuid@11.1.1` or another patched version without
  downgrading unrelated `uuid@14.x` consumers.
- `deno audit` reports zero findings, or any remaining finding is explicitly explained as outside
  override reach.
- Tests prove malformed override policy fails closed.

## Commit sequence

- [x] `49278a63b` `refactor(types): model package-json overrides`
- [x] `ad02fa67a` `feat(esm): preserve package override policy in deps state`
- [x] `f319ea3a0` ESM projection commit, landed with subject
  `feat(workspace): pass deps package policy through prep`
- [x] `1550a0918` `feat(workspace): pass deps package policy through prep`
- [x] `041f3243b` `chore(deps): apply npm overrides and refresh lockfile`
- [x] `c6b6430d6` `plan(create): npm overrides`

## Non-goals

- Do not redesign the whole deps manifest.
- Do not move dependency authority into `package.json`.
- Do not add package-name-specific hacks for `dompurify` or `uuid`.
- Do not use global overrides unless parent-scoped overrides are proven insufficient.
- Do not suppress audit findings as the primary remediation when a resolver override can safely fix
  them.
- Do not use root `deno task prep` as a resolver experiment loop; use a disposable spike first, then
  apply only a proven root dependency-policy change.

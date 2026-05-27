# Cell shell structure plan

## Position

The Cell concept is becoming earned enough to deserve a visible filesystem marker.

The current descriptor path is clear and standard-like:

```txt
<root>/-config/@sys.cell/cell.yaml
```

That was a good first move while `cell.yaml` was mostly package-owned configuration. But as `Cell`
becomes the primary boundary concept, hiding the descriptor under generic package config weakens the
DX. The shell should make the Cell explicit without moving normal project content into a metadata
folder.

Target direction:

```txt
<dir>/                 # Cell root / content boundary.
  data/*              # Normal content remains directly under the Cell root.
  src/*
  public/*
  ...

  -cell/              # Cell metadata/control capsule, not the content root.
    cell.yaml         # Cell descriptor/manifest.
    -config/*         # Cell-related owner/package configs referenced by the descriptor.
```

Short rule:

> The directory is the Cell. `-cell/` describes and configures the Cell.

## Why this is better DX

- `./-cell/cell.yaml` names the domain concept directly.
- The shell has a visible Cell marker, similar in spirit to `.git/` as repo metadata.
- `cell.yaml` reads as a descriptor/manifest, not just one package's config file.
- Subordinate config has a natural scoped home under `./-cell/-config/`.
- The design reinforces the existing DSL rule: do not turn `cell.yaml` into a mega-config.

## Vocabulary

Use these names consistently in code/docs:

```ts
cell.root        // <dir>/
cell.metaDir     // <dir>/-cell/
cell.descriptor  // <dir>/-cell/cell.yaml
cell.configDir   // <dir>/-cell/-config/
```

Avoid saying `-cell` is the Cell root. It is the Cell metadata/control directory.

## Proposed path semantics

### Canonical new paths

```txt
<root>/-cell/cell.yaml
<root>/-cell/-config/<owner>/*
```

### Legacy path

```txt
<root>/-config/@sys.cell/cell.yaml
```

Treat the legacy path as a migration fallback, not as the long-term canonical shape.

## Invariants

- Actual Cell content remains under `<root>/`, not under `<root>/-cell/`.
- `-cell/cell.yaml` stays small: identity, composition, trusted services, tasks, endpoint refs, and
  references to owner configs.
- Owner/package mechanics belong in `-cell/-config/*`, not in `cell.yaml`.
- Top-level `-config/*` remains available only for root/tool config that is not Cell-owned.
- If both old and new descriptor paths exist, fail clearly unless a migration command explicitly
  resolves the conflict.

## Migration sequence

- [x] `84f67f822` refactor(cell): add migration spine
- [x] Add central path helpers for Cell metadata paths.
- [ ] Make loading prefer `-cell/cell.yaml`.
- [ ] Add legacy fallback for `-config/@sys.cell/cell.yaml` with a clear migration note.
- [ ] Make `init` write only the new canonical path.
- [ ] Update templates and tests to use `-cell/cell.yaml`.
- [ ] Add a migration command or safe one-shot migration path if existing users need it.
- [ ] Later, after a compatibility window, remove the legacy fallback.

## CLI/DX changes

Examples should shift from:

```txt
create ./-config/@sys.cell/cell.yaml
```

to:

```txt
create ./-cell/cell.yaml
```

Help text should describe `cell.yaml` as the Cell descriptor/manifest and describe `-cell/-config/`
as the place for referenced owner configs.

## Acceptance checks

- New `cell init` creates `./-cell/cell.yaml`.
- Load/start/task flows resolve the canonical new descriptor.
- Legacy projects with `./-config/@sys.cell/cell.yaml` still load during the compatibility phase.
- Both-descriptor ambiguity fails with a precise message.
- Docs/tests do not describe `-cell/` as the content root.
- Existing DSL guidance still prevents service/proxy/task mechanics from accumulating in
  `cell.yaml`.

## DMIND / STIER review

### Risk: concept drift into a junk drawer

`-cell/` could become a dumping ground if every runtime artifact is placed there.

Answer: keep the semantic split strict. `-cell/` is metadata/control. Normal data and content stay in
`<root>/`. Only descriptor and Cell-related owner configs belong there.

### Risk: churn for little functional value

The old path works and is consistent with other `-config` usage.

Answer: the value is conceptual clarity. If Cell is the central runtime/local-first boundary, the shell
should expose that concept. This is earned now because `cell.yaml` has become a domain descriptor, not
just package config.

### Risk: top-level `-config` becomes ambiguous

Two config roots can confuse users.

Answer: document ownership. `-cell/-config/*` is Cell-owned configuration referenced by the Cell
descriptor. Top-level `-config/*` is reserved for non-Cell root/tool configuration.

## Non-goals

- Do not move normal project content under `-cell/`.
- Do not rename the package or CLI surface in this pass.
- Do not add state/cache directories until concrete use-cases earn them.
- Do not rewrite the Cell DSL beyond path semantics.
- Do not remove legacy descriptor loading in the same change that introduces the new path.

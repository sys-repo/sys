# Phase-1 SlugTree (fromDir + toYaml)

## Goals
- Build slug-tree from filesystem structure
- Keep CRDT refs canonical via front-matter `ref: crdt:...`
- Preserve invariant: `fromDir → toYaml → (paste into CRDT) → fromDag` yields same tree

## API Surface (compiler layer)
- Extend `SlugTree` lib in `deploy/@tdb.edu.slug/src/m.slug.compiler/slug.SlugTree/mod.ts`:
  - `fromDir`
  - `toYaml`

## Types
```
export type SlugTreeFromDir = (args: {
  readonly root: t.StringDir;
  readonly createCrdtRef: () => Promise<t.StringRef>;
  readonly opts?: {
    readonly include?: readonly string[]; // default ['.md']
    readonly ignore?: readonly string[];  // default []
    readonly sort?: boolean;              // default true
    readonly readmeAsIndex?: boolean;     // default true
  };
}) => Promise<t.SlugTreeItems>;
```

## Rules
- Include `.md` only (explicitly exclude `.mdx` for now)
- Directory ⇒ inline node `{ slug, slugs }`
- File ⇒ ref-only `{ slug, ref }`
- README convention: `README.md` maps to directory slug (index doc)
- Deterministic ordering (lexicographic by slug)
- `ref` is taken from front-matter; if missing, generate + insert

## Front-matter Behavior
- Always at top of file, delimited with `---`
- If no front-matter, insert one
- Ensure `ref: crdt:...` exists
  - If inserting, `ref` is the first key
  - If front-matter exists, add `ref` at top only if missing
  - If `ref` exists, leave as-is

## Implementation Layout
- New files under `deploy/@tdb.edu.slug/src/m.slug.compiler/slug.SlugTree/`:
  - `u.fromDir.ts` — walk FS, build tree, call front-matter helper
  - `u.frontmatter.ts` — parse/insert/update front-matter `ref`
  - `u.toYaml.ts` — render tree to YAML
- Extend `t.ts` with `SlugTreeFromDir` and `SlugTreeToYaml` types
- Extend `mod.ts` to export these on `SlugTree`

## Locked Decisions
- Slug normalization: preserve filename as-is (no normalization in phase-1)
- Sort order: case-insensitive lexicographic (for determinism)
- Ignore defaults: dotfiles + `node_modules`, `.git`, `.DS_Store`, `.tmp`
- README convention: `README.md` maps to directory slug (index)
- Include: `.md` only (no `.mdx`)
- `ref`: CRDT ref from front-matter; insert `ref` when missing using `createCrdt`

## Status
- Baseline implemented: `fromDir`, `toYaml`, front-matter ref insertion, and tests

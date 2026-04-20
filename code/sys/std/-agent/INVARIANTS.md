# EVERGREEN NOTES — @sys/std leaf migration and compatibility discipline

## Scope
- Package: `code/sys/std`
- Purpose of this note: retain the durable rules learned from the leaf-subpath migration and compatibility restoration work.

## Landed truth
`@sys/std` now operates under a leaf-authoritative posture:
- symbols with dedicated public leaf subpaths stay off the root barrel
- package-local `common/libs.ts` files may rebundle those leaves for local ergonomics
- root `@sys/std` is reserved for symbols that do not yet have their own truthful public leaf

Representative landed policy line:
- `refactor(std): require leaf imports for dedicated std public modules`

## Evergreen rules

### 1. A dedicated public leaf path is the import authority
If a symbol has a truthful published subpath such as `@sys/std/time`, `@sys/std/pkg`, `@sys/std/log`, `@sys/std/num`, or `@sys/std/str`, consumers should import from that leaf instead of the root barrel.

### 2. Root exports are only for root-owned concepts
Do not let `@sys/std` root become a convenience dumping ground. Keep only symbols that do not yet have their own dedicated public leaf.

### 3. Convenience belongs in local rebundling, not package root fan-in
If a package wants ergonomic imports, rebundle leaves inside its own `common/libs.ts` rather than widening `@sys/std` root.

### 4. Publication/version truth matters as much as local workspace truth
A leaf path is only usable by generated/external consumers when:
1. the package exports it locally
2. the published version exports it on JSR
3. dependency authority/import maps declare it

Do not treat local workspace success as sufficient proof for generated or published consumers.

### 5. Template/dependency authority must move with package surface changes
If templates or generated repos import `@sys/std/<leaf>`, their `-deps.yaml` / import-map authority must declare the same leaf set against a version that actually publishes those exports.

## Review rule for future std narrowing
When considering a new std leaf or migration step:
1. confirm the symbol is a stable public concept
2. make the leaf the public authority once the break is intentional
3. update dependent authority surfaces (templates/import maps/examples)
4. verify both local package proof and generated/external-consumer truth

## Verification posture
Run from:

```bash
cd /Users/phil/code/org.sys/sys/code/sys/std
```

Baseline package proof:

```bash
deno task test --trace-leaks
deno task dry
```

When the change affects generated or template consumers, also verify the owning template/integration proof rather than relying on std-local success alone.

## Non-goals carried forward
- do not turn std leaf work into a repo-wide purity campaign
- do not remove root compatibility casually while migration is still active
- do not assume a local leaf export is ready for external consumers before publish/version authority is aligned

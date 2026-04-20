# EVERGREEN NOTES — @sys/std leaf migration and compatibility discipline

## Scope
- Package: `code/sys/std`
- Purpose of this note: retain the durable rules learned from the leaf-subpath migration and compatibility restoration work.

## Landed truth
`@sys/std` is now operating under a compatibility-preserving leaf-export posture:
- leaf subpaths are valid and preferred where they provide truthful narrow authority
- root `@sys/std` remains an important compatibility surface during migration
- compatibility restoration was required after narrowing work proved too strict for existing consumers/tests

Representative landed fix line:
- `fix(std): restore root compatibility exports for leaf subpath migration`

## Evergreen rules

### 1. Leaf exports are preferred, but compatibility is authoritative during migration
A migration to narrower leaves must not silently strand existing root consumers unless that break is explicitly intended and coordinated.

### 2. Public root compatibility should be restored when the package historically promised it
If existing consumers/tests rely on root exports such as `Pkg`, `Is`, `Time`, `Err`, `Log`, or `Timecode`, preserve them while the leaf contract matures.

### 3. Add narrow leaves only when they are truthful and consumer-justified
Leaf exports should reflect stable public concepts, not internal enthusiasm for decomposition.

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
2. preserve root compatibility unless a break is intentional
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

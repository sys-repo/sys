# Completed plan: rename Cell endpoint selector from `export` to `use`

## Status

Complete and landed. The Cell descriptor selector is now `use` only; no compatibility alias or
deprecated `export` field remains.

This file is historical record, not active work.

## Decision

Prefer `use` as the Cell descriptor field that selects the named ESM endpoint from `from`.

```yaml
from: '@sys/http/server/static'
use: HttpStatic
```

Meaning:

```ts
const mod = await import('@sys/http/server/static');
const endpoint = mod.HttpStatic;
```

`export` is technically accurate from the module author's perspective, but Cell descriptors are
written from the composition perspective: "from this module, use this endpoint."

## TMIND pass

- `use` is less ESM-jargon-heavy and reads as product DSL.
- `import` is worse because it names the loading operation, not the selected binding.
- `endpoint`, `symbol`, or `binding` are precise but colder and less human.
- Greenfield Cell descriptors should not carry compatibility aliases.
- `export` must disappear from the descriptor schema, docs, samples, generated help, and runtime
  terminology.
- `export` can still appear in TypeScript source as normal ESM syntax, but not as a Cell YAML field.
- Runtime errors should name the Cell selector as `use`.

## BMIND sweep result

- Schema requires `use` and rejects `export` as an unknown field.
- Types model the endpoint selector as `use` only.
- Task verification resolves the selected endpoint through `endpointNameOf(...)`.
- Service verification resolves the selected endpoint through `endpointNameOf(...)`.
- Runtime errors mention `use` and the selected value.
- Samples use `use`.
- Help YAML uses `use` and consistently says "from/use".
- Generated help bundle was refreshed.
- Tests cover `use`, missing selector, and rejection of stale `export` fields.
- No stale descriptor selector fields remain outside tests that intentionally prove rejection.

## Landed sequence

1. Replaced selector types with `use` only.
2. Updated descriptor schema.
3. Updated task/service verification.
4. Updated samples and help YAML.
5. Refreshed generated help bundle.
6. Ran targeted Cell schema/runtime/help tests.
7. Ran `deno task check` and `deno task test`.

## Verification

- `deno test -P=test ./src/m.cell/u.schema/-test/-.test.ts ./src/m.cell/-test/-u.services.verify.test.ts ./src/m.cell/u.task/-test/-u.verify.test.ts ./src/m.cell/-test/-u.task.test.ts`
- `deno task check`
- `deno task test`
- Residue search confirmed `export:` remains only in schema tests that intentionally prove stale
  descriptor fields are rejected.

## Historical record

- Design posture: greenfield rename, no compatibility alias, no deprecation crumbs.
- Descriptor vocabulary moved from module-author syntax (`export`) to Cell-composer selection
  (`use`).
- Plan record was first committed separately as
  `23221d2cf docs(cell): record endpoint selector rename plan`.
- Current source truth is the landed implementation: schema, types, runtime verification, tests,
  samples, README, help YAML, and generated help use `use`.

# XML parser facade for workspace test stats

- [x] a0c344907663533824532b0b69d1d4d409a36485 feat(std): add XML parser facade for workspace stats

## Status

Landed as `a0c344907663533824532b0b69d1d4d409a36485 feat(std): add XML parser facade for workspace stats`.

This plan served as the pre-commit architecture gate for:

- `feat(workspace): collect capability-tagged native test stats`

The gate is satisfied for the std facade slice. Workspace stats follow-up may now consume
`@sys/std/xml` instead of importing or re-exporting `@std/xml` through `@sys/workspace` common lanes.

## Decision

Added a small `@sys/std/xml` facade before committing workspace test stats.

This is more disciplined than:

```ts
export * as Xml from '@std/xml';
```

because that leaks the third-party/std dependency shape into downstream package code. `@std/xml` is
currently young enough that `@sys` should own the narrow API it depends on.

## Landed shape

Created a small `@sys/std/xml` module that exposes only the XML primitives needed by the workspace
JUnit adapter.

Example consumer shape:

```ts
import { Xml } from '@sys/std/xml';

const res = Xml.parse(text, options);
if (!res.ok) return res.error.message;

const root = res.doc.root;
Xml.Is.element(root);
Xml.Is.text(node);
Xml.Is.cdata(node);
```

## Minimal facade API

- `Xml.parse(text, options?)`
  - returns a result shape, not a throwing parser:
    - `{ ok: true; doc }`
    - `{ ok: false; error }`
- `Xml.Is.element(node)`
- `Xml.Is.text(node)`
- `Xml.Is.cdata(node)`
- Export stable facade types needed by consumers, not raw `@std/xml` internals unless deliberately
  aliased behind `@sys/std/xml` names.

## Implementation notes

- `jsr:@std/xml@0.1.3` is in `deps.yaml` and projected through `imports.json` / `deno.lock`.
- The facade lives under `code/sys/std/src/m.Xml/`.
- `code/sys/std/deno.json` exports `"./xml"`.
- `code/sys/std/src/types.ts` exports the public XML facade types.
- Runtime implementation uses `@std/xml` internally, but does not expose it wholesale.
- `mod.ts` is compositional: it wires `u.parse.ts` and `m.Is.ts` into `Xml: t.Xml.Lib`.
- Secure defaults are preserved:
  - DOCTYPE is removed from public parse options and forced disabled last at runtime;
  - default depth/attribute bounds live in `m.Xml/common.ts` under `DEFAULTS` / `D`;
  - parse failure is reported as data, not thrown through callers.

## Workspace follow-up

After `@sys/std/xml` exists:

- Replace workspace's direct `@std/xml` common export with:

```ts
export { Xml } from '@sys/std/xml';
```

- Keep `code/sys/workspace/src/m.run/u/u.testStats.ts` constrained to JUnit facts only.
- Keep unavailable stats truthful when XML parsing fails.
- Verification already run for the landed std slice:

```sh
cd code/sys/std && deno task test --trace-leaks ./src/m.Xml
cd code/sys/std && deno task test --trace-leaks ./src/-test/-.test.ts
cd code/sys/std && deno task check
```

- Re-run workspace proof after the workspace follow-up edits land:

```sh
cd code/sys/workspace && deno task test --trace-leaks ./src/m.run
cd code/sys/workspace && deno task check
```

## Non-goals

- Do not create a full `@sys/xml` root package yet.
- Do not mirror all of `@std/xml`.
- Do not parse Deno pretty output.
- Do not render workspace stats in this commit.

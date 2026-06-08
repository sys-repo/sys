# KeyValue type namespace API plan

## Status
Completed.

Landed implementation:

- `d3bd4363e refactor(ui-react-components): namespace keyvalue types`

Subsequent package/source-tree renames carried the completed shape to the current paths:

- `615f43f4a refactor(ui-components): rename package identity`
- `f19716a96 refactor(ui-components): move react source tree`

Current proof, re-run on 2026-06-08:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-components && deno task check
cd /Users/phil/code/org.sys/sys/deploy/@draft.shell && deno task check
```

Both checks passed.

Current source shape:

- `code/sys.ui/ui-components/src/ui.react/KeyValue/t.ts` exports `declare namespace KeyValue`.
- `code/sys.ui/ui-components/src/ui.react/KeyValue/-.test.ts` asserts `t.KeyValue.Item[]`.
- `deploy/@draft.shell/src/common/t.ts` exports `KeyValue` from `@sys/ui-components/t`.
- Current scan found no legacy flat `KeyValueItem` / `KeyValueLayout` / `KeyValueProps` usage in `ui-components`, `deploy/@draft.shell`, or `code/-tmpl`.

## Goal
Make `@sys/ui-components/t` expose a clean KeyValue type namespace so consumers can import one type namespace instead of proliferating flat `KeyValue*` imports.

Target consumer shape:

```ts
export type { KeyValue } from '@sys/ui-components/t';

t.KeyValue.Item[];
t.KeyValue.Layout;
t.KeyValue.Row;
t.KeyValue.Props;
```

## Posture
Use XHIGH. This is a public `/t` API cleanup, and the intent is to remove the flat `KeyValue*` type slop rather than preserve it.

The unit should be tight, but not compatibility-preserving.

## Scope
Primary package:

```txt
code/sys.ui/ui-components
```

Proof consumer:

```txt
deploy/@draft.shell
```

Follow-up scan:

```txt
code/-tmpl
```

## Design
In `code/sys.ui/ui-components/src/ui/KeyValue/t.ts`:

1. Add `export declare namespace KeyValue` as the canonical public type namespace.
2. Move/express canonical names inside the namespace:
   - `KeyValue.Lib`
   - `KeyValue.Props`
   - `KeyValue.Item`
   - `KeyValue.ItemProps`
   - `KeyValue.Row`
   - `KeyValue.Title`
   - `KeyValue.Hr`
   - `KeyValue.Spacer`
   - `KeyValue.Layout`
   - `KeyValue.LayoutSpaced`
   - `KeyValue.LayoutTable`
   - `KeyValue.LayoutCommon`
   - `KeyValue.Size`
   - `KeyValue.Spacing`
   - `KeyValue.Opacity`
   - `KeyValue.Defaults`
   - `KeyValue.LinkOpen`
   - `KeyValue.LinkDisplay`
   - `KeyValue.LinkProps`
   - `KeyValue.LinkDef`
   - `KeyValue.Href`
   - `KeyValue.FromObject`
   - `KeyValue.FromObjectOptions`
3. Remove the flat public aliases from the package-local type surface:
   - `KeyValueItem`
   - `KeyValueLayout`
   - `KeyValueProps`
   - and the rest of the `KeyValue*` flat family.

Do not change runtime imports/exports. Runtime remains:

```ts
import { KeyValue } from '@sys/ui-components/key-value';
```

## Non-goals
- Do not preserve backcompat aliases for the flat `KeyValue*` type family.
- Do not change component behavior or visual layout.
- Do not use `export type * as KeyValue` because that produces `KeyValue.KeyValueItem`, not the clean `KeyValue.Item` API.
- Do not broaden root package exports.

## Steps
1. Update `ui/KeyValue/t.ts` to expose only the clean `KeyValue` namespace for public KeyValue types.
2. Replace package-internal references from the flat family to namespace members, for example:
   - `t.KeyValueItem` → `t.KeyValue.Item`
   - `t.KeyValueLayout` → `t.KeyValue.Layout`
   - `t.KeyValueProps` → `t.KeyValue.Props`
   - `t.KeyValueRow` → `t.KeyValue.Row`
3. Add/adjust KeyValue type tests to assert the namespace form:
   - `t.KeyValue.Item[]`
   - `t.KeyValue.Layout`
   - no legacy `t.KeyValueItem[]` expectation
3. Run:
   ```sh
   cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-components && deno task check
   ```
4. Update proof consumer `deploy/@draft.shell/src/common/t.ts` to re-export `KeyValue` namespace instead of individual flat imports.
5. Update draft shell usage:
   - `t.KeyValueItem` → `t.KeyValue.Item`
   - `t.KeyValueLayout` → `t.KeyValue.Layout`
6. Scan the wider workspace for direct imports/usages of the removed flat `KeyValue*` type names and update owned call sites in the same unit when practical.
7. Run:
   ```sh
   cd /Users/phil/code/org.sys/sys/deploy/@draft.shell && deno task check
   ```
8. Scan `code/-tmpl` for current template references to flat KeyValue types or local type pool imports.
9. If templates reference the old form, update them to the namespace baseline so newly scaffolded code emits the clean API.
10. Re-run relevant template checks/tests if touched.
11. XHIGH review gate: confirm clean namespace API, flat alias removal, proof consumer, template scan result, and no unrelated dirty files staged.
12. Commit the tight unit.

## Verification commands

```sh
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-components && deno task check
cd /Users/phil/code/org.sys/sys/deploy/@draft.shell && deno task check
```

If `code/-tmpl` changes, run the smallest relevant configured check from that package after inspecting its `deno.json`.

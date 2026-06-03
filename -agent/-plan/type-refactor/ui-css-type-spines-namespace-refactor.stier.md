# @sys/ui-css type-spines namespace refactor

- [x] 953b93f2f refactor(ui-css): convert css type spines to namespace contracts

## Scope

Package: `code/sys.ui/ui-css` (`@sys/ui-css`).

Refactor these legacy flat type spines as one coordinated group:

- `code/sys.ui/ui-css/src/m.Css.Edges/t.ts`
- `code/sys.ui/ui-css/src/m.Style/t.ts`
- `code/sys.ui/ui-css/src/m.Style/t.transform.ts`
- `code/sys.ui/ui-css/src/m.Css.Tmpl/t.ts`
- `code/sys.ui/ui-css/src/m.Css.Dom/t.ts`
- `code/sys.ui/ui-css/src/m.Css.Dom/t.ctx.ts`
- `code/sys.ui/ui-css/src/m.WebFont/t.ts`
- `code/sys.ui/ui-css/src/m.WebFont/t.font.config.ts`

Modern references inspected for target shape:

- `code/sys/fs/src/m.Path/t.ts` — small namespace, `Lib` first, no compatibility aliases.
- `code/sys/std/src/m.Args/t.ts` — root namespace plus earned sub-namespaces.
- `code/sys/crypto/src/m.Hash.Composite/t.ts` — larger namespace with sub-namespaces and a separate sibling namespace.

## Refactor decision

Refactor as one grouped `@sys/ui-css` pass. The five module type spines are coupled through the package type pool: `Style.Value` composes `CssDom`, `CssTmpl`, and `CssEdges`; `CssDom` and `Style.Transform` share stylesheet/container contracts; `WebFont` has direct downstream wrappers.

No runtime behavior changes are in scope. Runtime values remain in runtime files. Type-plane files stay type-only.

## Legacy flat names → target namespace shape

### `CssEdges`

Runtime concept: `CssEdges` from `m.Css.Edges/mod.ts`.

Target root:

```ts
export declare namespace CssEdges {
  export type Lib = {
    // toArray / toArrayX / toArrayY / toEdges / toMargins / toPadding
  };
}
```

Mapping:

- `CssEdgesLib` → `CssEdges.Lib`
- `CssEdgeDefault` → `CssEdges.Default`
- `CssEdgeMutater` → `CssEdges.Mutater`
- `CssEdgeMutaterArgs` → `CssEdges.MutaterArgs`
- `CssToEdges<T>` → `CssEdges.ToEdges<T>`
- `CssEdgeInput` → `CssEdges.ValueInput`
- `CssEdgesQuad` → `CssEdges.Quad`
- `CssEdgesInput` → `CssEdges.Input`
- `CssEdgesXYInput` → `CssEdges.XYInput`
- `CssEdges` → `CssEdges.Shape`
- `CssEdgesArray` → `CssEdges.Array`
- `CssMarginInput` → `CssEdges.Margin.Input`
- `CssMarginArray` → `CssEdges.Margin.Array`
- `CssMarginEdges` → `CssEdges.Margin.Shape`
- `CssPaddingInput` → `CssEdges.Padding.Input`
- `CssPaddingArray` → `CssEdges.Padding.Array`
- `CssPaddingEdges` → `CssEdges.Padding.Shape`

Sub-namespaces:

- `CssEdges.Margin.*` owns margin-specific edge aliases/shapes.
- `CssEdges.Padding.*` owns padding-specific edge aliases/shapes.

### `Style`

Runtime concepts: `Style` and root `css` from `m.Style/mod.ts`.

Target root:

```ts
export declare namespace Style {
  export type Lib = {
    // css / transformer / toMargins / toPadding / toShadow / toString / isZero
  };
}
```

Mapping:

- `StyleLib` → `Style.Lib`
- `CssNumberOrStringInput` → `Style.NumberOrStringInput`
- `CssProps` → `Style.Props`
- `CssValue` → `Style.Value`
- `CssInput` → `Style.Input`
- `CssClassname` → `Style.Classname`
- `CssClassPrefix` → `Style.ClassPrefix`
- `StyleTransformerOptions` → `Style.TransformerOptions`
- `CssToShadow` → `Style.Shadow.ToString`
- `CssShadow` → `Style.Shadow.Input`

`m.Style/t.transform.ts` becomes an internal factor file curated by `m.Style/t.ts`, not a public flat re-export.

Transform mapping:

- `CssTransformToStringKind` → `Style.Transform.ToStringKind`
- `CssTransform` → `Style.Transform.Fn`
- `CssTransformed` → `Style.Transform.Result`
- `CssTransformContainerBlock` → `Style.Transform.ContainerBlock`

Sub-namespaces:

- `Style.Transform.*` owns the callable transform/result/container contract.
- `Style.Shadow.*` owns shadow input and formatter types.

### `CssTmpl`

Runtime concept: `CssTmpl` from `m.Css.Tmpl/mod.ts`.

Target root:

```ts
export declare namespace CssTmpl {
  export type Lib = {
    // transform / toEdges
  };
}
```

Mapping:

- `CssTmplLib` → `CssTmpl.Lib`
- `CssTemplates` → `CssTmpl.Templates`

No sub-namespace is required beyond the root namespace.

### `CssDom`

Runtime concepts: `CssDom`, `CssPseudoClass`, and `toString` from `m.Css.Dom/mod.ts`.

Target root:

```ts
export declare namespace CssDom {
  export type Lib = {
    // PseudoClass / stylesheet / toString
  };
}
```

Mapping:

- `CssDomLib` → `CssDom.Lib`
- `CssDomStylesheetOptions` → `CssDom.StylesheetOptions`
- `CssDomStylesheet` → `CssDom.Stylesheet`
- `CssDomClasses` → `CssDom.Classes`
- `CssDomRules` → `CssDom.Rules`
- `CssDomRuleOptions` → `CssDom.RuleOptions`
- `CssDomInsertedRule` → `CssDom.InsertedRule`
- `CssDomContainerBlock` → `CssDom.Container.Block`
- `CssDomContainerToStringKind` → `CssDom.Container.ToStringKind`
- `CssPseudoClassLib` → `CssDom.PseudoClass.Lib`
- `CssPseudoClassLevel3` → `CssDom.PseudoClass.Level3`
- `CssPseudoClassLevel4` → `CssDom.PseudoClass.Level4`
- `CssPseudoClass` → `CssDom.PseudoClass.Name`
- `CssPseudo` → `CssDom.PseudoClass.Map`

`m.Css.Dom/t.ctx.ts` becomes an internal factor file curated by `m.Css.Dom/t.ts`, not a public flat re-export.

Sub-namespaces:

- `CssDom.Container.*` owns @container block contracts.
- `CssDom.PseudoClass.*` owns pseudo-class name/set/map contracts.

### `WebFont`

Runtime concept: `WebFont` from `m.WebFont/mod.ts`.

Target root:

```ts
export declare namespace WebFont {
  export type Lib = {
    // inject / def
  };
}
```

Mapping:

- `WebFontLib` → `WebFont.Lib`
- `WebFontConfig` → `WebFont.Config`
- `WebFontInjectResult` → `WebFont.Inject.Result`

`m.WebFont/t.font.config.ts` becomes an internal factor file curated by `m.WebFont/t.ts`, not a public flat re-export.

Sub-namespace:

- `WebFont.Inject.*` owns inject result detail.

## Legacy alias disposition

Do not add compatibility alias blocks to `@sys/ui-css` target `t.ts` / `t.*.ts` files.

Direct in-repo imports from `@sys/ui-css/t` are current callers and must be migrated in this same refactor. Exact direct import lanes found:

- `code/-tmpl/-templates/tmpl.pkg/src/common/t.ts`
- `code/sys.tools/src/common/t.ts`
- `code/sys.driver/driver-monaco/src/common/t.ts`
- `code/sys.driver/driver-prosemirror/src/common/t.ts`
- `code/sys.driver/driver-vite/src/common/t.ts`
- `code/sys.driver/driver-vite/src/-test/vite.sample-2/src/common/t.ts`
- `code/sys.driver/driver-automerge/src/common/t.ts`
- `code/sys.driver/driver-stripe/src/common/t.ts`
- `code/sys.driver/driver-pi/src/common/t.ts`
- `code/sys.ui/ui-react/src/common/t.ts`
- `code/sys.ui/ui-react/src/use/use.WebFont/t.ts`
- `code/sys.ui/ui-react-components/src/common/t.ts`
- `code/sys.ui/ui-react-devharness/src/common/t.ts`

For those external package `common/t.ts` files, preserve their existing local type-pool names only as import-lane projections when live local callers prove they are still public package vocabulary. Example live callers include `code/sys.ui/ui-react-components/src/ui/Button/t.ts` (`t.CssInput`, `t.CssEdgesInput`), `code/sys.ui/ui-react-components/src/m.webfonts/t.ts` (`t.WebFontConfig`), and `code/sys.driver/driver-monaco/src/ui/ui.YamlEditor/t.ts` (`t.CssEdgesInput`). These projections are outside the `@sys/ui-css` target spine and prevent an unrelated cross-package public API refactor from being bundled into this pass.

HOLD if the reviewer requires eliminating downstream local `t.CssInput` / `t.CssProps` / `t.CssEdgesInput` projections in this same pass; that is a larger monorepo public type-pool migration and should be planned separately.

## Source files expected to change

### Target type spines and factor files

- `code/sys.ui/ui-css/src/m.Css.Edges/t.ts` — rewrite flat exports into `CssEdges` namespace with `Lib` first.
- `code/sys.ui/ui-css/src/m.Style/t.ts` — rewrite flat exports into `Style` namespace with `Lib` first; curate transform/shadow detail types.
- `code/sys.ui/ui-css/src/m.Style/t.transform.ts` — rename factor-local exports to transform-owned names and stop leaking flat public names through `m.Style/t.ts`.
- `code/sys.ui/ui-css/src/m.Css.Tmpl/t.ts` — rewrite flat exports into `CssTmpl` namespace with `Lib` first.
- `code/sys.ui/ui-css/src/m.Css.Dom/t.ts` — rewrite flat exports into `CssDom` namespace with `Lib` first; curate container/pseudo-class detail types.
- `code/sys.ui/ui-css/src/m.Css.Dom/t.ctx.ts` — rename factor-local exports to container-owned names and stop leaking flat public names through `m.Css.Dom/t.ts`.
- `code/sys.ui/ui-css/src/m.WebFont/t.ts` — rewrite flat exports into `WebFont` namespace with `Lib` first; curate config/inject detail types.
- `code/sys.ui/ui-css/src/m.WebFont/t.font.config.ts` — rename factor-local config export for `WebFont.Config` curation.

### `@sys/ui-css` runtime/type reference updates

- `code/sys.ui/ui-css/src/m.Css.Edges/mod.ts` — annotate runtime value as `t.CssEdges.Lib` through local type pool.
- `code/sys.ui/ui-css/src/m.Css.Edges/u.toArray.ts` — update `t.CssEdges.*` references.
- `code/sys.ui/ui-css/src/m.Css.Edges/u.toEdges.ts` — update `t.CssEdges.*` references.
- `code/sys.ui/ui-css/src/m.Css.Edges/-.test.ts` — update test-only type references.
- `code/sys.ui/ui-css/src/m.Css.Tmpl/m.CssTmpl.ts` — annotate runtime value as `t.CssTmpl.Lib` through local type pool.
- `code/sys.ui/ui-css/src/m.Css.Tmpl/u.formatScroll.ts` — update `t.Style.Props` references.
- `code/sys.ui/ui-css/src/m.Css.Tmpl/u.formatSize.ts` — update `t.Style.Props` references.
- `code/sys.ui/ui-css/src/m.Css.Tmpl/u.gap.ts` — update `t.Style.Value` / `t.Style.Props` references.
- `code/sys.ui/ui-css/src/m.Css.Tmpl/u.toEdges.ts` — update `t.CssTmpl.*`, `t.CssEdges.*`, and `t.Style.*` references.
- `code/sys.ui/ui-css/src/m.Css.Tmpl/u.ts` — update `t.Style.Props` references.
- `code/sys.ui/ui-css/src/m.Css.Tmpl/-.test.ts` — update test-only type references.
- `code/sys.ui/ui-css/src/m.Css.Dom/m.CssDom.ts` — annotate runtime value as `t.CssDom.Lib` through local type pool.
- `code/sys.ui/ui-css/src/m.Css.Dom/m.CssPseudoClass.ts` — annotate runtime value as `t.CssDom.PseudoClass.Lib`; update type guard target.
- `code/sys.ui/ui-css/src/m.Css.Dom/u.classes.ts` — update stylesheet classes contract references.
- `code/sys.ui/ui-css/src/m.Css.Dom/u.ctx.container.ts` — update `t.CssDom.Container.*` references.
- `code/sys.ui/ui-css/src/m.Css.Dom/u.rules.ts` — update rules/inserted-rule/style references.
- `code/sys.ui/ui-css/src/m.Css.Dom/u.stylesheet.ts` — update stylesheet/options/classes/container references.
- `code/sys.ui/ui-css/src/m.Css.Dom/u.toString.ts` — update `Style.toString` annotation and pseudo-class map references.
- `code/sys.ui/ui-css/src/m.Css.Dom/-test/-.test.ts` — update test-only type references.
- `code/sys.ui/ui-css/src/m.Css.Dom/-test/-pseudoClass.test.ts` — update pseudo-class type references.
- `code/sys.ui/ui-css/src/m.Css.Dom/-test/-toString.test.ts` — update style value references.
- `code/sys.ui/ui-css/src/m.Style/m.Style.ts` — annotate `Style` as `t.Style.Lib` and `css` as `t.Style.Transform.Fn`.
- `code/sys.ui/ui-css/src/m.Style/u.is.ts` — update transform-result and `Style.Lib` references.
- `code/sys.ui/ui-css/src/m.Style/u.toShadow.ts` — update `Style.Shadow.*` references.
- `code/sys.ui/ui-css/src/m.Style/u.transform.container.ts` — update transform/container/style references.
- `code/sys.ui/ui-css/src/m.Style/u.transform.ts` — update transform/result/stylesheet/style references.
- `code/sys.ui/ui-css/src/m.Style/-test/-.test.ts` — update any type references if surfaced by check.
- `code/sys.ui/ui-css/src/m.Style/-test/-types.test.ts` — update `Style.Props` and `Style.Transform.Result` assertions.
- `code/sys.ui/ui-css/src/m.Style/-test/-u.transform.test.ts` — update transform and style type references.
- `code/sys.ui/ui-css/src/m.WebFont/m.WebFont.ts` — annotate runtime value as `t.WebFont.Lib`.
- `code/sys.ui/ui-css/src/m.WebFont/u.def.ts` — update `t.WebFont.Lib['def']` references.
- `code/sys.ui/ui-css/src/m.WebFont/u.inject.ts` — update `t.WebFont.Lib['inject']` references.
- `code/sys.ui/ui-css/src/m.WebFont/u.ts` — update `t.WebFont.Config` references.
- `code/sys.ui/ui-css/src/m.WebFont/-.test.ts` — update web-font config references.
- `code/sys.ui/ui-css/src/-test/u.Print.ts` — update transform/container print helper references.

No change is expected in `code/sys.ui/ui-css/src/types.ts`: it should continue to aggregate module `t.ts` files through type-only exports. No runtime export change is expected in root `mod.ts`.

### Direct external `@sys/ui-css/t` import lanes

- `code/-tmpl/-templates/tmpl.pkg/src/common/t.ts` — replace flat re-export from `@sys/ui-css/t` with namespace imports/projections for the template package local pool.
- `code/sys.tools/src/common/t.ts` — replace flat re-export with namespace imports/projections for the tools local pool.
- `code/sys.driver/driver-monaco/src/common/t.ts` — replace flat re-export with namespace imports/projections.
- `code/sys.driver/driver-prosemirror/src/common/t.ts` — replace flat re-export with namespace imports/projections.
- `code/sys.driver/driver-vite/src/common/t.ts` — replace `CssValue` re-export with `Style.Value` projection.
- `code/sys.driver/driver-vite/src/-test/vite.sample-2/src/common/t.ts` — replace `CssInput` re-export with `Style.Input` projection.
- `code/sys.driver/driver-automerge/src/common/t.ts` — replace flat re-export with namespace imports/projections.
- `code/sys.driver/driver-stripe/src/common/t.ts` — replace flat re-export with namespace imports/projections.
- `code/sys.driver/driver-pi/src/common/t.ts` — replace flat re-export with namespace imports/projections.
- `code/sys.ui/ui-react/src/common/t.ts` — replace flat re-export with namespace imports/projections for `CssEdges.Array`, `CssEdges.Input`, and `Style.Input`.
- `code/sys.ui/ui-react/src/use/use.WebFont/t.ts` — use `WebFont.Lib` and `WebFont.Config` directly; do not keep `WebFontLib as Base` / `WebFontConfig` import.
- `code/sys.ui/ui-react-components/src/common/t.ts` — replace `export type * from '@sys/ui-css/t'` with explicit namespace exports plus local projections for live component callers.
- `code/sys.ui/ui-react-devharness/src/common/t.ts` — replace flat re-export with namespace imports/projections.

## External projection mapping

Use this mapping only in external package local type pools that already expose these names and have live local callers:

- `CssEdgesInput = CssEdges.Input`
- `CssEdgesArray = CssEdges.Array`
- `CssMarginInput = CssEdges.Margin.Input`
- `CssMarginArray = CssEdges.Margin.Array`
- `CssPaddingArray = CssEdges.Padding.Array`
- `CssProps = Style.Props`
- `CssValue = Style.Value`
- `CssInput = Style.Input`
- `WebFontConfig = WebFont.Config`

Do not add these projections to `@sys/ui-css/src/types.ts` or any `@sys/ui-css` target `t.ts` file.

## Import/reference update rules

- Runtime implementations in `@sys/ui-css` should prefer `import { type t } from './common.ts'` and annotate exported values as `t.<NS>.Lib`.
- Keep direct `import type * as TFactor from './t.*.ts'` only inside the owning root `t.ts` when curating factor-file details into the namespace.
- Remove `export type * from './t.transform.ts'`, `export type * from './t.ctx.ts'`, and `export type * from './t.font.config.ts'` from public root type spines once their details are curated under `Style.*`, `CssDom.*`, and `WebFont.*`.
- Do not import types from runtime modules.
- Do not introduce runtime values, literal registries, side effects, or convenience value exports in `t.ts` / `t.*.ts`.

## Verification commands

Primary package proof from nearest module root:

```sh
cd code/sys.ui/ui-css && deno task check
cd code/sys.ui/ui-css && deno task test
```

Caller import-lane proof for each touched external package:

```sh
cd code/-tmpl && deno task check
cd code/sys.tools && deno task check
cd code/sys.driver/driver-monaco && deno task check
cd code/sys.driver/driver-prosemirror && deno task check
cd code/sys.driver/driver-vite && deno task check
cd code/sys.driver/driver-automerge && deno task check
cd code/sys.driver/driver-stripe && deno task check
cd code/sys.driver/driver-pi && deno task check
cd code/sys.ui/ui-react && deno task check
cd code/sys.ui/ui-react-components && deno task check
cd code/sys.ui/ui-react-devharness && deno task check
```

Residue checks after edits:

```sh
rg -n "\b(CssEdgesLib|StyleLib|CssTmplLib|CssDomLib|WebFontLib|WebFontConfig|CssTransform|CssTransformed|CssDomStylesheet|CssDomContainerBlock)\b" code/sys.ui/ui-css/src code/sys.ui/ui-react/src code/sys.ui/ui-react-components/src code/sys.ui/ui-react-devharness/src code/sys.driver code/sys.tools code/-tmpl/-templates/tmpl.pkg
rg -n "@sys/ui-css/t" code -g "*.ts" -g "*.tsx"
```

Inspect residue manually for runtime value false positives such as `CssDom`, `CssTmpl`, `CssEdges`, `CssPseudoClass`, and `WebFont`.

## HOLD conditions

HOLD if any of these occur:

- A target `@sys/ui-css` type file would need a runtime value or runtime-module import to compile.
- A target `@sys/ui-css` `t.ts` / `t.*.ts` change would widen the public API rather than only move existing public contracts under namespaces.
- A direct `@sys/ui-css/t` import of a removed flat name remains and cannot be migrated in this refactor.
- Type-checking requires broad edits to downstream `t.CssInput` / `t.CssProps` / `t.CssEdgesInput` call sites after local type-pool projections are installed.
- A reviewer requires eliminating downstream local projection names in this pass; that needs a separate monorepo caller-migration plan.
- Factor-file curation creates an unresolvable type-cycle; resolve by collapsing the factor into the owning root `t.ts`, not by adding compatibility aliases.

## Final reality

Implementation landed in `953b93f2f` with the planned `@sys/ui-css` namespace refactor.

Actual changes:

- Converted `CssEdges`, `Style`, `CssTmpl`, `CssDom`, and `WebFont` type spines to namespace contracts with `<NS>.Lib` first.
- Curated factor-file detail types under earned sub-namespaces:
  - `CssEdges.Margin.*` and `CssEdges.Padding.*`
  - `Style.Transform.*` and `Style.Shadow.*`
  - `CssDom.Container.*` and `CssDom.PseudoClass.*`
  - `WebFont.Inject.*`
- Removed flat public type exports from the `@sys/ui-css` target type spines without adding `@sys/ui-css` compatibility alias blocks.
- Migrated `@sys/ui-css` runtime/tests to namespaced contracts through local `t` pools.
- Migrated direct in-repo `@sys/ui-css/t` import lanes to namespace-backed local projections.
- Removed stale downstream local CSS projections when residue checks showed no live callers; retained only local projections with live caller evidence.

Final verification/proof:

- `git diff --check`
- `cd code/sys.ui/ui-css && deno task check`
- `cd code/sys.ui/ui-css && deno task test`
- `cd code/-tmpl && deno task check`
- `cd code/sys.tools && deno task check`
- `cd code/sys.driver/driver-monaco && deno task check`
- `cd code/sys.driver/driver-prosemirror && deno task check`
- `cd code/sys.driver/driver-vite && deno task check`
- `cd code/sys.driver/driver-automerge && deno task check`
- `cd code/sys.driver/driver-stripe && deno task check`
- `cd code/sys.driver/driver-pi && deno task check`
- `cd code/sys.ui/ui-react && deno task check`
- `cd code/sys.ui/ui-react-components && deno task check`
- `cd code/sys.ui/ui-react-devharness && deno task check`

Final review result: SHIP.

Remaining risk: none found.

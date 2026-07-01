# @sys/cli type namespace cleanup BMIND plan

- [x] refactor(cli): add root type namespace — `d55f22bd9`
- [x] refactor(sys): consume cli type namespace — `48c35a0fd`
- [x] refactor(cli): remove legacy CliLib alias — `d74ab9871`

## Finished truth

This work arc is complete.

- `@sys/cli/t` exposes the intentional root `Cli` type namespace.
- In-repo consumers have moved to `t.Cli.*` names where the namespace owns the contract.
- The transitional `CliLib = Cli.Lib` bridge has been removed after migration.
- `code/sys/cli/src/types.ts` remains a package type aggregator only.
- The runtime `Cli` shape was not changed.

The final alias-removal item was compatibility-gated and landed only after in-repo call sites moved.

## Posture

BMIND: fresh-read the type surface rather than continuing the current flat-barrel habit.

DMIND / XHIGH review: treat the type surface as a public design medium, not a local convenience
patch. The shape should invite correct use, mirror the runtime concepts where that mirror is
truthful, and avoid baking today's upgrade-tool pressure into a narrow one-off alias.

This is a good-ROI cleanup, but it should land after the current `@sys/tools upgrade` commit so the
resolver-state fix stays clean.

## Position

Yes: add an intentional root CLI type namespace.

The immediate trigger is `@sys/tools/src/cli.upgrade/common.t.ts`, which currently imports several
unrelated-looking flat CLI type names just to describe one domain dependency:

```ts
export type {
  CliFormatHelpInput,
  CliFormatHelpInputSections,
  CliFormatHelpInputShorthand,
  CliSpinner,
} from '@sys/cli/t';
```

That is not wrong, but it leaks the internal flat shape of `@sys/cli/t` into every consumer. A
namespaced CLI contract would make call-sites clearer and reduce repeated type-barrel plumbing.

## Current shape

`@sys/cli/t` exports a flat type surface from `src/types.ts`:

```ts
export type * from './m.core/t.ts';
export type * from './m.shell/t.ts';
```

`@sys/cli` root exports a package type namespace as `t`:

```ts
export type * as t from './types.ts';
```

That means consumers can technically alias the package type barrel locally, but there is no
intentional public CLI-domain namespace such as `Cli.Spinner.Instance` or `Cli.Fmt.Help.Input`.

## Problem

The available names do not match how consumers want to think:

- runtime root is `Cli`;
- primary runtime contract is `CliLib`;
- spinner contract is `CliSpinner`;
- input contract is `CliInputLib`;
- format-help contracts are individual flat names;
- runtime help is reached as `Cli.Fmt.Help`, but type help is reached as `CliFormatHelp*`.

So downstream packages choose between:

1. importing many flat names; or
2. inventing a local alias over the whole type barrel.

Neither is as clean as an intentional exported `Cli` type namespace.

## DMIND / XHIGH review

### Design read

The root namespace should make the CLI contract feel like the runtime API's type shadow. The
strongest candidate is therefore not a flat alias cluster under `Cli`, but a nested, runtime-aligned
type tree:

```txt
t.Cli.Spinner.Instance
t.Cli.Fmt.Help.Input
```

This is better than:

```txt
t.Cli.FormatHelpInput
```

because `Cli.Fmt.Help` is already the runtime concept, while `CliFormatHelpInput` is a historical
flat-export encoding.

### Hard concerns

- Do not let one consumer (`@sys/tools/src/cli.upgrade`) overfit the root type design.
- Do not introduce a namespace that competes with the existing runtime `Cli`; it must be the
  type-plane counterpart, not a new concept.
- Do not rename or remove flat exports in this pass; compatibility is part of the design.
- Do not hide awkward naming by moving all awkward names under `Cli`; nested aliases should clarify
  the public model.
- Avoid `export import` unless it is the cleanest type-plane fit after `deno check`; explicit nested
  namespaces may be clearer and more durable.
- Keep `Shell` as its own root namespace for now. It is exported by `@sys/cli/t` but is not part of
  the `Cli` runtime root and should not be forced under `Cli` without a separate design pass.
- Treat `Cli.Fmt.Help.Input` as the better public path; root shortcuts such as `Cli.FormatHelpInput`
  should be avoided unless there is a real ergonomic need.

### Better API target

Add a root `Cli` namespace that mirrors runtime concepts where the mirror is truthful:

```ts
export declare namespace Cli {
  export type Lib = {
    readonly Spinner: t.CliSpinner.Lib;
    readonly Fmt: t.CliFormat.Lib;
    readonly Input: t.CliInputLib;
    // Existing root runtime contract continues here.
  };

  export namespace Spinner {
    export type Lib = t.CliSpinner.Lib;
    export type Options = t.CliSpinner.Options;
    export type Instance = t.CliSpinner.Instance;
  }

  export namespace Fmt {
    export type Lib = t.CliFormat.Lib;

    export namespace Help {
      export type Lib = t.CliFormatHelpLib;
      export type Input = t.CliFormatHelpInput;
      export type InputSections = t.CliFormatHelpInputSections;
      export type InputShorthand = t.CliFormatHelpInputShorthand;
      export type Section = t.CliFormatHelpSection;
      export type Pair = t.CliFormatHelpPair;
      export type Option = t.CliFormatHelpOption;
      export type Tone = t.CliFormatHelpTone;
      export type LayoutOptions = t.CliFormatHelpLayoutOptions;
    }
  }
}

export type CliLib = Cli.Lib;
```

Add other nested mirrors only when they are needed or obviously root-level stable. Do not attempt to
model the entire CLI package in one pass. Keep the legacy `CliLib` alias only as a transitional
compatibility surface.

Repo-wide scan for the consumer move earned additional mirrors under the same rule:

- `Cli.Table.Instance`
- `Cli.Keyboard.BindOptions`
- `Cli.Fmt.Chapters.*`
- `Cli.Fmt.Spinner.*`
- `Cli.Fmt.Url.*`

## TMIND / S-tier review

Verdict: the coherent S-tier shape is the namespace in `code/sys/cli/src/m.core/m.Cli/t.ts`, with
`code/sys/cli/src/types.ts` remaining a boring package type aggregator.

Hostile reads:

- If `src/types.ts` owns the namespace, the root barrel becomes a design brain. That violates the
  package-skeleton intent and makes future package type curation harder to reason about.
- If `CliLib` stays as the primary public noun forever, the new `Cli.Lib` namespace is only
  decorative. The namespace should be the destination; `CliLib` is a compatibility bridge.
- If `CliLib` is removed in the first commit, the additive safety claim becomes false. Existing
  consumers need a migration window.
- If `Cli.Fmt.Help.*` is flattened to `Cli.FormatHelp*`, the type plane preserves historical
  encoding rather than the runtime concept tree.
- If `Shell` is pulled under `Cli`, the namespace lies about runtime ownership. Leave `Shell`
  separate unless the runtime model changes.

S-tier acceptance for the final shape:

- concept owner: `m.core/m.Cli/t.ts` owns `Cli`;
- package root: `src/types.ts` only aggregates;
- primary contract: `Cli.Lib`;
- transitional bridge: `CliLib = Cli.Lib` only until consumers move;
- consumer usage: `t.Cli.Spinner.Instance` and `t.Cli.Fmt.Help.Input`;
- no runtime shape change.

## Work arc

### Move 1 — add the type namespace

- Add the `Cli` namespace to `code/sys/cli/src/m.core/m.Cli/t.ts`, the owning concept spine.
- Keep `code/sys/cli/src/types.ts` as a boring package type aggregator.
- Make `Cli.Lib` the primary root runtime contract type.
- Keep `export type CliLib = Cli.Lib;` as a transitional compatibility alias.
- Keep all existing flat exports.
- Prove `t.Cli.Spinner.Instance` and `t.Cli.Fmt.Help.Input` compile.
- Do not touch downstream consumers in this commit unless required to prove the public surface.

### Move 2 — update call sites repo-wide

- Scan `/code` for consumers of flat CLI type names.
- Update package type barrels from hand-picked flat CLI exports to the namespace export/import
  pattern where the namespace now covers the need.
- Update call sites from flat names to nested names:
  - `t.CliLib` → `t.Cli.Lib`
  - `t.CliSpinner.Instance` → `t.Cli.Spinner.Instance`
  - `t.CliSpinner.Lib` → `t.Cli.Spinner.Lib`
  - `t.CliFormatHelpInput` → `t.Cli.Fmt.Help.Input`
  - `t.CliFormatHelpInputSections` → `t.Cli.Fmt.Help.InputSections`
  - `t.CliFormatHelpInputShorthand` → `t.Cli.Fmt.Help.InputShorthand`
  - `t.CliFormat.Spinner.Spacing` → `t.Cli.Fmt.Spinner.Spacing`
  - `t.CliFormat.Url.ServicePart` → `t.Cli.Fmt.Url.ServicePart`
  - `t.CliFormatChapters.*` → `t.Cli.Fmt.Chapters.*` where consumers import the package-level type
    namespace.
  - `t.CliTable` → `t.Cli.Table.Instance`
  - `t.CliKeyboardBindOptions` → `t.Cli.Keyboard.BindOptions`
- Do not rewrite the defining CLI leaf modules merely to consume their own root namespace; owner
  modules may keep their canonical local type names.

### Move 3 — remove the legacy alias

- Remove `export type CliLib = Cli.Lib;` only after migrated call sites no longer depend on it.
- Treat this as compatibility-impacting, even if no in-repo callers remain.
- Run the same `@sys/cli` and affected consumer checks before landing.

## Implementation notes

Owner file:

```txt
code/sys/cli/src/m.core/m.Cli/t.ts
```

Package aggregator stays boring:

```txt
code/sys/cli/src/types.ts
```

No export-map change should be needed because `@sys/cli/t` already points at `src/types.ts`, which
re-exports `m.core/t.ts`, which re-exports `m.Cli/t.ts`.

The exact TypeScript syntax must be verified with `deno check`. Prefer explicit `export namespace` /
`export type` aliases over clever namespace import forms if there is any ambiguity.

Do not widen this into a runtime refactor. This is a type-surface cleanup only.

## Migration target

After `@sys/cli` exposes the namespace, update `@sys/tools/src/cli.upgrade/common.t.ts` from flat
CLI type re-exports to one namespace re-export/import pattern.

Preferred consumer shape:

```ts
export type { Cli } from '@sys/cli/t';
```

Then internal usage becomes:

```txt
t.Cli.Spinner.Instance
t.Cli.Fmt.Help.Input
```

instead of:

```txt
t.CliSpinner.Instance
t.CliFormatHelpInput
```

Keep flat exports in `@sys/cli/t` for compatibility. Keep `CliLib = Cli.Lib` as a transitional
bridge until the final alias-removal move. This is additive first; cleanup consumers
opportunistically.

## Guardrails

- Do not remove existing flat `Cli*` exports in the additive namespace pass.
- Do not remove `CliLib` until the final compatibility-gated alias-removal pass.
- Do not change runtime `Cli` object shape.
- Do not introduce a second competing namespace in each consumer package.
- Do not use local `typeof` seams when named type-plane contracts exist.
- Keep `src/types.ts` as a package-root aggregator, not the owner of the `Cli` namespace.
- Keep the root `Cli` namespace focused on CLI runtime-domain types; do not absorb `Shell` in this
  pass.
- Prefer nested runtime-aligned aliases over root flat aliases.
- Keep this separate from the current `@sys/tools upgrade` resolver-state commit.

## Test / validation plan

Run from `@sys/cli`:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli
deno task check
deno task test
```

Run affected consumer validation from `@sys/tools`:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.tools
deno check src/cli.upgrade/common.t.ts src/cli.upgrade/u.cmd.runUpgrade.ts src/cli.upgrade/u.fmt.ts
deno task test --trace-leaks ./src/cli.upgrade
deno task check
```

If package exports or docs shift, also run:

```sh
cd /Users/phil/code/org.sys/sys
deno task check
```

## Acceptance

- `@sys/cli/t` exposes an intentional `Cli` type namespace.
- `code/sys/cli/src/m.core/m.Cli/t.ts` owns the `Cli` namespace.
- `code/sys/cli/src/types.ts` remains a package type aggregator only.
- `t.Cli.Spinner.Instance` is available to downstream packages.
- `t.Cli.Fmt.Help.Input` is available to downstream packages.
- Earned repo-consumer mirrors are available: `t.Cli.Table.Instance`, `t.Cli.Keyboard.BindOptions`,
  `t.Cli.Fmt.Chapters.*`, `t.Cli.Fmt.Spinner.*`, and `t.Cli.Fmt.Url.*`.
- Existing flat type imports still compile during the additive and consumer-migration moves.
- The transitional `CliLib = Cli.Lib` bridge has been removed.
- Repo call sites no longer need hand-picked flat CLI type exports for migrated CLI contracts.
- No runtime API shape changes.

## Candidate commits

```txt
refactor(cli): add root type namespace
# d55f22bd9
```

```txt
refactor(sys): consume cli type namespace
# 48c35a0fd
```

```txt
refactor(cli): remove legacy CliLib alias
# d74ab9871
```

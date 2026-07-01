# @sys/cli type namespace cleanup — BMIND plan

## Posture

BMIND: fresh-read the type surface rather than continuing the current flat-barrel habit.

This is a good-ROI cleanup, but it should land after the current `@sys/tools upgrade` commit so the resolver-state fix stays clean.

## Position

Yes: add an intentional root CLI type namespace.

The immediate trigger is `@sys/tools/src/cli.upgrade/common.t.ts`, which currently imports several unrelated-looking flat CLI type names just to describe one domain dependency:

```ts
export type {
  CliFormatHelpInput,
  CliFormatHelpInputSections,
  CliFormatHelpInputShorthand,
  CliSpinner,
} from '@sys/cli/t';
```

That is not wrong, but it leaks the internal flat shape of `@sys/cli/t` into every consumer. A namespaced CLI contract would make call-sites clearer and reduce repeated type-barrel plumbing.

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

That means consumers can technically alias the package type barrel locally, but there is no intentional public CLI-domain namespace such as `Cli.Spinner.Instance` or `Cli.FormatHelpInput`.

## Problem

The available names do not match how consumers want to think:

- runtime root is `Cli`;
- primary runtime contract is `CliLib`;
- spinner contract is `CliSpinner`;
- input contract is `CliInputLib`;
- format-help contracts are individual flat names.

So downstream packages choose between:

1. importing many flat names; or
2. inventing a local alias over the whole type barrel.

Neither is as clean as an intentional exported `Cli` type namespace.

## Proposed API

Add a root CLI type namespace to `@sys/cli/t`.

Candidate shape:

```ts
export namespace Cli {
  export type Lib = CliLib;
  export import Spinner = CliSpinner;
  export type InputLib = CliInputLib;
  export type FormatHelpInput = CliFormatHelpInput;
  export type FormatHelpInputSections = CliFormatHelpInputSections;
  export type FormatHelpInputShorthand = CliFormatHelpInputShorthand;
}
```

Minimum target for the upgrade cleanup:

```ts
t.Cli.Spinner.Instance
t.Cli.FormatHelpInput
```

## Implementation notes

Likely owner file:

```txt
code/sys/cli/src/types.ts
```

No export-map change should be needed because `@sys/cli/t` already points at `src/types.ts`.

The exact TypeScript syntax must be verified with `deno check`. If `export import Spinner = CliSpinner` is not accepted from the type barrel context, use the smallest equivalent type-plane shape that preserves the consumer API intent.

Do not widen this into a runtime refactor. This is a type-surface cleanup only.

## Migration target

After `@sys/cli` exposes the namespace, update `@sys/tools/src/cli.upgrade/common.t.ts` from flat CLI type re-exports to one namespace re-export/import pattern.

Preferred consumer shape:

```ts
export type { Cli } from '@sys/cli/t';
```

Then internal usage becomes:

```ts
t.Cli.Spinner.Instance
```

instead of:

```ts
t.CliSpinner.Instance
```

Keep flat exports in `@sys/cli/t` for compatibility. This is additive first; cleanup consumers opportunistically.

## Guardrails

- Do not remove existing flat `Cli*` exports in this pass.
- Do not change runtime `Cli` object shape.
- Do not introduce a second competing namespace in each consumer package.
- Do not use local `typeof` seams when named type-plane contracts exist.
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
- `t.Cli.Spinner.Instance` is available to downstream packages.
- `t.Cli.FormatHelpInput` is available to downstream packages.
- Existing flat type imports still compile.
- `@sys/tools/src/cli.upgrade/common.t.ts` no longer needs a hand-picked list of flat CLI type exports for spinner/help contracts.
- No runtime API shape changes.

## Candidate commit

```txt
refactor(cli): add root type namespace
```

Optional follow-up consumer commit:

```txt
refactor(tools): consume cli type namespace
```

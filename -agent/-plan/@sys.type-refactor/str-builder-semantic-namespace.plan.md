# String-builder semantic type namespace plan

str-builder-semantic-namespace.plan.md
- [x] 844214d7a docs(canon): preserve dependency type namespaces
- [x] 7f085e138 refactor(types): namespace string builder contracts

Plan status: **Complete. Canon and the atomic `@sys/std` → Workspace → Tools compatibility cut were
human-committed and remain fully verified**.

## Subject

Preserve the semantic ownership of string-builder contracts from their defining package through
every downstream local `t` pool.

The target grammar is:

```ts
t.Str.Builder;
t.Str.Builder.Options;
t.Str.Builder.ToTextOptions;
```

The original grammar flattened that ownership:

```ts
t.StrBuilder;
t.StrBuilderOptions;
t.StrBuilderToTextOptions;
```

The first migration restored only the outer owner and stopped one level early:

```ts
t.Str.Builder;
t.Str.BuilderOptions;
t.Str.BuilderToTextOptions;
```

This is not merely a rename. It restores the concept tree at the type boundary: `Str` owns builder
contracts, downstream packages preserve that ownership, and call sites use the highest applicable
semantic namespace.

## DMIND judgment

The namespace hierarchy is earned twice: `Str` already exists as the stable runtime and type
concept, while `Builder` is both the subordinate instance contract and the owner of cohesive
creation/output option contracts. Nesting improves recognition and containment without inventing a
new abstraction. The correct stopping point is `Builder.ToTextOptions`; `ToText` has not earned a
namespace of its own.

The local `t` lane remains the access mechanism. The change clarifies what that lane carries:
semantic dependency namespaces rather than a convenience pool of detached leaves.

The human selected this atomic migration as the published compatibility boundary after every
in-repository consumer moved to `Str.*` and residue scans proved no production flat-name use. Commit
`7f085e138` removes the obsolete `StrBuilder*` aliases rather than retaining a second public grammar
for hypothetical consumers.

## Canon gap and amendment

Before this change, `sys.canon/-canon/protocol.types.md` required the local `t` lane, canonical
named types, and namespace discipline inside owned contracts, but did not explicitly require a
package to preserve a disciplined namespace supplied by a dependency. A downstream `t.StrBuilder`
therefore satisfied the letter of canon while discarding upstream ownership.

Commit `844214d7a` establishes the following rule near the call-site import rules, applied here to
`Str`:

### Preserve dependency semantic namespaces

- When a dependency exposes a disciplined semantic type namespace, local type pools MUST re-export
  and consumers MUST use the highest applicable namespace through the local `t` lane.
- Preserve the complete earned hierarchy: prefer `t.Str.Builder` over `t.StrBuilder` and
  `t.Str.Builder.Options` over `t.Str.BuilderOptions`.
- Re-export the root owner namespace; do not reconstruct, copy, or partially mirror its members
  downstream.
- A contract may occupy the leaf type position and own a subordinate namespace when a cohesive
  supporting family has earned that boundary.
- Do not create a namespace solely to satisfy this rule. Every level must be an earned semantic
  owner.
- Flat aliases MAY remain temporarily at the defining package as explicit compatibility bridges.
  They MUST project exactly from the canonical namespace, MUST be marked as compatibility aliases,
  and MUST have a planned removal boundary.
- New upstream and downstream code MUST use the canonical nested form while aliases exist.
- Direct named-leaf imports remain valid only when no disciplined upstream namespace exists or an
  existing explicit exception in this protocol applies.

Canonical example:

```ts
// Dependency owner:
import type * as TBuilder from './t.builder.ts';

export declare namespace Str {
  export type Builder = TBuilder.Instance;

  /**
   * Type contracts for string builders.
   */
  export namespace Builder {
    export type Options = TBuilder.Options;
    export type ToTextOptions = TBuilder.ToTextOptions;
  }
}

// Downstream local type pool:
export type { Str } from '@sys/std/t';

// Call site:
function render(out: t.Str.Builder, options?: t.Str.Builder.Options) {}
```

Rejected convenience flattening:

```ts
export type { StrBuilder } from '@sys/std/t';
function render(out: t.StrBuilder) {}

function renderWithOptions(options?: t.Str.BuilderOptions) {}
```

## Upstream `@sys/std` design

### Canonical source

Keep `m.Str/t.builder.ts` as the cohesive type factor, but rename its internal flat exports to the
concept-relative nouns:

```ts
Instance;
Options;
ToTextOptions;
```

The factor file remains namespace-free, as required by the type-factor protocol. It is internal
material curated by `m.Str/t.ts`; it must not leak root-level `t.Builder` names.

In `m.Str/t.ts`:

1. import the factor as a PascalCase type namespace such as `TBuilder`;
2. stop wildcard-exporting the factor file;
3. project the instance as the `Str.Builder` leaf type;
4. project the supporting family beneath the same `Str.Builder` namespace;
5. make `Str.Lib.builder` use `Builder.Options` and `Builder` directly;
6. remove the obsolete flat public aliases at this explicitly chosen compatibility boundary.

Target shape:

```ts
import type * as TBuilder from './t.builder.ts';

export namespace Str {
  export type Lib = {
    builder(options?: Builder.Options): Builder;
  };

  export type Builder = TBuilder.Instance;

  /**
   * Type contracts for string builders.
   */
  export namespace Builder {
    export type Options = TBuilder.Options;
    export type ToTextOptions = TBuilder.ToTextOptions;
  }
}
```

The complete `Str` namespace must retain canonical ordering: `Lib` first, then the `Builder` leaf
contract immediately followed by its same-name subordinate namespace, without disturbing unrelated
string contracts.

### Internal migration

Migrate `@sys/std` implementation and proof to:

```ts
t.Str.Builder;
t.Str.Builder.Options;
t.Str.Builder.ToTextOptions;
```

The obsolete compatibility names must not remain in declarations, proof, or production call sites.

## Downstream migration

### `@sys/workspace`

The live Workspace source had already removed `StrBuilder` from its local pool but retained a local
`ReturnType<typeof Str.builder>` alias. Export `Str` through the local pool, remove that inferred
substitute, and migrate the `m.run` formatter annotations to `t.Str.Builder`.

Known paths:

```text
code/sys/workspace/src/common/t.ts
code/sys/workspace/src/m.run/u/u.fmt.ts
```

### `@sys/tools`

Change the local pool from `StrBuilder` to `Str`, then migrate shell and document-graph contracts to
`t.Str.Builder`.

Known paths:

```text
code/sys.tools/src/common/t.ts
code/sys.tools/src/cli.shell/u.fmt.layout.ts
code/sys.tools/src/cli.crdt/cmd.doc.graph/t.hook.cmd.walk.ts
```

Do not reset, overwrite, stage, or restage the existing human/parallel work in Tools or Workspace.
Read the live files immediately before each surgical edit and preserve all unrelated changes.

## Red-first proof

### `@sys/std`

Before changing production contracts, add exact type proof requiring:

```ts
const builder: t.Str.Builder = Str.builder();
const options: t.Str.Builder.Options = {};
const toTextOptions: t.Str.Builder.ToTextOptions = {};

expectTypeOf(Str.builder).toEqualTypeOf<
  (options?: t.Str.Builder.Options) => t.Str.Builder
>();
expectTypeOf(builder).toEqualTypeOf<t.Str.Builder>();
expectTypeOf(options).toEqualTypeOf<t.Str.Builder.Options>();
expectTypeOf(toTextOptions).toEqualTypeOf<t.Str.Builder.ToTextOptions>();
```

The initial red proof failed on absent `t.Str.Builder*` members. The DMIND namespace-depth review
then added a second red proof that failed specifically because `Builder` was only a type and not yet
an owning namespace. The complete canonical references now pass through the local `t` lane,
`@sys/std/t`, and `@sys/std/types`.

Existing builder method assertions and both public type-root proofs use canonical names only.

### Downstream packages

Each downstream package now exports `Str` through its local type pool and consumes `t.Str.Builder`;
no downstream detached leaf remains.

Add no runtime behavior tests solely for a type spelling change. Retain and run existing focused
runtime tests around the affected formatters to prove the type migration did not disturb behavior.

## Verification

### `@sys/std`

```sh
cd /Users/phil/code/org.sys/sys/code/sys/std
deno task test --trace-leaks ./src/m.Str
deno task check
deno task dry
```

### `@sys/workspace`

```sh
cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno task test --trace-leaks ./src/m.run
deno task check
deno task dry
```

### `@sys/tools`

```sh
cd /Users/phil/code/org.sys/sys/code/sys.tools
deno task test --trace-leaks ./src/cli.shell ./src/cli.crdt/cmd.doc.graph
deno task check
deno task dry
```

Verification outcome:

- focused `@sys/std` Str proof with leak tracing: 3 files, 201 steps;
- focused Workspace `m.run` proof with leak tracing: 13 files, 134 steps;
- the Tools task's fixed package inputs caused the requested scoped invocation to run its complete
  suite: 124 files, 640 steps, all green;
- `@sys/std`, Workspace, and Tools package checks and dry-publishes pass;
- implementation and plan files pass configured formatting; the canon diff passes whitespace checks
  and received final human review;
- runtime `Str.builder` behavior and identity are unchanged.

Final residue scans are clean:

- `StrBuilder*` is absent from `@sys/std`, downstream local pools, and production call sites;
- `t.Str.Builder`, `t.Str.Builder.Options`, and `t.Str.Builder.ToTextOptions` are reachable through
  both `@sys/std/t` and `@sys/std/types`;
- runtime `Str.builder` identity and behavior remain unchanged.

## Landed repository and commit boundaries

1. Canon repository `/Users/phil/code/org.sys/sys.canon`:
   - `844214d7a7b769a0867ddce6a91cde860cf381db`
   - `docs(canon): preserve dependency type namespaces`
   - protocol wording and neutral examples only.
2. Implementation repository `/Users/phil/code/org.sys/sys`:
   - `7f085e138abb2b1c0ecbab3a1405131c5a58ae5d`
   - `refactor(types): namespace string builder contracts`
   - canonical upstream namespace, obsolete-alias removal, exact proof, and all known Workspace and
     Tools consumers.

The implementation landed atomically because removing the public aliases made separate upstream and
downstream commits non-bisectable. Canon remained isolated in its sibling repository.

## Non-goals

- No runtime `Str` API change.
- No builder behavior change.
- No renaming of `Str.builder`.
- No broad `@sys/std` namespace sweep.
- No broader public compatibility cleanup beyond removal of the obsolete `StrBuilder*` family.
- No direct downstream import of the internal `t.builder.ts` factor.
- No reconstruction of a downstream `Str` namespace.
- No edits to unrelated dirty Workspace, Tools, plans, generated bundles, or tests.
- No agent-owned Git staging or commits; the human landed both commits.

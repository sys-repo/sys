# Env namespace factoring STIER plan

- [ ] refactor(fs): namespace Env contract surface

## Scope

Package: `@sys/fs`.

Primary target:

- `code/sys/fs/src/m.Env/t.ts`

Adjacent updates:

- `code/sys/fs/src/m.Env/m.Env.ts`
- `code/sys/fs/src/m.Env/m.Is.ts`
- `code/sys/fs/src/m.Env/u.load.ts`
- `code/sys/fs/src/m.Env/u.init.ts`
- `code/sys/fs/src/common/libs.ts`

Non-goals:

- do not change dotenv lookup behavior;
- do not change process-env fallback behavior;
- do not change VSCode detection semantics;
- do not restructure legacy `m.Env/-.test.ts` placement in this pass.

## XHIGH review position

The old `m.Env/t.ts` surface was pre-canon flat:

- `EnvLib`
- `EnvLoadOptions`
- `EnvLoadSearch`
- `Env`
- `EnvIsLib`

The correct modern shape is a namespace-owned contract with `Env.Lib` first, then root contract
types, then obvious sub-namespaces. `Env.Load` is earned because the load concept owns multiple
support types. `Env.Is` is earned because the runtime exposes `Env.Is` as a sub-surface.

## Target shape

- `Env.Lib`
- `Env.Reader`
- `Env.InitOptions`
- `Env.Load.Method`
- `Env.Load.Options`
- `Env.Load.Search`
- `Env.Is.Lib`

## Namespace factoring decisions

- `Env.Lib` is the root runtime contract and appears first.
- `Env.Reader` names the object returned by `Env.load(...)`; it is clearer than generic `Instance`.
- `Env.Load.*` rolls up the load method plus options/search strategy because those types form one
  concept.
- `Env.InitOptions` remains root-level because init currently has only one support type; no extra
  `Env.Init` namespace is earned yet.
- `Env.Is.Lib` matches the runtime `Env.Is` sub-surface.
- No flat compatibility aliases: the old `export type Env = ...` name collides with the new
  namespace, and partial aliases would leave a misleading half-migration.

## Implementation steps

1. Refactor `src/m.Env/t.ts` to `export declare namespace Env` with `Lib` first.
2. Move loaded-reader contract to `Env.Reader`.
3. Move load contracts under `Env.Load`.
4. Move predicate library contract to `Env.Is.Lib`.
5. Update runtime annotations to `t.Env.*` through `./common.ts`.
6. Route `@std/dotenv` through `src/common/libs.ts` and import via `./common.ts`.
7. Replace local `hasOwn` helper with `Obj.hasOwn(...)`.
8. Replace self-package `await import('@sys/fs')` with package-local `Fs` import.
9. Search for stale flat references and unqualified reader use.
10. Run focused proof, then full package proof.

## Proof plan

From `/Users/phil/code/org.sys/sys/code/sys/fs`:

```sh
deno task check
```

```sh
deno task test --trace-leaks src/m.Env
```

Then, before closing:

```sh
deno task test
```

## Implementation status

Working tree implementation completed and verified.

Proof run:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/fs && deno fmt --check src/m.Env/t.ts src/m.Env/m.Env.ts src/m.Env/m.Is.ts src/m.Env/u.init.ts src/m.Env/u.load.ts src/common/libs.ts src/m.Env/-agent/env-namespace-factoring.stier.plan.md
cd /Users/phil/code/org.sys/sys/code/sys/fs && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/fs && deno task test --trace-leaks src/m.Env
cd /Users/phil/code/org.sys/sys/code/sys/fs && deno task test
```

## STIER residue pass

- `src/m.Env/t.ts` remains type-plane pure.
- `Env.Lib` is first in the public namespace.
- No direct type imports from `./t.ts` remain in `m.Env` runtime files.
- No stale flat type names remain: `EnvLib`, `EnvLoadOptions`, `EnvLoadSearch`, `EnvIsLib`.
- No self-package `@sys/fs` import remains inside `@sys/fs`.
- No local `hasOwn` duplicate remains when `Obj.hasOwn` is available.
- Runtime behavior tests are unchanged and green.

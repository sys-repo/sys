# Obj type namespace tidy plan

## Status

Complete.

The Obj type namespace cleanup arc is done. The final public type surface is the nested `t.Obj.*`
namespace, and the loose root aliases for subordinate Obj concepts have been retired.

This file is now an archival record, not an active plan.

## Commit record

- [x] `191f65e3b` `refactor(std): tidy Obj type namespace`
- [x] `62aaf792f` `refactor(std): migrate Obj internal type consumers`
- [x] `ccf3ef1f8` `refactor(yaml): use Obj namespace diff types`
- [x] `7de9bc11c` `refactor(std): retire loose Obj type aliases`

## Final truth

- `t.Obj.*` is the canonical public type surface.
- `Obj.Lib` is first in the public `Obj` namespace.
- Subordinate object concepts are discoverable under nested namespaces:
  - `t.Obj.Path.*`
  - `t.Obj.Path.Codec.*`
  - `t.Obj.Path.Curried.*`
  - `t.Obj.Path.Mutate.*`
  - `t.Obj.Path.Rel.*`
  - `t.Obj.Lens.*`
  - `t.Obj.Lens.Is.*`
- Loose public root aliases for subordinate Obj concepts are retired, including the former lens,
  path codec, curried path, path diff, and path relation names.
- Private/source type names were tightened to neutral local names where practical:
  - `Definition`
  - `Kind`
  - `Op`
  - `Options`
  - `Report`
  - `Instance`
  - `Relation`
  - `Unbound`
  - `Ref`
  - `ReadonlyUnbound`
  - `ReadonlyRef`
  - `ToObjectOptions`
  - `Unwrap`
- `CurriedPath` remains only as the runtime value/module name, not as a loose public root type
  alias.
- Runtime/API smoke for `Obj` lives in:
  - `code/sys/std/src/m.Obj/-test/-.test.ts`
- The `Obj` type-plane contract lives in:
  - `code/sys/std/src/m.Obj/-test/-t.test.ts`
- The maintained external YAML consumer was migrated from the loose diff alias to:
  - `t.Obj.Path.Mutate.Op`
- The compatibility decision was explicit: retire loose public root aliases after maintained
  consumers were migrated and scans were clean.

## Validation record

Validated during the arc with:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/std
deno fmt --check src/m.Obj/t.ts src/m.Obj/-test/-.test.ts src/m.Obj/-test/-t.test.ts src/m.Obj.Path/t.codec.ts src/m.Obj.Path/t.curried.ts src/m.Obj.Path/t.diff.ts src/m.Obj.Path/t.rel.ts src/m.Obj.Path/t.ts src/m.Obj.Lens/t.lens.ts src/m.Obj.Lens/t.toObject.ts
deno task check
deno task test --trace-leaks ./src/m.Obj/-test/-.test.ts ./src/m.Obj/-test/-t.test.ts ./src/m.Obj.Path ./src/m.Obj.Lens
deno task dry
```

Dependent YAML validation:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/yaml
deno task check
deno task test
```

Plan formatting validation:

```sh
cd /Users/phil/code/org.sys/sys
deno fmt --check -- -agent/-plan/@sys.std/obj-type-namespace-tidy.plan.md
```

## Residue record

Final scans were clean for maintained code usage of retired loose Obj type names under `code/**`,
excluding `node_modules`, `-tmp`, and `-archive`.

The only intentional remaining old-looking name is `CurriedPath` as the runtime object/module name
inside `m.Obj.Path`; it is not a loose exported public root type alias.

## Commit messages

Plan-record commit message:

```txt
docs(plan): record Obj type namespace tidy completion
```

Retire commit message:

```txt
refactor(std): retire loose Obj type aliases
```

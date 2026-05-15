# Plan: portable Cell endpoint refs through JSR and workspace resolution

## Status

Implemented and committed.

Related commits:

- `ac0c682c7 fix(cell): resolve JSR endpoint refs through workspace`
- `121113e95 docs(cell): prefer portable JSR endpoint refs`

This plan is retained as the final design/verification record for the endpoint-ref authority edge
found while hardening `@sys/cell` as a portable composition unit.

## Final outcome

Cell endpoint refs now separate three concerns:

```text
authored ref       exact `from` value in cell.yaml
package identity   normalized identity used for trust checks
import authority   concrete specifier selected by Deno for this run
```

For public/portable `@sys` endpoint refs, descriptors and DSL examples now prefer explicit JSR
authority:

```yaml
from: 'jsr:@sys/tools/serve'
```

Inside a workspace that owns the package, Deno resolves that same authored JSR ref to local
workspace source. Outside such a workspace, it remains the public JSR ref.

Cell-local adapters remain relative refs:

```yaml
from: './-services/local.ts'
from: './-tasks/local.ts'
```

Bare `@sys/...` refs still work when the caller's workspace/import map can resolve them, but docs and
samples no longer teach bare refs as the portable public form.

## Implemented behavior

The shared resolver lives at:

```text
code/sys/cell/src/m.cell/u.endpointRef.ts
```

It is used by both service and task endpoint resolution:

```text
code/sys/cell/src/m.cell/u.services/u.verify.ts
code/sys/cell/src/m.cell/u.task/u.resolve.ts
```

Rules now in force:

- Relative refs resolve to file URLs under the Cell root.
- Relative refs escaping the Cell root are rejected.
- Absolute local paths are rejected.
- `jsr:` is stripped only for trust identity.
- Runtime import authority is selected with `import.meta.resolve(...)`.
- Trust remains package-identity shaped; default trust is still `['@sys/']`.
- `trusted: ['@sys/', 'jsr:@sys/']` was deliberately avoided.
- `npm:` is not inferred or trusted by default.
- Resolution is a selection step, not a retry ladder.
- If Deno selects local workspace source and later import/evaluation fails, Cell does not silently
  fall back to JSR.
- Cell does not rewrite `cell.yaml`.

## Grounded probe

Pre-implementation runtime probe confirmed Deno already had the required selection behavior:

```sh
cd /Users/phil/code/org.sys/sys \
  && deno eval "console.log(import.meta.resolve('jsr:@sys/tools/serve'))"
# → file:///Users/phil/code/org.sys/sys/code/sys.tools/src/cli.serve/mod.ts

cd /tmp \
  && deno eval --no-config "console.log(import.meta.resolve('jsr:@sys/tools/serve'))"
# → jsr:@sys/tools/serve
```

That allowed the implementation to stay small: Cell verifies trust; Deno resolves authority.

## Test reality

The implementation is covered by resolver, service, and task tests.

Primary test paths:

```text
code/sys/cell/src/m.cell/-test/-u.endpointRef.test.ts
code/sys/cell/src/m.cell/-test/-u.services.verify.test.ts
code/sys/cell/src/m.cell/u.task/-test/-u.plan.test.ts
code/sys/cell/src/m.cell/u.task/-test/-u.verify.test.ts
```

Grounded assertions include:

- `jsr:@sys/...` derives trust identity `@sys/...`.
- `npm:@sys/...` does not derive trust identity `@sys/...`.
- JSR refs can select local workspace file URLs.
- JSR refs can remain public JSR refs when no workspace override resolves.
- Bare `@sys/...` refs still resolve inside the workspace.
- Bare unresolved refs fail clearly and point toward explicit `jsr:` refs for portability.
- Services verify/import explicit `jsr:@sys/...` refs through workspace resolution.
- Services verify/import bare `@sys/...` refs through workspace resolution.
- Task planning reports selected local workspace specifiers for both JSR and bare refs.
- Task verification imports both JSR and bare refs inside the workspace.
- Relative local adapters remain root-constrained.
- Absolute and escaping local paths are rejected.
- Services and tasks share the same endpoint-ref rule.

Verification commands run after implementation/docs updates:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cell \
  && deno task test --trace-leaks \
    ./src/m.cli/-test/-u.help.test.ts \
    ./src/m.help/-test/-.test.ts \
    ./src/m.cell/-test/-u.endpointRef.test.ts \
    ./src/m.cell/-test/-u.services.verify.test.ts \
    ./src/m.cell/u.task/-test/-u.plan.test.ts \
    ./src/m.cell/u.task/-test/-u.verify.test.ts

cd /Users/phil/code/org.sys/sys/code/sys/cell \
  && deno task check
```

Both passed before these plan notes were finalized.

## Docs and sample reality

The public guidance now lives in the Cell DSL rather than as a heavy README contract section.

Updated docs/sample paths:

```text
code/sys/cell/-sample/cell.deploy/-config/@sys.cell/cell.yaml
code/sys/cell/-sample/cell.stripe/-config/@sys.cell/cell.yaml
code/sys/cell/src/m.help/yaml/dsl.yaml
code/sys/cell/src/m.help/yaml/dsl.service.yaml
code/sys/cell/src/m.help/yaml/dsl.service.static-serve.yaml
code/sys/cell/src/m.help/yaml/dsl.proxy-service.yaml
code/sys/cell/src/m.help/-bundle/-bundle.json
code/sys/cell/src/m.cli/-test/-u.help.test.ts
code/sys/cell/README.md
```

Final DSL communication:

- public `@sys` package endpoint refs should use explicit `jsr:@sys/...`;
- local adapters should use relative `./...` refs;
- other public scopes require explicit trust before Cell will accept them;
- agents should not duplicate bare and JSR spellings as equivalent user choices;
- owner configs still own mechanics and schema; Cell only records endpoint refs and config refs.

A final wording pass fixed an ambiguity where `jsr:<module>` could imply `jsr:jsr:@sys/...`. The DSL
now says to run the exact explicit JSR module ref when probing a JSR CLI entrypoint.

## STIER acceptance result

Accepted.

The original acceptance criteria were met:

- Portable descriptors can use `from: 'jsr:@sys/tools/serve'`.
- Inside the `sys` workspace, Deno resolves that ref to local workspace source.
- Outside a workspace, the same authored ref remains public JSR.
- Default trust remains `['@sys/']`.
- `jsr:@sys/` was not duplicated in default trust.
- `npm:` is not inferred or trusted by default.
- Local adapter refs remain constrained to the Cell root.
- Service and task endpoint resolution use one shared rule.
- Docs/examples teach the portable JSR spelling without making Cell a registry framework.

## Non-goals preserved

- No npm fallback.
- No general registry abstraction.
- No descriptor rewrite.
- No requirement to maintain both bare and JSR refs.
- No change to relative local adapter semantics.
- No service variant or Vite/HMR work.
- No trust policy language.

## Retire condition

This plan can be retired once the related implementation/docs commits have lived long enough that the
history itself is sufficient, or if a future endpoint-ref design supersedes this record.

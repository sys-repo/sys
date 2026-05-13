# @sys/tools/deploy: atomic push API plan

## Status

Implemented and landed.

Related implementation commit:

```text
feat(deploy): expose push helper for deploy endpoints
```

## Goal

Expose one public owner API:

```ts
Deploy.push({ cwd, config });
```

This pushes an already-staged deploy endpoint described by owner YAML.

This is the missing atomic counterpart to the existing public API:

```ts
Deploy.stage({ cwd, config });
```

## Why

`@sys/cell` can compose prep and deploy only if `@sys/tools/deploy` exposes atomic owner operations.

Cell composes:

```yaml
sample:deploy:
  - sample:deploy:prep
  - deploy:push
```

Deploy owns:

- endpoint YAML parsing;
- `${env:...}` resolution;
- staging output discovery;
- provider target resolution;
- provider push mechanics.

## Final shape

Public API:

```ts
Deploy.push({ cwd, config });
```

Internal/non-throwing seam:

```ts
pushEndpoint({ cwd, config });
```

The public API is exported from:

```text
code/sys.tools/src/cli.deploy/mod.ts
```

The push implementation lives under:

```text
code/sys.tools/src/cli.deploy/u.push/
```

## Non-goals preserved

No public deploy composition helper was added:

```ts
Deploy.stagePush(...); // intentionally absent
```

Stage+push remains caller composition. For Cell, that means YAML task composition, not deploy
package orchestration.

Also preserved:

- no `@sys/cell` changes in the deploy API commit;
- no sample Cell YAML changes in the deploy API commit;
- no deploy CLI behavior change;
- no CLI spinner/presentation moved into public API;
- no shell-command task primitive;
- no real Orbiter publish in tests.

## Semantics implemented

`Deploy.push({ cwd, config })`:

1. resolves `cwd` like `Deploy.stage(...)`;
2. resolves `config` relative to `cwd`;
3. loads and validates endpoint YAML through the deploy endpoint FS boundary;
4. resolves `${env:...}` refs from caller cwd with existing deploy/YAML behavior;
5. requires a provider;
6. resolves push targets from already-staged output;
7. checks that staged outputs include dist metadata;
8. executes provider push through existing provider mechanics;
9. returns a small success result or throws a clear deploy push error.

It does not stage. It does not prompt. It does not install presentation/spinner behavior. It does
not parse CLI argv.

## Error behavior

Providerless endpoint:

```text
Deploy.push: failed to push config: <path>
reason: no-provider
No provider configured for this endpoint.
```

Missing staged output:

```text
Deploy.push: failed to push config: <path>
reason: no-staging-output
Run staging first (no staging output found).
```

Missing/incomplete staged dist metadata is also reported as `no-staging-output`, with target context
retained on structured failures.

Provider push failures include provider hint/detail and preserve structured cause data.

## Tests/proof

Focused tests were added under:

```text
code/sys.tools/src/cli.deploy/-test/-u.push.test.ts
```

Coverage includes:

- `Deploy.push(...)` rejects providerless endpoints clearly;
- `pushEndpoint(...)` reports absent staging output for Orbiter endpoints;
- staging dirs without dist metadata are rejected before provider mutation;
- incomplete shard plans are rejected before provider mutation;
- env refs resolve from caller cwd before target resolution;
- provider push failure returns target context;
- successful push path can be tested with provider seams and no presentation output.

No real Orbiter publish is performed in tests.

Verification performed in the implementation thread:

```sh
deno fmt --check -- src/cli.deploy/mod.ts src/cli.deploy/t.namespace.ts src/cli.deploy/u.push/mod.ts src/cli.deploy/u.push/u.endpoint.ts src/cli.deploy/-test/-u.push.test.ts
deno check -- ./src/cli.deploy/mod.ts ./src/cli.deploy/u.push/u.endpoint.ts ./src/cli.deploy/-test/-u.push.test.ts
deno test -P=test --trace-leaks ./src/cli.deploy/-test/-u.push.test.ts
deno task check
```

## Follow-on

With this owner atom landed, the Cell sample can now wire pure composition:

```yaml
sample:deploy:prep:
  - pull:view
  - deploy:prep

sample:deploy:
  - sample:deploy:prep
  - deploy:push
```

The Cell follow-on belongs in `@sys/cell` only and should not change deploy APIs again.

# Plan: YAML env refs for deploy config

## Status

Complete/retired planning artifact for the config-env primitive exposed by the Cell deploy sample.

Landed:

- `@sys/yaml` pure `Yaml.EnvRef.resolveAst(ast, { get })` core primitive.
- `@sys/yaml/cli` `YamlConfig.Env.resolveAst(ast, { cwd, search? })` dotenv-backed helper.
- `@sys/tools/deploy` endpoint env-ref resolution before validation/execution.

Follow-up:

- Switch the Cell deploy sample to checked-in env-ref Orbiter config. This is now unblocked and
  should be tracked/landed with the sample work, not this primitive plan.

This file lives under `cli.deploy/-agent/` because deploy is the first consumer and the sample
pressure came from deploy endpoint YAML. The implementation should not be deploy-only.

## Trigger

A clean checked-in Orbiter endpoint wants this shape:

```yaml
provider:
  kind: orbiter
  domain: ${env:SYS_CELL_DEPLOY_ORBITER_DOMAIN}
  siteId: ${env:SYS_CELL_DEPLOY_ORBITER_SITE_ID}
```

The sample should not require checked-in operator IDs, local-only copied YAML, or placeholder
configs that validate but cannot run.

## BMIND review: current substrate

Read/confirmed current surfaces:

- `code/sys/fs/src/m.Env/*`
  - `Env.load({ cwd, search: 'cwd' | 'upward' })` exists.
  - `.env` loading and process-env fallback already exist.
  - `search: 'upward'` merges ancestor `.env` files root to leaf; leaf wins.
  - Empty `.env` values are present and do not fall through to process env.
- `code/sys/yaml/src/m.core/*`
  - `Yaml.parseAst`, `Yaml.walk`, `Yaml.toJS`, and AST scalar mutation exist.
  - Core YAML currently has no filesystem/env dependency, which is good.
- `code/sys/yaml/src/m.cli/m.YamlConfig/*`
  - `YamlConfig.File`, `YamlConfig.Ref`, menus, and edit helpers exist.
  - This layer owns CLI/config-file ergonomics, not current value interpolation.
- `code/sys.tools/src/cli.pull/u.github/u.client.ts`
  - Uses `Env.load({ search: 'upward' })` for GitHub tokens.
  - This proves upward `.env` is active practice, but it is bespoke token loading.
- `code/sys.tools/src/cli.deploy/u.endpoints/*`
  - Endpoint validation reads YAML text, parses to AST/JS, schema-validates, then semantic-validates
    paths/provider fields.
  - No env-ref resolution happens before schema validation.
- `code/sys.tools/src/common/u.config/*`
  - Older/shared JSON config helper; not the right place for YAML value refs.
- `@sys/tools` YAML owners (`deploy`, `pull`, `serve`, `crdt`)
  - Each has repeated read/validate/load wrappers.
  - Enough repetition exists to justify a reusable YAML config env-ref path.

## Hard TMIND design review

Hostile checks:

- If deploy hand-rolls string replacement, we will repeat it in pull/serve/crdt later.
- If `@sys/yaml` core starts loading `.env`, it couples a pure YAML layer to filesystem/env IO.
- If `@sys/yaml/cli` owns only the primitive, non-CLI/runtime config users cannot reuse it cleanly.
- If partial interpolation is allowed in v1, we accidentally design a templating language.
- If missing refs pass schema validation as literal strings, provider code receives lies.
- If defaults are allowed immediately, every consumer inherits secret/default policy before it is
  understood.
- If env refs mutate AST before all refs validate, failed validation can leave partial state.
- If map keys are interpolated, config structure becomes dynamic and harder to validate.
- If redaction is guessed globally, public fields become hidden or secrets leak by exception.
- If this lands only for Orbiter provider fields, Deno/Pull/Serve will grow ad hoc variants.

STIER conclusion:

- Core interpolation belongs in `@sys/yaml` as a pure AST value-ref primitive with an injected
  resolver.
- `.env` loading belongs in `@sys/yaml/cli` as config-file ergonomics built on `@sys/fs/env`.
- `@sys/tools/deploy` should be the first consumer and should add no provider-specific env parsing.

## Ownership split

```text
@sys/yaml
  pure YAML AST env-ref resolution
  no filesystem
  no Deno.env
  no .env loading

@sys/yaml/cli
  config-file convenience
  loads .env via @sys/fs/env
  calls @sys/yaml primitive

@sys/tools/deploy
  resolves endpoint YAML refs before schema/provider validation
  owns deploy-specific output/redaction policy
```

This keeps the primitive reusable without making core YAML a runtime/environment package.

## Proposed core primitive

Preferred public surface:

```ts
const resolved = Yaml.EnvRef.resolveAst(ast, {
  get: (name) => env.get(name),
});
```

Non-throwing return lives under the EnvRef namespace:

```text
t.Yaml.EnvRef.Resolve.Result
```

Public types are namespace-qualified only:

```text
t.Yaml.EnvRef.Lib
t.Yaml.EnvRef.Ref
t.Yaml.EnvRef.Resolve.Options
t.Yaml.EnvRef.Resolve.Result
```

Minimum ref record shape:

```ts
type Ref = {
  readonly path: t.ObjectPath;
  readonly name: string;
};
```

Implementation rule:

- collect refs first
- validate all refs
- only mutate scalar values after validation succeeds

This avoids partial AST mutation on failure.

## Proposed CLI/config helper

Preferred `@sys/yaml/cli` helper:

```ts
const resolved = await YamlConfig.Env.resolveAst(ast, { cwd });
```

Default behavior should be upward `.env` search:

```ts
const resolved = await YamlConfig.Env.resolveAst(ast, {
  cwd,
  search: 'upward', // default
});
```

Rules:

- `YamlConfig.Env.resolveAst` defaults `search` to `'upward'`.
- `search` is still surfaced as an explicit API option for callers that need stricter cwd-only
  loading.
- Supported search values mirror `@sys/fs Env.load`: `'cwd' | 'upward'`.

This helper should:

1. call `Env.load({ cwd, search: search ?? 'upward' })` from `@sys/fs/env`
2. call `Yaml.EnvRef.resolveAst(ast, { get })`
3. return the same non-throwing result shape

Presence semantics require `@sys/fs Env` to distinguish missing from present-empty values. Additive
prerequisite:

```ts
type Env = {
  get(key: string): string;
  has(key: string): boolean;
};
```

Keep existing `Env.get(key): string` behavior unchanged. `YamlConfig.Env` adapts with:

```ts
get: ((name) => env.has(name) ? env.get(name) : undefined);
```

This preserves empty `.env` values as present while allowing missing env refs to become diagnostics.

Do not overload `YamlConfig.File` in the first pass. `File` currently owns config
roots/paths/migration. Env value resolution is a distinct concern.

## Syntax v1

Supported only as a whole scalar string:

```text
${env:NAME}
```

Name grammar:

```text
^[A-Z_][A-Z0-9_]*$
```

Allowed:

```yaml
siteId: ${env:SYS_CELL_DEPLOY_ORBITER_SITE_ID}
domain: ${env:SYS_CELL_DEPLOY_ORBITER_DOMAIN}
```

Rejected in v1:

```yaml
url: https://${env:HOST}/path
path: ${env:ROOT}/${env:NAME}
siteId: ${env:site_id}
siteId: ${env:SITE_ID:-default}
```

Rules:

- whole scalar only
- scalar values only, not map keys
- no defaults
- no nested refs
- no shell-style expansion
- no type coercion
- no generic template engine

## Env source semantics

The config helper uses existing `@sys/fs/env` semantics:

```ts
Env.load({ cwd, search: search ?? 'upward' });
```

Rules:

- config-consuming tool supplies `cwd`
- `YamlConfig.Env.resolveAst` defaults to `search: 'upward'`
- callers may explicitly pass `search: 'cwd'` for stricter local-only loading
- process env is fallback when `.env` does not provide a key
- empty string from `.env` is present
- missing key is a YAML diagnostic before schema validation/execution

## Error behavior

Errors must be YAML-shaped diagnostics suitable for existing config validation output.

Example message:

```text
provider.siteId references missing env var: SYS_CELL_DEPLOY_ORBITER_SITE_ID
```

Requirements:

- no raw `${env:...}` reaches provider code
- non-interactive mode fails before action execution
- invalid env-ref syntax fails clearly
- partial interpolation fails clearly rather than being left literal

## Deploy integration

First deploy integration point:

```text
code/sys.tools/src/cli.deploy/u.endpoints/u.fs.ts
```

Flow:

1. read YAML text
2. parse AST
3. use caller-supplied deploy cwd when available, otherwise derive cwd from endpoint YAML path
4. resolve env refs via `YamlConfig.Env.resolveAst(ast, { cwd, search: 'upward' })`
5. convert resolved AST to JS
6. schema validate
7. semantic validate staging/source/provider fields

Keep `validateEndpointYamlText(text)` pure if possible. Add a second pure helper that accepts a
resolver, or move env-aware resolution into the FS wrapper before the pure schema validation step.

## Redaction policy

Core YAML should not decide redaction. It should only report refs.

Deploy-specific output policy:

- `domain` can display.
- `siteId` is not a credential, but is an operational identifier; display only where deploy already
  intentionally displays it.
- actual secret values must be redacted if future configs allow them as resolved values.
- `tokenEnv` remains an env var name, not a secret value.

## Tests

Implemented `@sys/yaml` core tests:

- resolves whole-scalar `${env:NAME}` with injected `get`
- rejects missing env key
- rejects invalid env var names
- rejects partial interpolation
- ignores non-string scalars
- does not resolve map keys
- does not mutate AST when validation fails
- returns ref path metadata

Implemented `@sys/yaml/cli` tests:

- resolves from cwd `.env`
- resolves from ancestor `.env` with `search: 'upward'`
- process env fallback works
- empty `.env` value is treated as present

Implemented `@sys/tools/deploy` tests:

- providerless stage YAML can use env refs in string leaves
- Orbiter provider `domain` and `siteId` can use env refs
- missing env ref fails validation before action execution
- resolved provider object contains concrete strings, never `${env:...}` literals

## Non-goals

- no Cell-specific behavior
- no deploy-only parser
- no generic templating engine
- no default value syntax
- no type coercion
- no map-key interpolation
- no automatic adoption by pull/serve/crdt in this pass
- no secret manager abstraction

## Acceptance

Met:

- `@sys/yaml` exposes a reusable pure env-ref AST resolver.
- `@sys/yaml/cli` exposes `.env` backed config-resolution ergonomics.
- `@sys/tools/deploy` resolves env refs before endpoint schema/provider validation.
- Missing refs fail clearly in non-interactive deploy flows.
- Existing deploy endpoint configs continue to validate.
- The Cell deploy sample can now replace placeholder-only Orbiter example config with a checked-in
  env-ref config.

Validation at retirement:

- `deno fmt --check` passed for touched env-ref/deploy files.
- `deno task check` and `deno task test` passed for the `@sys/yaml`/`@sys/yaml-cli` work.
- `deno test --no-check -P=test --trace-leaks ./src/cli.deploy` passed for deploy.
- `deno task test:deploy` remains blocked by unrelated upstream `sys/http` `HttpCacheCmd` type
  errors before deploy tests run.

## Commit spine

```text
feat(yaml): add pure env ref resolution for scalar leaves
```

```text
feat(yaml-cli): resolve env refs from dotenv-backed config contexts
```

```text
feat(cli.deploy): resolve endpoint env refs before validation
```

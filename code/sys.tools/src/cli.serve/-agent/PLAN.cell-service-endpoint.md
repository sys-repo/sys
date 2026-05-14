# Plan: harden `Serve.start(...)` as a Cell-compatible lifecycle endpoint

## Status

STIER sync: **DONE**.

The original "plan hardened, no implementation started" status is obsolete. The lifecycle endpoint
work landed in:

- `24ca7c661` — `feat(serve): support cell config refs in start endpoint`
- `53184aa8d` — `feat(serve): add lifecycle cancellation to start endpoint`
- `e69e58562` — `fix(cell): harden service start lifecycle`

Related service-status follow-ons now present around the same endpoint:

- `33c455e15` — `feat(types): add service status lifecycle contracts`
- `6e19610eb` — `feat(http): expose structured server status`
- `738f94e9f` — `feat(tools): expose structured serve status`
- `93aa8086c` — `feat(cell): render service status uniformly`
- `a30651019` — `refactor(http): keep server printing owner-local`
- `2fc7a2e80` — `fix(cell): refine service status output`
- `a0de3d353` — `feat(tools): surface dist metadata in serve status`
- `d74cd9628` — `fix(cell): render base service URL last`

## Current reality

`Serve.start(...)` is now a programmatic lifecycle endpoint that accepts the owner config-ref shape
and lifecycle cancellation:

```ts
await Serve.start({
  cwd,
  paths: { config },
  until,
});
```

Equivalent explicit config refs are accepted:

```ts
await Serve.start({ cwd, config, paths: { config }, until });
```

when both refs resolve to the same absolute file.

The current type surface is in:

```text
code/sys.tools/src/cli.serve/t.namespace.ts
```

Important current facts:

- `StartArgs = StartArgsBase & StartSelectorArgs`.
- `until?: t.UntilInput` lives on `StartArgsBase`.
- `paths.config` lives in the selector union, not as a generic base option.
- `StartDirArgs` and `StartProfileArgs` disallow `paths`.
- `StartConfigArgs` allows equivalent `paths.config` as an alias.
- `StartPathsConfigArgs` supports owner-only `{ paths: { config } }`.
- `StartResult.close(reason?: unknown)` is reason-compatible.
- `StartResult.finished` remains the underlying server-finished promise.
- `StartResult.status()` returns renderer-neutral `t.Service.Status`.

Selector normalization is in:

```text
code/sys.tools/src/cli.serve/u.startTarget.ts
```

It trims selector strings, resolves `config` and `paths.config` relative to caller `cwd`, accepts
same-file aliases, rejects conflicting refs with a targeted error, and then enforces exactly one
canonical selector among `dir`, config-ref, or `profile`.

Lifecycle propagation is in:

```text
code/sys.tools/src/cli.serve/u.start.ts
code/sys.tools/src/cli.serve/m.server/u.startServer.ts
```

Current propagation path:

1. `Serve.start(args)` passes `args.until` to `startContext(...)`.
2. `startContext(...)` passes `until` to `startServer(...)`.
3. `startServer(...)` forwards `until` to `Http.Server.start(...)`.
4. `Serve.start(...).finished` remains `context.server.finished`.
5. `Serve.start(...).close(reason)` delegates to the low-level close path and is idempotent.
6. If `until` closes the server first, a later `close(...)` is safe.

`Serve.start(...)` remains keyboardless and non-interactive. Low-level `startServer(...)` still has a
`keyboard` option for CLI flows; `Serve.start(...)` calls it with `keyboard: false`.

## Locked behavior

Coverage exists in:

```text
code/sys.tools/src/cli.serve/-test/-u.start.test.ts
```

The tests cover:

- type acceptance for `{ cwd, paths: { config }, until }`;
- loading from `paths.config`;
- equivalent `config` + `paths.config` refs;
- conflicting config refs;
- `paths.config` combined with `dir` or `profile` failing selector validation;
- `finished` + `close(reason?)` lifecycle behavior;
- external `until` closing the underlying server;
- idempotent close.

CLI parsing remains separate: `CliStartTargetSelectorKeys` are only `dir`, `config`, and `profile`.
There is no CLI `paths` concept.

## BMIND / evergreen design notes

- CLI surface and library surface stay separate.
- CLI owns argv, menus, optional browser open, keyboard/process presentation, and exit behavior.
- Library owns structured selector input, lifecycle start, `finished`, `close(reason?)`, and
  cancellation via `until`.
- `paths.config` is an owner/config-ref bridge for programmatic callers; it is not an argv feature.
- `until` belongs on lifecycle endpoints like `Serve.start(...)`, not automatically on finite
  operations.
- The serve-specific result shape intentionally remains stable; do not replace it with
  `t.HttpServerStarted` without a separate design pass.
- Owner status stays structured and renderer-neutral. Cell owns uniform rendering and ANSI.
- Dist metadata in serve status is optional, loaded once during async start, and absent when no valid
  canonical `dist.json` exists.

## Retire condition

No further implementation is required for the original lifecycle endpoint plan. Future changes should
open focused plans for new behavior, such as pure URL-helper extraction or additional artifact status
modeling.

# Plan: update origin-aware root-menu back behavior

## Confidence

High.

The existing base is stable enough for one cohesive implementation move. The missing concept is narrow and explicit: `update` needs to know whether it was launched directly or from the root menu. The current seams are already centralized enough that a pre-implementation refactor would likely add churn without reducing risk.

## Target posture

Implement in XHIGH.

This is a small user-facing control-flow change, but it crosses the root launcher and the update tool. XHIGH is warranted because the shape should land as a clean contract seam, not as an argv hack or root-special-case.

## User-visible behavior

### Direct update invocation

Examples:

```sh
sys update
sys update --latest
deno run -A jsr:@sys/tools/update
```

Behavior remains as-is:

- latest installed:
  - render version status
  - render latest/no-update message
  - exit
- update available, interactive:
  - render version status
  - show update/exit menu
- update available, non-interactive `--latest`:
  - update immediately

### Root-menu update invocation

Example:

```sh
sys
# select @sys/tools update from root menu
```

If update is available, update's interactive menu should show:

- update action
- `← back` instead of `(exit)`

Selecting `← back` returns to the root menu. It must not run the refresh/update command.

If update is already latest, behavior should remain update-local and simple:

- render version status
- render latest/no-update message
- return to caller with normal completion

## Design decision

Do not infer origin from argv.
Do not pass a hidden CLI flag.
Do not special-case update internals from the root launcher.

Introduce a small root dispatch context:

```ts
type ToolCliContext = {
  readonly origin: 'argv' | 'root-menu';
};
```

The root launcher owns origin detection:

- direct subcommand dispatch: `origin: 'argv'`
- root menu selection: `origin: 'root-menu'`

Tool CLIs may ignore the third argument unless they need it. `update` is the first tool that needs it.

## Implementation outline

### 1. Add root-local context type

File:

- `src/u.root/common.t.ts`

Add a root-local context type near the root command types:

```ts
export namespace Root {
  export type ToolCliOrigin = 'argv' | 'root-menu';
  export type ToolCliContext = { readonly origin: ToolCliOrigin };
}
```

Keep this root-local to avoid broad public API churn unless a wider package type surface becomes necessary.

### 2. Pass context through root dispatch

File:

- `src/u.root/u.dispatcher.ts`

Change the internal loaded CLI function shape from:

```ts
type CliFn = (cwd: t.StringDir, argv: readonly string[]) => Promise<unknown>;
```

to:

```ts
type CliFn = (
  cwd: t.StringDir,
  argv: readonly string[],
  context: t.Root.ToolCliContext,
) => Promise<unknown>;
```

Change `dispatchRootCommand` to accept a context arg and pass it to the child CLI:

```ts
export async function dispatchRootCommand(
  cwd: t.StringDir,
  command: t.Root.Command,
  argv: readonly string[],
  context: t.Root.ToolCliContext,
) {
  const cli = await loadCli(command);
  return await cli(cwd, argv.slice(1), context);
}
```

Return the child result so root can handle `{ kind: 'back' }`.

### 3. Mark direct dispatch as argv-origin

File:

- `src/u.root/m.cli.ts`

For direct command dispatch:

```ts
await dispatchRootCommand(cwd, args.command, argv, { origin: 'argv' });
```

This includes root subcommand help dispatch.

### 4. Loop root menu after child back

File:

- `src/u.root/m.cli.ts`

Current root menu flow dispatches once and exits. Replace the final menu dispatch with a loop:

```ts
while (true) {
  const picked = await rootMenu({ highlightUpdate: advisory.hasUpdate });
  if (picked.kind === 'exit') return;

  const result = await dispatchRootCommand(cwd, picked.command, [picked.command], { origin: 'root-menu' });
  if (isBackResult(result)) continue;
  return;
}
```

Add a tiny local type guard:

```ts
function isBackResult(value: unknown): value is { readonly kind: 'back' } {
  return typeof value === 'object' && value !== null && (value as { readonly kind?: unknown }).kind === 'back';
}
```

Use `Is` from local common if available in this root-local import lane; otherwise keep the guard simple and local because root common currently exports a slim cold-start surface.

### 5. Add update CLI context/result type

Files:

- `src/cli.update/t.namespace.ts`
- `src/cli.update/t.ts`

In `UpdateTool` namespace, add:

```ts
export type CliContext = {
  readonly origin?: 'argv' | 'root-menu';
};

export type CliResult = void | { readonly kind: 'back' };
```

Update `UpdateToolsLib.cli` to accept the optional third context arg and return the result:

```ts
cli(cwd?: t.StringDir, argv?: string[], context?: t.UpdateTool.CliContext): Promise<t.UpdateTool.CliResult>;
```

Note: the broader root context and update context can stay structurally compatible without importing root types into update.

### 6. Thread context into update CLI

File:

- `src/cli.update/m.cli.ts`

Change:

```ts
export const cli: t.UpdateToolsLib['cli'] = async (cwd, argv) => {
```

to accept `context`.

Direct/no context defaults to argv-origin semantics:

```ts
const source = context?.origin === 'root-menu' ? 'root-menu' : 'argv';
```

Then:

```ts
if (args.latest) return await runUpdate(cwd, { interactive: false, source });
return await runUpdate(cwd, { interactive: true, source });
```

### 7. Make runUpdate return back when requested

File:

- `src/cli.update/u.cmd.runUpdate.ts`

Add local types:

```ts
type RunUpdateSource = 'argv' | 'root-menu';
type RunUpdateResult = void | { readonly kind: 'back' };
```

Change `runUpdate` opts:

```ts
opts: { interactive?: boolean; source?: RunUpdateSource } = {}
```

Return type:

```ts
Promise<RunUpdateResult>
```

In interactive update-available branch:

- `EXIT` action remains for direct source
- `BACK` action is used for root-menu source

Menu option labels should use symmetric indentation.

Recommended shape:

```ts
const BACK = '__back__';
const EXIT = '__exit__';
const cancelAction = source === 'root-menu' ? BACK : EXIT;
const cancelLabel = source === 'root-menu' ? `  ${c.gray('← back')}` : c.dim(c.gray('(exit)'));
```

Update action label should be equally clean:

```ts
{ name: `  update to ${c.green(version.latest)} now`, value: UPGRADE }
```

If `BACK`, return `{ kind: 'back' }`.
If `EXIT`, keep current behavior.

Non-interactive and latest paths return `undefined` as before.

### 8. Consider tiny formatter helper only if earned

Do not pre-extract a full menu formatter.

If the update menu labels get noisy in `u.cmd.runUpdate.ts`, add a tiny helper in `u.fmt.ts` only for labels:

```ts
updateMenuOptions(version, { source })
```

But prefer keeping it local unless the final code reads mechanically cluttered.

## Tests

### Root dispatcher

File:

- `src/u.root/-test/-u.dispatcher.test.ts`

Add/adjust:

- `dispatchRootCommand` forwards the third context arg to the child CLI.
- `dispatchRootCommand` returns the child result.

### Root CLI

File:

- `src/u.root/-test/-m.cli.test.ts`

Add/adjust:

1. Direct root subcommand dispatch sends `origin: 'argv'`.
2. Root menu selection sends `origin: 'root-menu'`.
3. Root menu reopens when dispatched child returns `{ kind: 'back' }`.

Use injected `rootMenu` and `dispatchRootCommand` deps to avoid real prompts.

### Update runUpdate

File:

- `src/cli.update/-test/-.test.ts`

Add:

1. Direct interactive update menu still includes `(exit)`.
2. Root-menu interactive update menu includes `← back` instead of `(exit)`.
3. Selecting back returns `{ kind: 'back' }` and does not refresh cache.

Existing tests already cover:

- latest exits without prompting
- update available prompts before refreshing
- advisory persistence failure is fail-quiet

### Update CLI

Possibly in same update test file:

- `cli(cwd, [], { origin: 'root-menu' })` passes root-menu source into `runUpdate` only if the dependency seam makes this cheap.
- If not cheap, rely on `runUpdate` unit coverage plus root dispatcher coverage.

## Verification

Run narrow first:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.tools
deno fmt src/u.root src/cli.update
deno task test --trace-leaks ./src/u.root/-test ./src/cli.update/-test
deno task check
```

If those pass, optionally run the full package test:

```sh
deno task test
```

## Risks and mitigations

### Risk: broad CLI type churn

Mitigation:

- Keep third-arg context optional/structural.
- Tools that ignore it remain valid at runtime.
- Only root dispatcher and update need semantic awareness.

### Risk: Deno type check rejects narrower tool CLI signatures

Mitigation:

- `loadCli` casts imported tool `cli` to the root `CliFn`; JS functions can receive extra ignored args.
- Public tool lib types need not all change unless the type checker forces it.

### Risk: root menu loop changes behavior for other tools

Mitigation:

- Only loop on exact `{ kind: 'back' }` result.
- Existing tools generally return `void` or call `Deno.exit`; behavior remains unchanged.

### Risk: update latest path from root menu feels like it should go back

Decision:

- Do not add back on latest path in this move.
- The request specifically targets update-available interactive menu behavior.
- Latest path currently exits after status; keep that stable.

## Acceptance

The implementation is acceptable when:

- Direct `sys update` behavior is unchanged.
- Root-menu-selected update shows `← back` instead of `(exit)` when update is available.
- Selecting `← back` returns to the root menu.
- Selecting update still refreshes cache and renders success.
- Tests pin dispatch origin, back propagation, and update menu labels.

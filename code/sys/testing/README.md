# Testing

`@sys/testing` provides Deno-native BDD registration, assertions, and scoped fixtures for web,
server, filesystem, and browser tests.

## Verify

```sh
deno task check
deno task test
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" deno task test:browser
deno task dry
```

`deno task test` runs ordinary units without subprocess authority, then isolated sanitizer fixtures
with Deno-only authority. It excludes browser tests.

### Browser authority

A browser test must start Chrome; it does not need permission to start every program on the host.
`CHROME_BIN` is trusted orchestration input: one canonical, absolute, regular executable—not a
symlink. The browser task rejects permission-list delimiters, binds that same path to both Deno's
sole run grant and the Browser launch argument, then removes `CHROME_BIN` from the proof process.
The path above is the concrete Darwin form; Linux CI supplies its host's canonical path.

The task separates no-run units, Deno-only bundle preparation, Chrome-only integration, and a
postflight with only host process-list run authority. No test process can launch both Deno and
Chrome. Testing still owns the Chrome profile, loopback CDP session, diagnostics, bounded
termination, and cleanup. A failed run retains its evidence; a later preflight will not overwrite
it.

The boundary is deliberately narrow. It proves which pathname the Deno proof process may execute,
not what that file is or what Chrome may do. If a trusted caller sets `CHROME_BIN=/bin/sh`, Deno
will faithfully grant `/bin/sh`; the browser run should fail, but the selection itself is not
attested. Likewise, executable replacement after validation and Chrome's arguments or descendants
remain operating-system concerns. The finite task prevents browser-test code from directly launching
Deno, shells, Node, package managers, or unrelated executables when the caller selected Chrome; it
does not claim to sandbox Chrome. Ordinary Browser API discovery remains a convenience, not this
proof.

## Browser tests

Import `Browser` from `@sys/testing/server`.

`Browser.load(...)` loads one URL and reports browser errors.

`Browser.ServiceWorker.scenario(...)` runs an ordered sequence of `navigate`, `reload`, `update`,
and `observe` actions in one temporary Chrome profile. The first navigation fixes the origin.
Results are frozen snapshots of that run; they say nothing about another browser profile.

The public API does not expose arbitrary page evaluation, the CDP client, launch flags, or the
profile path.

## Execution

The BDD API registers native Deno tests. Deno owns scheduling, sanitizers, permissions, timeouts,
diagnostics, and reporting.

Top-level options pass to `Deno.test`. Supported nested options pass to `Deno.TestContext.step`.
Nested permissions and timeouts are rejected because Deno steps cannot enforce them.

Operation and resource sanitizers are enabled at the workspace root. Parent teardown may finish work
started by a nested step before Deno checks the parent. Opt out only on the affected top-level test
with `sanitizeOps: false` or `sanitizeResources: false`.

`todo` registers an ignored test with a visible `[todo]` name. Its body does not run.

Use `node:test` only for compatibility. Deno runs Node-compatible tests without operation, resource,
or exit sanitizers.

## Write a test

Name module contract tests `-.test.ts` and focused tests `-m.<subject>.test.ts`. Deno discovers
`*.test.ts`; the leading hyphen keeps tests beside their source.

```ts
import { describe, expect, it } from '@sys/testing';

describe('My Suite', () => {
  it('returns the expected value', () => {
    expect(123).to.eql(123);
  });
});
```

Use `.equal` only for identity and `.eql` for structural equality.

Use the server entry point when a test needs filesystem or browser helpers:

```ts
import { describe, expect, Fs, it, Path } from '@sys/testing/server';
```

## Web fixtures

A Web fixture owns a temporary runtime change and restores the prior property descriptor.

`@sys/testing/web` provides `Property` transactions plus ready-made `Fetch` and `WebSocket`
fixtures. Both fixtures build on `Property`, so setup, rollback, and restoration follow one
contract.

Import the fixtures from `@sys/testing/web`:

```ts
import { WebFixture } from '@sys/testing/web';
```

Every mock handle supports `using` and `.dispose()`. Successful disposal restores the exact prior
descriptor; repeated disposal has no effect.

`WebFixture.Property.isCleanupError(error)` identifies incomplete cleanup. The error's `rollback`
handle retries only unfinished work, including after a `using` scope. If the scope body and disposal
both fail, JavaScript throws a `SuppressedError` containing both failures.

Dispose nested mocks in reverse creation order (LIFO); a `using` scope does this automatically. Do
not mutate an owned property or mock the same target and property in parallel tests.

### Property

Use `Property.mock` to replace one or more own properties in one transaction.

```ts
const target = {};

{
  using mock = WebFixture.Property.mock([
    {
      target,
      key: 'status',
      descriptor: { configurable: true, value: 'testing' },
    },
  ]);

  Object.getOwnPropertyDescriptor(target, 'status')?.value; // "testing"
}

Object.getOwnPropertyDescriptor(target, 'status'); // undefined
```

A new property must be configurable so it can be removed. For ordinary objects, irreversible changes
are rejected before any target is mutated.

Setup installs every entry or rolls back in LIFO order. If setup rollback or disposal cannot finish,
the cleanup error retains a `rollback` handle for the remaining entries.

Proxies and host objects must report stable, truthful descriptors. If restoration is blocked,
correct the blocking condition and call `rollback` again.

### Fetch

`Fetch.mock` replaces `globalThis.fetch`. The replacement controls all Fetch behavior, including
abort handling.

```ts
{
  using mock = WebFixture.Fetch.mock(async (input, init) => {
    const request = new Request(input, init);
    request.signal.throwIfAborted();
    return Response.json({ ok: true });
  });

  await fetch('https://example.test/data');
}
```

### WebSocket

`WebSocket.mock` replaces `globalThis.WebSocket` with a small deterministic test double. It provides
`url`, `readyState`, state constants, microtask-driven open and close events, and a no-op `send`. It
does not model messages, protocols, or `CloseEvent` metadata.

```ts
{
  using mock = WebFixture.WebSocket.mock();
  const socket = new WebSocket('ws://example.test/socket');
}
```

## Mock the DOM

`DomMock` installs a server-side DOM for a test suite. Importing the entry does not install DOM
globals; `init` registers lifecycle hooks, `polyfill` installs the DOM, and `afterAll` restores the
prior environment.

```ts
import { afterAll, beforeAll } from '@sys/testing/server';
import { DomMock } from '@sys/testing/server/dom';

DomMock.init({ beforeAll, afterAll });

document.addEventListener('keydown', (event) => {
  // Handle the event.
});

const event = DomMock.Keyboard.keydownEvent('z');
DomMock.Keyboard.fire(event);
```

Call `DomMock.unpolyfill()` only when a test must restore the environment before `afterAll`.

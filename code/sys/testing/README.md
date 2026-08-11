# Testing

`@sys/testing` provides Deno-backed BDD tests, assertions, runtime fixtures, and browser/server test
helpers.

## Verify

```sh
deno task check
deno task test
deno task dry
```

The test suite opens a local page in Chrome or Chromium. Set `CHROME_BIN` when the browser is not in
a standard location.

## Execution

The BDD API registers native Deno tests. Deno controls scheduling, sanitizers, permissions,
timeouts, diagnostics, and reporting.

Top-level options pass to `Deno.test`. Supported nested options pass to `Deno.TestContext.step`.
Nested permissions and timeouts are rejected because Deno steps cannot enforce them.

Workspace tests fail on leaked asynchronous operations or resources. Teardown may finish work
started in a nested step before the parent leak check. To disable a leak check for one test, name
that check explicitly.

`todo` registers an ignored test with a visible `[todo]` name. Its body does not run.

Use `node:test` only for compatibility. Deno runs Node-compatible tests without operation, resource,
or exit sanitizers.

## Write a test

Use `-.test.ts` for a module contract and `-m.<subject>.test.ts` for focused behavior. Deno
discovers `*.test.ts`; the leading hyphen keeps tests grouped with their source files.

```ts
import { describe, expect, it } from '@sys/testing';

describe('My Suite', () => {
  it('returns the expected value', () => {
    expect(123).to.eql(123);
  });
});
```

Use the server entry point when a test needs filesystem or browser helpers:

```ts
import { describe, expect, Fs, it, Path } from '@sys/testing/server';
```

## Web fixtures

`@sys/testing/web` is a toolkit for building lifecycle-safe Web-runtime mocks. It includes
ready-made Fetch and WebSocket fixtures and the property transaction used to build more.

Import Web-runtime fixtures from `@sys/testing/web`:

```ts
import { WebFixture } from '@sys/testing/web';
```

Every mock handle supports both `using` and `.dispose()`. Successful disposal restores the exact
prior property descriptor. Calling it again has no effect.

`WebFixture.Property.isCleanupError(error)` identifies incomplete cleanup. Its `rollback` handle
remains available after a `using` scope and retries only unfinished work. If the scope body also
throws, JavaScript retains the cleanup error inside `SuppressedError`.

Dispose nested mocks in reverse creation order (LIFO). A `using` scope does this automatically. Do
not mutate an owned property or run parallel tests that mock the same target and property.

### Property

Use `Property.mock` to replace one or more own properties as one transaction.

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

A new temporary property must be configurable so it can be removed. For ordinary objects, any change
that cannot be undone is rejected before a target is changed.

Setup either installs every entry or restores those already installed. Incomplete setup and disposal
both retain retry authority through the cleanup error.

Exact proxy and host-object restoration requires stable, truthful property descriptors. If cleanup
is rejected, correct the blocking condition and retry through `rollback`.

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

`DomMock` installs a server-side DOM for a test suite. The `afterAll` hook restores the prior
environment.

```ts
import { afterAll, beforeAll, DomMock } from '@sys/testing/server';

DomMock.init({ beforeAll, afterAll });

document.addEventListener('keydown', (event) => {
  // Handle the event.
});

const event = DomMock.Keyboard.keydownEvent('z');
DomMock.Keyboard.fire(event);
```

Call `DomMock.unpolyfill()` only when a test must restore the environment before `afterAll`.

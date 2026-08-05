# Testing

`@sys/testing` combines BDD registration, assertions, fixtures, and environment-specific helpers.

## Local verification

```sh
deno task test
```

The normal test suite includes a `Browser.load(...)` proof that opens a local page in an installed
Chrome/Chromium browser. Set `CHROME_BIN` if Chrome is not in a common platform location.

## Test-runner authority

BDD registration follows one authority chain:

```text
@sys/testing and @sys/std/testing
  → @sys/types/testing
  → Deno.test and Deno.TestContext.step
  → Deno execution, sanitizers, permissions, timeouts, diagnostics, and reporting
```

`@sys/types/testing` owns the stable BDD vocabulary: `describe`, `it`, hooks, modifiers, nested
registration, and nested focus. Deno owns execution. The adapter implements no scheduler, sanitizer,
reporter, permission system, or timeout mechanism.

Top-level options pass to `Deno.test`. Nested sanitizer and ignore keys pass to
`Deno.TestContext.step` only when specified; omitted keys remain omitted so Deno controls
inheritance and enforcement. Under Deno 2.9.4, `await t.step(...)` does not independently settle
operation or resource leaks. Later teardown may complete pending work; state retained through the
suite may still fail its strict parent boundary. The adapter reinterprets neither that timing nor
the step result. Nested permissions and timeouts fail clearly because Deno steps cannot enforce
them.

Workspace tests enable operation and resource sanitizers at the root. Exit sanitization keeps Deno's
per-registration default. Local exceptions must name each disabled signal explicitly. Deliberately
clean and leaking fixtures verify each native diagnostic.

`todo` registers an ignored test with a visible `[todo]` name; its body does not execute. Raw
`node:test` remains a Node-compatible edge and needs neither an installed Node.js runtime nor an npm
runner. It is not the default because Deno registers Node-compatible tests with operation, resource,
and exit sanitizers disabled.

## Examples

Import test helpers in browser and server environments:

```ts
import { describe, expect, it, Testing } from '@sys/testing';
```

Or import helpers with server-side POSIX extensions:

```ts
import { describe, expect, Fs, it, Path, Testing } from '@sys/testing/server';
```

### Global Fetch fixture

Install a Fetch-compatible test function and restore the prior global exactly:

```ts
import { WebFixture } from '@sys/testing/web';

const mock = WebFixture.Fetch.mock(async (input, init) => {
  const request = new Request(input, init);
  request.signal.throwIfAborted();
  return Response.json({ ok: true });
});

try {
  await fetch('https://example.test/data');
} finally {
  mock.dispose();
}
```

The replacement owns Fetch and abort behavior. Dispose nested mocks in LIFO order, and do not
overlap this process-global fixture across parallel tests.

Name a unit-test file `-<Subject>.test.ts`. The runner discovers `*.test.ts`; the leading hyphen
keeps unit tests visually grouped within their source folder.

```ts
import { describe, expect, it } from '@sys/testing';

describe('My Suite', () => {
  it('does something', () => {
    expect(123).to.eql(123);
  });
});
```

## Mocking the DOM

Use `DomMock` to simulate the DOM on the server:

```ts
import { afterAll, beforeAll, DomMock } from '@sys/testing/server';

// Install a browser `window` on `globalThis`.
DomMock.init({ beforeAll, afterAll });

// Dispatch a keyboard event.
document.addEventListener('keydown', (e) => {
  /* handle keyboard event */
});

const event = DomMock.Keyboard.keydownEvent('z');
DomMock.Keyboard.fire(event);

// Restore the server `globalThis` environment at any time.
// Optional: `DomMock.init` already restores the environment in `afterAll`.
DomMock.unpolyfill();
```

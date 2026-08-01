# Testing

Tools for testing. Standard testing helpers (surfaced from
[@sys/std](https://jsr.io/@sys/std/testing)).

### Local verification

```sh
deno task test
```

The normal test suite includes a `Browser.load(...)` proof that opens a local page in an installed
Chrome/Chromium browser. Set `CHROME_BIN` if Chrome is not in a common platform location.

### Examples

Import test helpers (all environments, browser AND server):

```ts
import { describe, expect, it, Testing } from '@sys/testing';
```

or import helpers with server (posix) extensions:

```ts
import { describe, expect, Fs, it, Path, Testing } from '@sys/testing/server';
```

### Fetch global fixture

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

Setup a simple unit-test file named: `-<Subject>.test.ts`.

The test runner picks up on the `*.test.ts` pattern, and the `-<Subject>.` name prefix highlights it
both visually as a "unit test" in the folder as well as ensuring the tests are naturally grouped
together within the folder structure.

```ts
import { describe, expect, it, Testing } from '@std/testing';

describe('My Suite', () => {
  it('does something', async () => {
    await Testing.wait(300);
    expect(123).to.eql(123);
  });
});
```

## Mocking the DOM

The DOM can be simulated on the server using `DomMock`:

```ts
import { afterAll, beforeAll, DomMock } from '@sys/testing/server';

// Setup the environment with a browser `window` object (`globalThis`).
DomMock.init({ beforeAll, afterAll });

// Sample interaction with keyboard:
document.addEventListener('keydown', (e) => {
  /* handle keyboard event */
});

const event = DomMock.Keyboard.keydownEvent('z');
DomMock.Keyboard.fire(event);

// Restore the server `globalThis` environment at any time.
// NB: not required because `Dom.init` above cleans up `afterAll`.
DomMock.unpolyfill();
```

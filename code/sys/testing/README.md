# Testing
Tools for testing.  
Standard testing helpers (surfaced from [@sys/std](https://jsr.io/@sys/std/testing)).


### Examples
Import test helpers (all environments, browser AND server):

```ts
import { expect, describe, it, Testing } from '@sys/testing';
```

or import helpers with server (posix) extensions:

```ts
import { expect, describe, it, Testing, Fs, Path } from '@sys/testing/server';
```


Setup a simple unit-test file named: `-<Subject>.test.ts`.

The test runner picks up on the `*.test.ts` pattern, and the
`-<Subject>.` name prefix highlights it both visually as a "unit test" in
the folder as well as ensuring the tests are naturally grouped together
within the folder structure.

```ts
import { Testing, describe, expect, it } from '@std/testing';

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
import { DomMock } from '@sys/testing/server';

// Setup the environment with a browser `window` object (`globalThis`).
DomMock.polyfill();

// Sample interaction with keyboard:
document.addEventListener('keydown', (e) => {
  /* handle keyboard event */
});

const event = DomMock.Keyboard.keydownEvent('z');
DomMock.Keyboard.fire(event);

// Restore the server `globalThis` environment.
DomMock.unpolyfill();
```

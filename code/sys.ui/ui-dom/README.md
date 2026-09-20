# @sys/ui-dom

Browser-oriented helpers for DOM events, keyboard input, files, storage, and URLs. Operations that
touch the DOM, window, or storage require those host APIs; URL utilities also include operations
that do not depend on a browser.

## Entry points

The root exports `Dom`, `File`, `Kbd`, `Keyboard`, `LocalStorage`, and `Url`. Use focused subpaths
for:

- **Input and events:** [`/events`](https://jsr.io/@sys/ui-dom/doc/events) and
  [`/keyboard`](https://jsr.io/@sys/ui-dom/doc/keyboard).
- **Files and storage:** [`/file`](https://jsr.io/@sys/ui-dom/doc/file) and
  [`/local-storage`](https://jsr.io/@sys/ui-dom/doc/local-storage).
- **URLs and host information:** [`/url`](https://jsr.io/@sys/ui-dom/doc/url) and
  [`/user-agent`](https://jsr.io/@sys/ui-dom/doc/user-agent).

`/t` provides types only. See the [API documentation](https://jsr.io/@sys/ui-dom/doc) for details.

## Read a stored preference

In a browser with accessible `localStorage`, read a namespaced value without writing:

```ts
import { LocalStorage } from 'jsr:@sys/ui-dom/local-storage';

type Preferences = { theme: 'light' | 'dark' };
const preferences = LocalStorage.ns<Preferences>('my-app');
const theme = preferences.get('theme', 'light');
console.info(theme);
```

`get` expects the JSON envelope written by `put`, such as `{"value":"dark"}`, not a raw JSON value.

The fallback applies only when the key is absent. Storage access and JSON parsing can throw, and the
TypeScript type does not validate stored values. Namespaces prefix keys; they are not access
control.

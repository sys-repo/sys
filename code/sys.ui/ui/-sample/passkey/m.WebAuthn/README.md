# WebAuthn browser mechanism

This module provides the browser operations used in passkey registration and sign-in: creating a
public-key credential and requesting an assertion from an existing credential. These results require
verification by the application's service; obtaining them does not create an account or establish a
session.

Native WebAuthn options and results are preserved, keeping browser interaction separate from
application policy, transport, and UI state.

- `availability()` inspects secure-context and API exposure without opening a ceremony. Available
  does not establish authenticator possession, usable credentials, or service readiness.
- `create({ publicKey, signal })` creates a credential; `get({ publicKey, signal, mediation })`
  acquires an assertion. Supply native binary WebAuthn options. The complete native option object is
  forwarded unchanged; omitted optional settings retain browser semantics.
- Each ceremony returns the original browser credential with its corresponding response type, or
  `null` if the browser returns no credential. A null result does not identify the cause.
- Ceremonies reject with `NotSupportedError` when secure-context or API requirements are unmet, and
  with `TypeError` for unexpected credential or response kinds. Platform exceptions propagate
  unchanged; `NotAllowedError` does not distinguish user cancellation from other causes.

Start ceremonies from explicit user actions. The caller supplies challenges, relying-party and user
identity, credential lists, algorithms, and enrollment and verification policy. The service owns
challenge issuance and validation, account binding, and session authority. The application owns
transport and any encoding required by that service. Keep raw credential results out of diagnostic
snapshots, logs, and local storage.

Importing the module does not access browser APIs. Ceremonies start only when called. Cancellation
is forwarded to the browser; it is not rollback and does not suppress stale results. The application
must coordinate concurrent requests and guard updates to its state.

Tests use browser-boundary doubles, not real authenticators. From `code/sys.ui/ui`:

```sh
deno task test --trace-leaks ./-sample/passkey/m.WebAuthn/-test/
```

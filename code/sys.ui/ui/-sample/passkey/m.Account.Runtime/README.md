# AccountRuntime (client lifecycle)

`AccountRuntime` lets a host create an [account], sign in, add a [passkey], or sign out. It runs
[browser ceremonies](../m.WebAuthn/README.md), sends [Accounts commands](../m.Accounts/README.md),
and keeps the session's [bearer credential] in memory. The host decides how to present the runtime's
snapshots. The service verifies ceremony responses and commits account changes.

## Before creating a [passkey]

With the [reference service](../m.Account.Service/README.md), use designated human-controlled test
accounts. **Show this warning before offering account creation or passkey enrollment:**

> Restarting the service erases test accounts, registered keys, and sessions. Your authenticator may
> keep the passkey, but you can no longer use it to sign in to the old account.

Reloading the page is different: it forgets the local credential without revoking the remote
[session]. The user can sign in again while the service still has the registration.

## Usage

Create one runtime for the host's lifetime. `start()` checks browser support without sending a
request or opening a ceremony. The host supplies `render` and all configuration values below.

```ts
import { AccountRuntime } from './mod.ts';

const runtime = AccountRuntime.create({
  endpoint: 'https://accounts.example.test/cmd',
  namespace: 'accounts',
  rpId: 'example.test',
  policy: { maxBytes: { request: 32_768, response: 32_768 }, timeout: 5_000 },
});

runtime.start();
const update = () => render(runtime.state.current);
const subscription = runtime.state.changed$.subscribe(update);
update(); // Changes are not replayed: render the initial snapshot too.
```

Call `run()` from a user action, not from render: for example, `await runtime.run('sign-in')`. When
the view detaches, call `subscription.unsubscribe()`. On page departure, call `depart()`; on
restoration, call `start()`. Call `dispose()` when the owner no longer needs the runtime.

## References

- [Host contract: binding, page lifetime, and recovery](./README.contract.md)
- [Types](./t.ts)

[account]: https://www.w3.org/TR/webauthn-3/#user-account
[passkey]: https://www.w3.org/TR/webauthn-3/#passkey
[bearer credential]: https://www.rfc-editor.org/rfc/rfc6750.html#section-1.2
[session]: https://pages.nist.gov/800-63-4/sp800-63b/session/#sessmgmt

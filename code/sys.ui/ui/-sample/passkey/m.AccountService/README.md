# AccountService

An in-memory reference service for [passkey](https://www.w3.org/TR/webauthn-3/#passkey)
[account](https://www.w3.org/TR/webauthn-3/#user-account) creation, sign-in, enrollment, and
[session](https://pages.nist.gov/800-63-4/sp800-63b/session/#sessmgmt) management.

Browser ceremonies produce credentials and assertions—not account authority. This service verifies
their responses and owns account/session state; hosts own browser interaction, transport, and UI.

- Explicit policy and bounded records in one disposable instance.
- Request-local handlers use the shared [Accounts contract](../m.Accounts/README.contract.md).
- Construction opens no listener or browser ceremony.

This is not production identity infrastructure. **Before credential creation, warn users that
service restart loses account/session records while authenticator entries may survive.** Use
designated human-controlled test accounts.

## Status

Sample-local, not a published package API. Automated tests do not establish real-browser or
authenticator acceptance.

## Implementation

[Construction and request admission](./u/u.createWith.ts) compose one private
[authority owner](./u/u.authority.ts). The [begin](./u/u.begin.ts),
[registration](./u/u.register.ts), and [sign-in](./u/u.signIn.ts) workflows keep their lifecycle
checks together. They prepare against current authority after verification; result validation and
publication guards precede one synchronous state swap. These are internal parts of this module, not
independent services or a storage abstraction.

## Reference

[Construction, guarantees, and limits](./README.contract.md) · [Types](./t.ts)

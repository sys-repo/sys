# Accounts (wire contracts)

Shared requests, replies, and JSON-shape checks for passkey
[accounts](https://www.w3.org/TR/webauthn-3/#user-account) and
[sessions](https://pages.nist.gov/800-63-4/sp800-63b/session/#sessmgmt).

## Role and boundaries

The client and server share these messages without importing each other's implementation.

- **[AccountRuntime](../m.AccountRuntime/README.md)** coordinates browser ceremonies and service
  requests. It keeps the bearer private and exposes session observations.
- **[AccountService](../m.AccountService/README.md)** verifies ceremony responses and owns account
  and session state.
- **[WebAuthn](../m.WebAuthn/README.md)** runs browser ceremonies—not account management.
- **[HttpCmd](../../../../../sys/http/src/http.cmd/README.md)** transports messages—not account
  policy.
- **[UI](../ui/t.ts)** displays observations—not credentials.

## Accounts and [passkeys](https://www.w3.org/TR/webauthn-3/#passkey)

An account has an identity within the service—its
[principal](https://www.rfc-editor.org/rfc/rfc4949.html#page-232)—and can have several passkeys for
signing in.

`Accounts` defines the shared messages for creating accounts, signing in, adding passkeys, and
managing sessions. The service implements those operations.

## Validation and trust

`Accounts.readPayload(name, value)` and `Accounts.readResult(name, value)` check bounded, decoded
JSON and return the original value or `undefined`.

**Shape validation is not authentication.** The readers establish that data is well-formed, not that
its sender is trusted or its credentials are valid. Verification and session authority belong to the
service.

Grants contain [bearer credentials](https://www.rfc-editor.org/rfc/rfc6750.html#section-1.2):
possession of a live credential can authorize requests. Keep grants, challenges, and ceremony
responses inside the service/client binding—not in UI snapshots, logs, or browser storage—to avoid
exposing credentials and authentication exchanges.

## Status

The [integration specimen](../ui/-spec.integration/-SPEC.tsx) is unconnected and performs no account
operations.

## References

- [Contract and recovery rules](./README.contract.md)
- [Types](./t.ts)

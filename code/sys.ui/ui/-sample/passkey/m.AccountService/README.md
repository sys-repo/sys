# AccountService (server authority)

An in-memory reference service for [passkey](https://www.w3.org/TR/webauthn-3/#passkey)
[account](https://www.w3.org/TR/webauthn-3/#user-account) creation, sign-in, enrollment, and
[session](https://pages.nist.gov/800-63-4/sp800-63b/session/#sessmgmt) management.

Browser ceremonies produce credentials and assertions—not account authority. This service verifies
their responses and owns account/session state; hosts own browser interaction, transport, and UI.

- Explicit policy and bounded records in one disposable instance.
- Request-local handlers use the shared [Accounts contract](../m.Accounts/README.contract.md).
- Construction opens no listener or browser ceremony.

**Before account creation or passkey enrollment, warn users:** a service restart erases accounts,
registered keys, and sessions. A surviving authenticator entry cannot sign in to its old account.
Browser reload drops the local bearer without revoking the session or erasing the registration. Use
designated human-controlled test accounts.

## Status

This sample is neither a published API nor production identity infrastructure. Automated tests do
not establish real-browser or authenticator acceptance.

## Commit boundary

A session can expire or be revoked while verification is running. Before committing, the service
rechecks the authority the operation needs. The change takes effect all at once in this instance;
that is not a durability or multi-process guarantee.

## References

- [Construction, guarantees, and limits](./README.contract.md)
- [Types](./t.ts)

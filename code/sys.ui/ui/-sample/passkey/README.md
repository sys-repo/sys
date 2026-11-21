# Passkey Accounts

A [passkey] lets you sign in to your [account] without typing a username or password.

A passkey is a sign-in credential, not the account identity. Several passkeys can belong to the same
account, identified by its [principal] ([`Accounts.Principal`](./m.Accounts/t.ts)). The service
starts a [session] for that account only after verifying the authenticator’s response.

```text
Passkey sample
├─ What the person sees
│  └─ ui/                     Shows session state and offers actions such as Sign in.
│
├─ What happens in the browser
│  ├─ m.AccountRuntime/       Coordinates each action and keeps the session credential in memory.
│  └─ m.WebAuthn/             Asks the authenticator to create a passkey or use an existing one.
│
├─ How the browser and service communicate
│  ├─ m.Accounts/             Defines the requests and replies both sides understand.
│  └─ HttpCmd                 Carries those messages over HTTP.
│
└─ Who decides whether someone is signed in
   └─ m.AccountService/       Verifies the response against the registered key and issues a session.
```

### Follow one sign-in

The runtime asks the service for a fresh challenge. Through [WebAuthn], the authenticator signs a
response to that challenge with the passkey’s [private key][credential private key]. The runtime
sends the response to the service, which verifies the signature with the registered public key.
Neither the runtime nor the service receives the private key.

If the service accepts the response, it issues a [session credential][bearer credential]. This is a
separate secret: it lets the runtime make requests on your behalf without asking you to use the
passkey again while the session is valid. The panel sees the session state, not the credential.

### What survives?

Reloading the page forgets the local session credential. It does not revoke the session or erase the
passkey registration on the service.

The [reference service](./m.AccountService/README.md) stores accounts, registrations, and sessions
**only in memory**. Restarting the service erases all three. Your authenticator may still offer the
passkey, but the service no longer recognizes it.

Beyond this sample, the service must preserve each account and its passkey registrations across
restarts, including each credential’s ID, public key, and the account it belongs to.

### Sample UI

The [isolated view](./ui/-spec/-SPEC.tsx) lets you explore panel states without an authenticator.
The [integration specimen](./ui/-spec.integration/-SPEC.tsx) shows the same panel but is not yet
connected to the account service.

### Run the local account service

From `code/sys.ui/ui`, `deno task dev` or `deno task build` followed by `deno task serve` starts
`sys.ui:accounts` alongside the existing view and files services. Its native endpoint is
`POST http://127.0.0.1:5051/api/passkey/cmd`, not a page to open. The listener requires the exact
origin `http://localhost:1234`; it does not expose a cross-origin browser API. If port `5051` is
occupied, startup fails rather than choosing another port.

Run the listener proof separately from the default tests. It needs only loopback networking and
checks command delivery, collision handling, and shutdown without a browser or authenticator:

```sh
deno task test --frozen --cached-only --allow-net=127.0.0.1 --trace-leaks \
  ./-sample/passkey/-test.external/-accounts.listener.ts
```

---

[View](./ui/t.ts) · [Runtime](./m.AccountRuntime/README.md) ·
[Browser ceremony](./m.WebAuthn/README.md) · [Service](./m.AccountService/README.md) ·
[Messages](./m.Accounts/README.md) · [Transport](../../../../sys/http/src/http.cmd/README.md)

[passkey]: https://www.w3.org/TR/webauthn-3/#passkey
[credential private key]: https://www.w3.org/TR/webauthn-3/#credential-private-key
[account]: https://www.w3.org/TR/webauthn-3/#user-account
[principal]: https://www.rfc-editor.org/rfc/rfc4949.html#page-232 "RFC 4949, p. 232"
[session]: https://pages.nist.gov/800-63-4/sp800-63b/session/#sessmgmt
[WebAuthn]: https://www.w3.org/TR/webauthn-3/#sctn-api
[bearer credential]: https://www.rfc-editor.org/rfc/rfc6750.html#section-1.2

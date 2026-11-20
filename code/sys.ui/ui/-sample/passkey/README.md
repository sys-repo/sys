# Passkey Accounts

A [passkey] lets you sign in to your [account] without typing a username or password.

The service records which account each passkey belongs to. It starts a [session] for that account
only after verifying the authenticator’s response.

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

**Follow one sign-in.** The runtime asks the service for a fresh challenge. Through [WebAuthn], the
authenticator signs a response to that challenge with the passkey’s private key. The runtime sends
the response to the service, which verifies the signature with the registered public key. Neither
the runtime nor the service receives the private key.

If the service accepts the response, it issues a [session credential][bearer credential]. This is a
separate secret: it lets the runtime make requests on your behalf without asking you to use the
passkey again while the session is valid. The panel sees the session state, not the credential.

**What survives?** Reloading the page forgets the local session credential. It does not revoke the
session or erase the passkey registration on the service.

The reference service keeps accounts, registrations, and sessions in memory. Restart it and all
three are lost. Your authenticator may still offer the passkey, but the service no longer recognizes
it. A production service keeps accounts and their registered public keys in durable storage so you
can sign in again after a restart.

**Sample UI.** The [isolated view](./ui/-spec/-SPEC.tsx) lets you explore panel states without an
authenticator. The [integration specimen](./ui/-spec.integration/-SPEC.tsx) shows the same panel but
is not yet connected to the account service.

---

[View](./ui/t.ts) · [Runtime](./m.AccountRuntime/README.md) ·
[Browser ceremony](./m.WebAuthn/README.md) · [Service](./m.AccountService/README.md) ·
[Messages](./m.Accounts/README.md) · [Transport](../../../../sys/http/src/http.cmd/README.md)

[passkey]: https://www.w3.org/TR/webauthn-3/#passkey
[account]: https://www.w3.org/TR/webauthn-3/#user-account
[session]: https://pages.nist.gov/800-63-4/sp800-63b/session/#sessmgmt
[WebAuthn]: https://www.w3.org/TR/webauthn-3/#sctn-api
[bearer credential]: https://www.rfc-editor.org/rfc/rfc6750.html#section-1.2

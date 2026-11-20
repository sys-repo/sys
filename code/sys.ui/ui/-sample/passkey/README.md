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
authenticator returns a signed response bound to that challenge. The runtime sends the response to
the service. If the service accepts it, the runtime keeps the
[session credential][bearer credential]; the panel gets the fact it needs to display: _signed in_.

**What survives?** Reloading the page forgets the local session credential. It does not revoke the
session or erase the passkey registration on the service. Restarting the reference service is
different: it erases accounts, registrations, and sessions. Your authenticator may still offer the
passkey, but the service no longer has the account it belonged to.

**What you can try.** The [isolated view](./ui/-spec/-SPEC.tsx) lets you explore panel states
without an authenticator. The [integration specimen](./ui/-spec.integration/-SPEC.tsx) is not yet
connected.

---

[View](./ui/t.ts) · [Runtime](./m.AccountRuntime/README.md) ·
[Browser ceremony](./m.WebAuthn/README.md) · [Service](./m.AccountService/README.md) ·
[Messages](./m.Accounts/README.md) · [Transport](../../../../sys/http/src/http.cmd/README.md)

[passkey]: https://www.w3.org/TR/webauthn-3/#passkey
[account]: https://www.w3.org/TR/webauthn-3/#user-account
[session]: https://pages.nist.gov/800-63-4/sp800-63b/session/#sessmgmt
[WebAuthn]: https://www.w3.org/TR/webauthn-3/#sctn-api
[bearer credential]: https://www.rfc-editor.org/rfc/rfc6750.html#section-1.2

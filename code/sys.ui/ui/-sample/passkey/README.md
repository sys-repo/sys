# Passkey Accounts

A [passkey] lets you sign in to your [account] without typing a username or password.

A passkey is a sign-in credential, not the account identity. Several passkeys can belong to the same
account, identified by its [principal] ([`Accounts.Principal`](./m.Accounts/t.ts)). The service
starts a [session] for that account only after verifying the authenticator’s response.

The DevHarness sample starts signed out and sends no account requests until you choose an action.
**Account service: Configured** means the address is set, not that the service answered. Use a
designated test passkey: the service forgets registrations on restart, but your authenticator may
keep them.

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
   └─ m.AccountService/       Registers public keys, verifies sign-ins, and owns sessions.
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

Reloading the page forgets the local session credential and last result. It does not revoke the
session or erase the passkey registration on the service.

The [reference service](./m.AccountService/README.md) stores accounts, registrations, and sessions
**only in memory**. Restarting the service erases all three. Your authenticator may still offer the
passkey, but the service no longer recognizes it.

Beyond this sample, the service must preserve each account and its passkey registrations across
restarts, including each credential’s ID, public key, and the account it belongs to.

### Run the local sample

From `code/sys.ui/ui`, run `deno task dev`, or run `deno task build` followed by `deno task serve`.
Open <http://localhost:1234/?dev> and select `sys.ui: -sample/passkey`. Choose **Create with
Passkey**, **Sign Out**, then **Sign In** with the same passkey. **Add Passkey** enrolls another key
for the signed-in principal. When signed in, **Account label** shows the name the service supplied
for the passkey prompt; **Principal** is the account ID. The **view:pure** link opens the
[isolated view](./ui/-spec/-SPEC.tsx), which records button intent only.

If a reply is lost, **Outcome unknown** means the service may have completed the action. With a
retained session credential the panel checks the session once; it never retries the change. A
session or credential count is not a receipt for that action. If the session remains unknown, reload
the page, then choose **Sign In**.

Both modes need four free ports: `1234` (proxy), `4040` (view), `5050` (files), and `5051`
(accounts). Stop the running mode before starting the other. The proxy starts after view and
accounts start successfully. The proxy and accounts bind to loopback; the Vite dev listener does not
bind exclusively to loopback. Its live-update socket is configured for the view port, not the files
port.

The `dev` and `serve` tasks opt in to [Deno’s corrected request cancellation behavior][deno abort]:
returning a successful response does not abort `request.signal`. Remove `--unstable-no-legacy-abort`
from both tasks when the minimum supported Deno version uses that behavior by default.

Use the proxy URL, not the view URL: accounts requires the exact origin `http://localhost:1234`.
Only `POST /api/passkey/cmd` is routed to accounts. The proxy strips `Authorization` from requests
to the view so a session credential intended for accounts does not reach the view server.

To check the browser route, keep **your own** Cell running. From another terminal in
`code/sys.ui/ui`, set `CHROME_BIN` to the absolute path of your Chrome executable and run
`deno task test:passkey:browser dev` (or `serve` for the built view). An isolated Chrome page at
`http://localhost:1234` asks for `session.inspect` without credentials. The task requires one
correlated `accepted(null)` reply: the service answered and this request has no session. The check
neither rebuilds the app nor starts a passkey ceremony.

The standalone test starts its own account listener; it needs no running Cell, proxy, browser, or
authenticator:

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
[deno abort]: https://docs.deno.com/runtime/reference/deno_serve_legacy_abort/

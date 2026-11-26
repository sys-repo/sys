# AccountRuntime contract

- [Overview and usage](./README.md)
- [Types](./t.ts)

## Service binding and browser support

Each runtime is bound to one endpoint, command namespace, relying party ID (RP ID), and transport
policy. Use HTTPS except for loopback HTTP development. Do not put credentials, a query, or a
fragment in the endpoint URL. To change the binding, dispose the runtime and create a new one; the
bearer never transfers. The host configures the deployment, allowed origins, and RP ID.

Ceremony options from the service must explicitly name the configured RP ID. The runtime refuses a
missing or mismatched ID before native JSON conversion. There is no fallback for missing browser
conversion APIs. Browser availability says nothing about service health; sign-out does not require
WebAuthn.

## Page lifetime and observation

- `start()` activates the runtime with a local `signed-out` snapshot, not a claim about remote
  sessions. Snapshots are deeply frozen. `state.changed$` carries no payload; read `state.current`
  on attachment and after each notification. Neither snapshots nor action results expose a bearer,
  challenge, raw ceremony response, or exception. The runtime persists no bearer or account hint.
- `run()` and `refresh()` share one operation slot. A workflow holds it before announcing a pending
  phase or awaiting work. A competing action returns `not-submitted` / `busy`; a refresh does not
  queue. `cancel()` requests an abort. It does not free the slot or undo a server change.
- `runtime.info.availability` observes the client's account command channel, not authentication or
  the server process. A valid accepted or rejected reply means `available`; a dispatched exchange
  without a usable account reply means `unavailable`. Local refusals and cancellation are not
  evidence. Departure resets it to `unknown`. Observing the channel sends no requests.
- Call `runtime.info.readCounts(signal?)` explicitly for service totals, not to refresh a session.
  Consumers that only need totals can take `runtime.info`, without the account action API. A read
  sends no bearer, uses no operation slot, and changes neither session state nor the last action
  result. The transport deadline and runtime lifetime apply even without a caller signal. An
  already-aborted signal sends nothing. Three zeros are an observation; `undefined` means no
  observation. Do not substitute zeros.
- Call `depart()` on page departure and `start()` on restoration. Departure discards the bearer,
  account facts, and last outcome. Restoration opens no ceremony. If old work is still settling,
  `operation.kind` is `retiring`: wait for `idle` before offering another action. Settlement cannot
  restore old facts or results. `dispose()` is terminal and completes `state.changed$`.

## Outcomes and recovery

An action outcome describes one invocation, not the current session. An `accepted` sign-in can
arrive after its grant expires. A `rejected` reply carries the service's refusal code; a confirmed
`no-session` clears the bearer even if cancellation follows the reply.

Creation, sign-in, and enrollment use begin and finish. `not-submitted` means the account mutation
was not sent; a challenge or authenticator entry may already exist. If a native ceremony returns no
credential without an abort, the reason is `unavailable`, not `cancelled`. Sign-out sends a single
revoke request. If finish or revoke may have been sent but there is no usable reply, the outcome is
`indeterminate`. Do not infer rollback or retry automatically.

**When idle with an `unknown` session**, await `refresh()` and read `state.current` again. The
runtime uses a retained bearer if it has one. Inspection can restore facts or confirm absence, but
it cannot tell you whether a prior mutation succeeded. If the session remains unknown, offer reload
and explicit sign-in rather than repeating account creation. Local expiry drops the bearer using the
browser clock; the service remains authoritative.

## Evidence and limits

The [runtime tests](./-test/-.test.ts) use bounded in-memory HTTP and native-shaped fixtures,
including a journey with the reference service and real signature verification. The
[lifecycle tests](./-test/-lifecycle.test.ts) cover cancellation and restoration while work is
pending. Neither proves real-browser JSON conversion, authenticator behavior, back/forward cache
delivery, host integration, or deployment.

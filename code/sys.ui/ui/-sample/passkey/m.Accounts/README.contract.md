# Accounts contract

- [Overview](./README.md)
- [Types](./t.ts)

Requests, replies, and implementation obligations shared by the service and its private client
binding. The service owns authority; `Facts` and `Session` describe observations, while `Grant`,
challenges, and ceremony responses are private wire data. This module does not start a service,
authenticate a user, or open a ceremony.

[AccountService](../m.AccountService/README.md) implements the service side. Client lifecycle and
recovery rules below are obligations of callers, not behavior supplied by this module.

## Wire admission

`Accounts.readPayload(name, value)` and `Accounts.readResult(name, value)` admit **bounded, decoded
JSON**. They return the same value or `undefined`: no coercion, stripping, copying, serialization,
logging, or reflected validation errors. They are not a sandbox for arbitrary JavaScript
objects/getters. Admission proves shape, not provenance, expiry, RP/origin binding, cryptographic
validity, or commit. The transport owns byte/deadline limits and correlation. The service and
runtime own the remaining checks. Do not publish the returned object directly as a mutable runtime
observation.

## Operations and authority

Use the existing unary Cmd payload/result grammar, not separate endpoints or a second protocol.
`Service` supplies handlers closed over one request's `Authority`. The credential is an untrusted
opaque bearer, supplied out-of-band by the request binding (the HTTP binding uses Authorization),
never a principal in a payload or shared mutable handler state. Anonymous operations do not gain
account authority from an incidental bearer. No cookies, redirects, or persistent browser secrets.

| Command                 | Required authority                           | Accepted effect/result                                                                                     |
| ----------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `account.create.begin`  | None                                         | Reserve a creation challenge and pending identity; no account/session yet.                                 |
| `account.create.finish` | Creation transaction + verified registration | Coherently create account, associate its unique credential, and issue a private session grant.             |
| `session.signIn.begin`  | None; no identifier input                    | Reserve an assertion challenge with discoverable sign-in options.                                          |
| `session.signIn.finish` | Sign-in transaction + verified assertion     | Resolve the credential's service-owned account, commit credential state, and issue a grant.                |
| `passkey.add.begin`     | Live session                                 | Bind a registration challenge to that exact session and account; return existing-credential exclusions.    |
| `passkey.add.finish`    | The initiating session, still live at commit | Add a globally unassociated credential to the bound account; return session facts without renewing expiry. |
| `session.inspect`       | Supplied bearer, if any                      | Observe that session, or `null` for missing/unknown/expired/revoked authority. No renewal.                 |
| `session.revoke`        | Supplied bearer, if any                      | Invalidate only that session. `null` confirms absence at completion; already absent is accepted.           |

Creation and sign-in are separate from enrollment. Neither a supplied principal nor a different
session presented at finish can select or rebind an enrollment account. An assertion's user handle
must agree with the verified credential's stored association; it cannot select another account.
Revocation is current-session only, not all-device sign-out or authenticator credential deletion.

## Ceremony and commit rules

- Use native WebAuthn Level 3 JSON conversion only. Options use platform types; response
  declarations describe the standard `RegistrationResponseJSON` and `AuthenticationResponseJSON`
  dictionaries. There is no binary conversion or credential parser here. The
  [reference service](../m.AccountService/README.contract.md#verification-and-authority) owns
  verifier adaptation and its executable interoperability proof.
- Reference policy: discoverable credentials (`residentKey: required`), user verification required
  for generation **and** verification, attestation conveyance `none`. Sign-in has no account
  selector or nonempty allow-list. Request only `credProps`; other requested extensions are outside
  this contract. Client extension results are opaque input, never trusted authentication or public
  observations.
- The service creates a random opaque user handle for each account and reuses it for enrollment. It
  supplies a non-identifying generated account label for WebAuthn name/displayName, not a username,
  email, or profile field. Concrete label copy is service presentation, not account identity.
- Origin, RP ID, algorithms, and challenges come from fixed service configuration/transaction state.
  Before a browser ceremony, the client runtime must check effective RP ID against its configured
  binding. Merely admitting an options object does not perform those checks or guarantee native
  acceptance.
- Validate input and authorization, then reserve a matching, live transaction **before any verifier
  await**. The reservation is exclusive and permanently consumes that finish attempt. On
  verification rejection, stale state, capacity failure, or defect after reservation, it is not made
  retryable. Malformed input, wrong purpose, and unauthorized enrollment do not consume another
  valid attempt. An expired, consumed, missing, or wrong-purpose reference yields
  `invalid-transaction`.
- Revalidate expiry, initiating-session authority, credential association/uniqueness, and relevant
  credential state/version after verification. One non-suspending commit publishes all effects or
  none. Reserve resources before changing authoritative records; a Map alone is not atomicity proof.
  Reordered assertions must not regress counters or mint authority from stale verification. Preserve
  valid zero-counter behavior. Verification must affirm success before applying returned metadata.
- `verification-rejected` covers unknown credentials, explicit unsuccessful verification, and
  reliably recognized invalid input without identifier disclosure. Other upstream exceptions are
  sanitized failures, not guessed domain refusals; malformed input can cause either outcome.
  `credential-conflict` never reassigns an existing credential. `state-changed` rejects stale
  verification. `no-session` rejects unauthorized enrollment. `capacity` is bounded-reference
  admission failure, not permission to evict live authority. All are fixed, operation-specific
  codes. The reference service documents its
  [failure boundary and limits](../m.AccountService/README.contract.md#verification-and-authority).

These are service and client implementation obligations, **not behavior supplied by these
validators**.

## Lifetimes, uncertain completion, and recovery

`Lifetimes` requires finite positive integer challenge/session durations, validated at service
construction. No duration is silently defaulted here. The service stamps absolute Unix-millisecond
expiry from its clock. Both transaction and required session must still be live at commit. Sessions
have absolute expiry, no renewal or refresh credential. Separate sign-ins may have separate
sessions; this contract does not impose one pending transaction or one session per account.

A valid `Reply` settles this invocation: accepted effect or rejected without its account/credential/
session commit. Rejection can still consume a transaction and leave a newly created authenticator
entry. Rejection of a replay says nothing about whether a previous invocation committed.

`Attempt` additionally distinguishes:

- `not-submitted`: dispatch of **this request** was ruled out. A preceding begin or native ceremony
  may already have happened. Local cancellation is not a diagnosis of why an authenticator returned
  no credential.
- `indeterminate`: dispatch was possible but no valid, correlated domain reply was obtained. This
  includes malformed replies and lost responses after commit. Do not infer rollback from HTTP
  status, timeout, cancellation, local disposal, or a subsequent rejected replay. Never
  automatically retry.

A lost begin may leave a challenge until expiry. Lost creation/sign-in completion may leave an
account/session whose bearer the client never received; fresh explicit sign-in is the recovery path,
not another automatic creation. Recovery needs available capacity: an inaccessible session still
occupies a slot until expiry. With a one-session limit, a lost grant can therefore block sign-in
until that session expires. See the reference service's
[capacity rules](../m.AccountService/README.contract.md#capacity-and-recovery).

Lost enrollment may have added a credential. Lost revocation may have revoked the session, or may
still do so later. Inspection is a fresh observation, **never a receipt** for any of those
operations; counts and local credential deletion cannot resolve them.

## Client lifecycle requirements

Retain an existing credential privately through uncertain inspection/enrollment/revocation; suppress
confirmed authentication while session authority is unknown. Confirmed absence or revocation,
expiry, disposal, and page departure discard it. Late grants must not restore disposed or superseded
authority. A full reload is the explicit ordinary-host escape from unknown state: it forgets local
authority, does not assert remote revocation, and requires user-initiated sign-in. Keep the
unresolved attempt's meaning honest; do not require DebugSignals or invent UI success.

For BFCache, page departure discards authority and invalidates in-flight adoption; restoration
starts without a credential and opens no ceremony. Hosts must deliver this lifecycle signal to the
runtime. This is not a claim that unload handlers reliably revoke remote sessions. Theme/debug reset
does not own authentication lifetime.

## Reference and proof boundary

Follow
[AccountService's host requirements](../m.AccountService/README.contract.md#construction-and-host-requirements)
for its restart warning **before credential creation** and designated human-controlled test
accounts. That owner documents its in-memory limits, verifier adaptation, clock behavior, and
disposal consequences.

Tests here establish wire admission, operation-specific results, secret-field exclusion from
observations, standard-options consumption, and exhaustive handling of client outcome types. They do
not establish cryptographic acceptance, challenge single-use, atomic commits, live readonly state,
transport bounds, or real browser/BFCache behavior. Those proofs belong to the
[service](../m.AccountService/README.contract.md#evidence-and-limits),
[transport](../../../../../sys/http/src/http.cmd/README.md), and client runtime, respectively.

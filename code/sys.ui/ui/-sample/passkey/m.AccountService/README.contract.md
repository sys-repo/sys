# AccountService contract

[Overview](./README.md) · [Types](./t.ts)

Process-local reference authority implementing the eight
[Accounts operations](../m.Accounts/README.contract.md#operations-and-authority). Importing or
constructing it opens no listener and starts no browser ceremony. This sample is not published as a
package API and is not production identity infrastructure.

## Construction and host requirements

**Before any credential creation, the host must visibly warn:** restarting this service loses all
account and session records, while authenticator entries may survive. Use designated
human-controlled accounts. Browser hosts must keep bearer credentials in memory and discard them on
reload. Reloading the browser does not restart this service.

```ts
import { AccountService } from './mod.ts';

using service = AccountService.create({
  rp: { id: 'localhost', name: 'Reference accounts' },
  origins: ['http://localhost:1234'],
  algorithms: [-7, -8, -257],
  lifetimes: { challenge: 60_000, session: 300_000 },
  capacity: { accounts: 100, credentials: 200, transactions: 100, sessions: 200 },
});

// Construct a fresh map for one admitted request; never share a mutable principal.
const handlers = service.handlers({ credential: undefined });
```

All policy values are required, validated, copied, and frozen. The numbers above are illustrative
host choices, not defaults. Origins are exact; HTTPS is required except explicit localhost HTTP. The
host still owns actual deployment/RP suitability, secure context, origin/CORS admission,
Authorization parsing, bounded `HttpCmd.handle` binding, listener lifetime, and the pre-creation
warning. The handler map expects bounded decoded JSON, not arbitrary hostile JavaScript objects. No
bearer enters payloads.

Executable examples:

- [Create → enroll → revoke → sign-in](./-test/-m.AccountService.test.ts).
- [Request-local Authorization and bounded HttpCmd](./-test/-m.AccountService.http.test.ts): an
  in-memory test binding, not a supplied deployment adapter.

## Verification and authority

SimpleWebAuthn server **14.1.0** supplies options, parsing, and verification. The adapter requires
user presence/verification, exact challenge/origin/RP binding, attestation format `none`, and the
configured subset of ES256 (-7), Ed25519 (-8), and RS256 (-257). Credential admission checks
algorithm, key type, curve, and key usability; RSA requires at least **2048 effective modulus
bits**, ignoring leading zero octets. These key checks establish neither possession nor attestation
trust; their [compatibility boundaries](#verifier-compatibility) are documented below. Cross-origin
client data is refused. Registration requests discoverable credentials and `credProps`; sign-in has
no identifier or allow-list. Client extension results and browser hints are not authority. No
metadata service is initialized.

The service, not the verifier, owns association, replay protection, counters, expiry, sessions, and
publication. A matching authorized finish permanently claims its transaction before verification.

After verification, the service rechecks authority and credential object identity. Reordered
assertions cannot publish stale metadata, including when both counters are zero. Registration and
sign-in prepare detached records/results, validate the result, recheck expiry at publication, then
swap authority state in one non-suspending step. Begin results are validated before retaining their
transaction; revocation validates its result before deleting the session. No fallible result
validation runs after publication. Enrollment additionally requires the exact initiating session,
still live, and does not renew it. This synchronous, in-memory publication is confined to one
JavaScript isolate—not a database transaction or a multi-process guarantee. State copying is bounded
by configured capacities but is not constant-cost.

Service-owned refusals and explicit unsuccessful verification resolve as fixed domain codes.
Recognized decoding failures also yield `verification-rejected`. Other upstream exceptions throw
only `Account service failed.` without stack, cause, or input—even when malformed input caused them.
This is a failure outcome, not a diagnosis of bad credentials or an internal defect. In particular,
malformed signature envelopes and upstream policy-check exceptions are not classified by message.
Neither outcome publishes account, credential, or session changes; a claimed attempt stays consumed.
Observations contain no bearer, challenge, public key, or ceremony response. Grants are private wire
data. Transport failure cannot prove rollback; no retries or transaction-receipt endpoint exist.

`dispose()` and `[Symbol.dispose]()` synchronously forget authority and reject further operations.
Already-running verification cannot publish afterward; disposal does not cancel upstream computation
or delete authenticator entries. Clock readings use fresh `Time.now.timestamp` snapshots from
`@sys/std/time`, clamped to the highest previously observed value. A backward adjustment cannot
revive authority already observed expired, but can delay expiration in real elapsed time. This is
neither an elapsed-time nor a trusted distributed clock.

## Capacity and recovery

Capacity refuses new records without evicting live authority. Session slots become available through
expiry or revocation; unused transactions expire. Expired records are pruned on invocation. Claimed
transactions retain their slots until settlement, even after expiry.

Accounts and credentials persist until disposal; neither expiry nor session revocation frees those
slots. There is no account/credential deletion operation. Once either limit is reached, admitting
more of that record requires a new instance, losing all existing account associations and sessions
while authenticator entries may survive. This is not a recovery mechanism for existing accounts.

## Verifier compatibility

The [adapter](./u/u.verifier.ts) uses System/upstream/native cryptography, not custom arithmetic:

- Ed25519 keys pass `Curves.Ed25519.isValidPublicKey` from `@sys/crypto/curves`: canonical encoding,
  curve membership, non-identity, and prime-order subgroup membership.
- ES256 points pass native WebCrypto import/export before admission: Deno can defer invalid-point
  rejection until export.
- RSA admission exercises the public upstream verification helper with fixed non-ceremony
  signature/data bytes: Deno import/export alone can accept unusable RSA keys. The verification
  boolean is ignored; successful native key decoding is required separately from minimum strength.
  The recognized RSA decoder rejection is pinned to **Deno 2.9.8**.

Decoder catches are confined to JSON syntax and pinned CBOR/native bounds/extension-conversion
signals. Authenticator extensions must decode to maps with string identifiers; array-shaped
containers are refused even when upstream conversion accepts them. Native EC import/export and the
pinned RSA key-decoder rejection are handled at their usability boundaries. Indistinguishable
signals cannot establish defect provenance. The adapter does not parse ASN.1 signatures or duplicate
upstream challenge/origin/RP/counter policy to improve error labels. Dependency/runtime changes
require renewing the [decoder and failure](./-test/-m.AccountService.verifier.test.ts),
[algorithm/EC](./-test/-m.AccountService.algorithms.test.ts),
[Ed25519](./-test/-m.AccountService.ed25519.test.ts), and
[RSA](./-test/-m.AccountService.rsa.test.ts) boundary tests.

## Evidence and limits

The [tests](./-test/) use synthetic WebAuthn data and native WebCrypto signatures with the actual
pinned verifier. They exercise all three algorithms, invalid proofs, replay, reversed completion,
session revocation/expiry during verification, expiry during commit preparation, capacities,
isolation, disposal, and lost-response recovery over bounded in-memory Request/Response transport.
Test-only ES256 DER wrapping formats a native signature; it implements neither signing nor
verification.

From `code/sys.ui/ui`, run the contract and service tests:

```sh
deno task test --trace-leaks ./-sample/passkey/m.Accounts/-test/ ./-sample/passkey/m.AccountService/-test/
```

The service assumes functioning native cryptography and a settling verifier. It does not isolate or
repair arbitrary dependency/runtime failures, cancel upstream work, or guarantee settlement after
such failures. Bounded transport limits caller waiting, not upstream computation or rollback.

These are not native browser conversion, real authenticator, BFCache, accessibility, deployment, or
production proofs. Production requires durable storage, deployment-wide atomicity, abuse controls,
and operational guarantees—not merely replacing a Map.

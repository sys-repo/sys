# Curves

`Curves` checks public-key encodings against explicit curve and subgroup requirements. Use it when
your protocol requires canonical, non-identity Ed25519 keys in the prime-order subgroup. Validation
establishes properties of the key bytes; it does not establish who controls the key.

## Ed25519 public keys

`Curves.Ed25519.isValidPublicKey(bytes)` accepts a raw, compressed Ed25519 public key as a
`Uint8Array`. It is synchronous and does not modify the input.

This example generates a key pair and validates the public key's raw encoding:

```ts
import { Curves } from '@sys/crypto/curves';
import { SignEd25519 } from '@sys/crypto/sign/ed25519';

const keys = await SignEd25519.generateKeyPair();
const bytes = new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey));
const valid = Curves.Ed25519.isValidPublicKey(bytes); // true
```

The predicate returns `true` only when all four conditions hold:

- **Canonical encoding:** exactly 32 bytes, with a canonical field element and a valid sign bit.
- **Curve membership:** the encoding represents a point on Edwards25519.
- **Non-identity:** the point is not the group's identity element.
- **Prime-order subgroup membership:** the point has no nonzero torsion component.

Decoding alone is insufficient. The identity belongs to the prime-order subgroup but is not admitted
as a public key. Rejecting small-order points alone is also insufficient: a mixed-torsion point can
have large order while lying outside that subgroup. Both identity and subgroup checks are required.

Malformed encodings and points outside this policy return `false`. Unrecognized failures propagate
unchanged; callers must not interpret every thrown error as an invalid key.

## What validation does not establish

A `true` result is not proof of a signature, possession of a private key, ownership of an account,
authenticator trust, or binding to a particular message or protocol. Those require their own
verification. The predicate does not generate keys, verify signatures, or import a native
`CryptoKey`.

The input is the raw public-key encoding, not a PEM/SPKI document, JWK, COSE map, or signature. The
caller owns protocol parsing and extraction. Validation neither retains nor freezes the bytes: if
they may change, validate a stable copy and use that same copy afterward.

This is a strict key-admission policy, not a definition of every Ed25519 verifier's acceptance
rules. It does not use permissive ZIP-215 decoding. Do not add it as an unconditional precondition
to a protocol that requires a different acceptance policy.

## Implementation and failures

Decoding and group operations are delegated to the public API of `@noble/curves` 2.4.0. No curve
arithmetic is implemented here, and no vendor point objects or types are exposed.

Noble has no dedicated malformed-point error type. At the decoding boundary, the adapter translates
only its pinned constructor/message signals into `false`: invalid y, an invalid sign bit for zero x,
and an out-of-field y coordinate. Identity and subgroup checks run outside that catch. Other
failures propagate unchanged. A fault with an indistinguishable decoder signal cannot be classified
by origin; dependency upgrades must revalidate this boundary, not merely preserve the boolean API.

Signing and signature verification belong to `/sign` and `/sign/ed25519`. Those entrypoints use
WebCrypto and do not import the curve-validation engine. Validation is an explicit, separate
operation.

See the [type contract](./t.ts) for the public API and [implementation](./u.ed25519.ts) for the
pinned decoder boundary.

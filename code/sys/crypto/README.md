# @sys/crypto

Compute hashes, format digests, and sign or verify data with Ed25519.

Import the operation you need:

- [`/hash`](https://jsr.io/@sys/crypto/doc/hash): SHA-256, SHA-1, and composite hashes.
- [`/sign/ed25519`](https://jsr.io/@sys/crypto/doc/sign/ed25519): `SignEd25519` key generation,
  signing, and verification; also exported from `/sign`.
- [`/fmt`](https://jsr.io/@sys/crypto/doc/fmt): console formatting for hash data.

The root exports package metadata, types, and `FileHashUri`. Import `Hash` and the signing libraries
from their subpaths, not the root. `/t` is the type-only entry.

## Hash a value

```ts
import { Hash } from 'jsr:@sys/crypto/hash';

const digest = Hash.sha256('hello');
const short = Hash.shorten(digest, [8, 6]);
console.info(short);
```

By default, `Hash.sha256` prefixes its digest with `sha256-`. Shorten a digest only for display;
keep the full digest for comparisons and integrity checks.

A hash does not authenticate its source. Signature verification depends on a trusted public key.

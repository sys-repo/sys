# @sys/driver-signer

Sign and verify content manifests, macOS applications, and disk images.

Import the driver for your artifact:

- [`/dist`](https://jsr.io/@sys/driver-signer/doc/dist): `DistSigner` creates and verifies detached
  Ed25519 signatures for manifest files.
- [`/apple`](https://jsr.io/@sys/driver-signer/doc/apple): `AppleSigner` runs codesigning,
  notarization, stapling, and verification for `.app` and `.dmg` artifacts.

The root exports package metadata and types. `/t` is the type-only entry; `/core` is not a signing
constructor.

## Inspect capabilities

```ts
import { DistSigner } from 'jsr:@sys/driver-signer/dist';

const capabilities = DistSigner.capabilities();
console.info(capabilities);
```

This reports the driver's supported operations without reading artifacts, using keys, or running
platform commands. Support is not availability: the host still needs the required tools and
credentials to run those operations.

## Run a signer

Pass the artifact and mode to the driver's `run` method. `DistSigner` needs the signing or
verification keys required by that mode. `AppleSigner` uses a codesign identity and platform tools;
notarization also requires Apple credentials. Check the returned `ok` before using either result.

For canonical `dist.json`, signing writes a detached signature and, by default, adds its
`build.sign` descriptor to the manifest. Set `writeBack.distSignDescriptor: false` to disable that
descriptor update. Other manifests are signed as exact bytes.

Result metadata records the operation; it does not establish trust in the signer. The caller must
choose a trusted verification key.

# @sys/driver-signer

Choose between two drivers with different operational boundaries:

- [`DistSigner`](https://jsr.io/@sys/driver-signer/doc/dist) signs and verifies manifest documents
  using detached Ed25519 signatures and caller-selected keys.
- [`AppleSigner`](https://jsr.io/@sys/driver-signer/doc/apple) runs macOS signing, notarization,
  stapling, and verification for `.app` and `.dmg` artifacts. These workflows modify the artifact;
  none is verify-only.

**DistSigner never verifies referenced payload files.** Document authentication and filesystem
integrity are separate checks.

## Verify a Dist document

Here, canonical Dist means a supported `@sys/fs` distribution document using `sys.dist/v2`, not
arbitrary JSON named `dist.json`. See
[Dist production](../../sys/fs/README.md#produce-a-content-pin).

`CryptoKey` is the Web Crypto API's global type, available in Deno and browsers without an import.
It is not an `@sys` type or a PEM string. To obtain a public key, import independently trusted key
bytes with `crypto.subtle.importKey(...)`, selecting Ed25519 and the `['verify']` usage.

Supply that caller-trusted public `CryptoKey`, the existing manifest, and its detached signature.
The key must come from your trust policy, not from the artifact being verified. For example, call
`verifyDist(publicKey)` with that key. Run this filesystem-based example in Deno. Replace the
illustrative manifest and sidecar paths with your actual release paths, keeping the sidecar outside
the payload root:

```ts
import { DistSigner } from 'jsr:@sys/driver-signer/dist';

async function verifyDist(publicKey: CryptoKey) {
  const result = await DistSigner.run({
    mode: 'verify',
    artifact: { path: './release/dist/dist.json', kind: 'dist.json' },
    signature: { path: './release/signatures/dist.json.sig' },
    publicKey,
  });
  if (!result.ok) {
    const err = `Dist verification failed: ${result.code} at ${result.stage}`;
    throw new Error(err, { cause: result.error });
  }
  return result;
}
```

Dist modes use different key inputs:

- `verify`: `publicKey`; reads the manifest and sidecar without writing either.
- `sign`: `privateKey`; writes the detached signature without verifying it.
- `sign-verify`: `privateKey` and `publicKey`; signs, writes the sidecar, then verifies the
  signature held in memory. This is not a readback check of the saved sidecar.

Use Ed25519 keys with the matching `sign` or `verify` usages. Signing modes need write permission
for the sidecar and, by default for canonical Dist, the manifest. Check `ok` before using any
result; result metadata records the operation but does not establish signer trust.

### Canonical document versus exact bytes

Set `artifact.kind: 'dist.json'` explicitly to sign or verify the canonical whole document,
including descriptive metadata. Formatting and object-key order changes are tolerated; changing a
descriptive value invalidates the document signature even when the payload content pin is unchanged.
Use the same kind when signing and verifying.

In `sign` and `sign-verify` modes, the driver first writes its `build.sign` descriptor into the
manifest by default, then signs the updated canonical document. A later signing, sidecar-write, or
verification failure does not roll back the manifest update. Set
`writeBack.distSignDescriptor: false` to disable that update; `verify` never writes it.

Omitting `artifact.kind`, or setting it to `'manifest'`, signs or verifies exact file bytes and
skips descriptor writeback—even if the filename is `dist.json`. Formatting or key-order changes then
invalidate the signature too.

The detached sidecar contains raw Ed25519 signature bytes, not a metadata envelope.

### Verify payload integrity separately

A document signature is not a distribution content pin or a complete-tree verification result. Use
`Pkg.Dist.Local.verify()` for local consistency or `Pkg.Dist.Pinned.verify()` with an independent
content pin; see [distribution integrity](../../sys/fs/README.md#distribution-integrity).

Both public verifiers reject unlisted files. Keep the signature sidecar outside the payload root, as
in the example; `build.sign` does not exempt it from that rule.

## Sign and verify an Apple artifact

Every Apple mode starts with `codesign --force`, replacing an existing signature in place. There is
no verify-only mode and no rollback after a later failure. Use an artifact copy in a disposable
staging directory, not a preserved release directory.

Run on macOS with an exact codesign identity whose signing key is available and the required
platform tools. Prepare nested-code signing and entitlement configuration outside this driver: it
issues one signing command against the supplied target and exposes no entitlement options.

Replace `./staging/Example.app` below with your application copy's path.

```ts
import { AppleSigner } from 'jsr:@sys/driver-signer/apple';

async function signAndVerifyApp(identity: string) {
  const result = await AppleSigner.run({
    mode: 'sign-verify',
    artifactPath: './staging/Example.app',
    artifactKind: 'app',
    identity,
  });
  if (!result.ok) {
    const err = `Apple signing failed: ${result.code} at ${result.stage}`;
    throw new Error(err, { cause: result.error });
  }
  return result;
}
```

For a disk image, set `artifactKind: 'dmg'`. Only the container is signed—not the app inside.

### Modes and verification

Apple's mode and credential vocabulary differs from Dist's:

- `sign-only`: sign; requires `identity`, not Ed25519 `privateKey` / `publicKey` inputs.
- `sign-verify`: sign → verify; requires `identity`.
- `sign-notarize-verify`: sign → notarize → staple → verify; also requires
  `notary: { keyId, issuerId, keyP8Path }` for App Store Connect credentials.

  For this mode, reserve `${artifactPath}.notary.zip` beside the artifact. The driver creates its
  archive there and attempts to delete that path in `finally`, including after failure. An existing
  archive at that path is exposed to overwrite or deletion; successful cleanup is not guaranteed.

The verify stage runs codesign verification and `spctl` Gatekeeper assessment, so codesign success
alone does not mean the workflow will pass. Notarization submits to Apple; stapling modifies the
artifact. A failed result can therefore leave an artifact signed or stapled.

## Reference

The root exports package metadata and types. `/t` is the type-only entry; `/core` is not a signing
constructor. See the [Dist option contracts](./src/m.dist/t.ts), including `Run.ArgsBase` for
`metadata` and `identityRef` bookkeeping, and the [Apple input contracts](./src/m.apple/t.ts).

### Inspect capabilities

```ts
import { DistSigner } from 'jsr:@sys/driver-signer/dist';

const capabilities = DistSigner.capabilities();
console.info(capabilities);
```

This reports the driver's supported operations without reading artifacts, using keys, or running
platform commands. **Support is not availability:** the host still needs the required tools and
credentials to run those operations.

import { c, describe, expect, it } from '../../-test.ts';
import { Fs, Hash, Is, Json, Obj, Pkg, Rx, SignEd25519, Str, type t } from '../common.ts';
import { DistSigner } from '../mod.ts';

describe(`DistSigner`, () => {
  const runData = (res: t.Signer.Result): t.DistSigner.RunDataSuccess => {
    if (!res.ok) throw new Error('Expected success result.');
    return res.data as t.DistSigner.RunDataSuccess;
  };

  it('API', async () => {
    const m = await import('@sys/driver-signer/dist');
    expect(m.DistSigner).to.equal(DistSigner);
  });

  describe('capability and error invariants', () => {
    it('capabilities: truthfully describes the content-manifest signer target', () => {
      const res = DistSigner.capabilities();

      expect(res.target).to.eql('content-manifest');
      expect(res.sign).to.eql(true);
      expect(res.verify).to.eql(true);
      expect(res.detachedSignature).to.eql(true);
      expect(res.embeddedSignature).to.eql(false);
      expect(res.notarize).to.eql(false);
      expect(res.staple).to.eql(false);
      expect(res.timestamp).to.eql(false);
    });

    it('run: reports a canonical read failure when the artifact is missing', async () => {
      const { privateKey } = await SignEd25519.generateKeyPair();
      const res = await DistSigner.run({
        mode: 'sign',
        artifact: { path: '/tmp/example/dist.json', kind: 'dist.json' },
        signature: { path: '/tmp/example/dist.json.sig' },
        privateKey,
        identityRef: 'local-test-key-1',
      });
      expect(res.ok).to.eql(false);

      if (res.ok) throw new Error('Expected DistSigner.run to return a failure result.');
      expect(res.code).to.eql('E_READ');
      expect(res.stage).to.eql('read');
    });
  });

  for (const stage of ['success', 'setup', 'body', 'cleanup'] as const) {
    it(`owned fixture ${stage} → directory removed, failure retained`, async () => {
      const failure = new Error(`Fixture ${stage} failure.`);
      let path: string | undefined;
      let caught: unknown;
      try {
        await using temporary = await temporaryDirectory();
        path = temporary.absolute;
        if (stage === 'setup') throw failure;
        await Fs.write(temporary.join('fixture.txt'), 'owned', { throw: true });
        if (stage === 'body') throw failure;
        await using _otherCleanup = Rx.lifecycleAsync(() => {
          if (stage === 'cleanup') throw failure;
        });
      } catch (error) {
        caught = error;
      }
      expect(caught).to.equal(stage === 'success' ? undefined : failure);
      if (!Is.str(path)) throw new Error('Expected acquired fixture path.');
      expect(await Fs.exists(path)).to.eql(false);
    });
  }

  describe('exact-bytes detached signature invariants', () => {
    it('sign → verify succeeds with a local test key-pair', async () => {
      await using temporary = await temporaryDirectory();
      const dir = temporary.absolute;
      const artifact = Fs.join(dir, 'dist.json');
      const signature = Fs.join(dir, 'dist.json.sig');
      const bytes = new TextEncoder().encode('{"hello":"world"}\n');
      await Fs.write(artifact, bytes, { throw: true });

      const { privateKey, publicKey } = await SignEd25519.generateKeyPair();
      const signed = await DistSigner.run({
        mode: 'sign',
        artifact: { path: artifact, kind: 'manifest' },
        signature: { path: signature },
        privateKey,
      });
      expect(signed.ok).to.eql(true);
      const signedData = runData(signed);
      expect(signedData.artifactPath).to.eql(artifact);
      expect(signedData.signaturePath).to.eql(signature);
      expect(signedData.artifactHash).to.match(/^sha256-[0-9a-f]{64}$/);
      expect(signedData.verified).to.eql(false);

      const verified = await DistSigner.run({
        mode: 'verify',
        artifact: { path: artifact, kind: 'manifest' },
        signature: { path: signature },
        publicKey,
      });
      expect(verified.ok).to.eql(true);
      const verifiedData = runData(verified);
      expect(verifiedData.artifactPath).to.eql(artifact);
      expect(verifiedData.signaturePath).to.eql(signature);
      expect(verifiedData.artifactHash).to.eql(signedData.artifactHash);
      expect(verifiedData.verified).to.eql(true);
    });

    it('sign-verify → returns verified success metadata in one run', async () => {
      await using temporary = await temporaryDirectory();
      const dir = temporary.absolute;
      const artifact = Fs.join(dir, 'dist.json');
      const signature = Fs.join(dir, 'dist.json.sig');
      await Fs.write(artifact, new TextEncoder().encode('{"hello":"sign-verify"}\n'), {
        throw: true,
      });

      const { privateKey, publicKey } = await SignEd25519.generateKeyPair();
      const res = await DistSigner.run({
        mode: 'sign-verify',
        artifact: { path: artifact, kind: 'manifest' },
        signature: { path: signature },
        privateKey,
        publicKey,
      });
      expect(res.ok).to.eql(true);
      const data = runData(res);
      expect(data.artifactPath).to.eql(artifact);
      expect(data.signaturePath).to.eql(signature);
      expect(data.artifactHash).to.match(/^sha256-[0-9a-f]{64}$/);
      expect(data.verified).to.eql(true);
    });

    it('verify → fails when artifact bytes are tampered', async () => {
      await using temporary = await temporaryDirectory();
      const dir = temporary.absolute;
      const artifact = Fs.join(dir, 'dist.json');
      const signature = Fs.join(dir, 'dist.json.sig');
      await Fs.write(artifact, new TextEncoder().encode('{"v":1}\n'), { throw: true });

      const { privateKey, publicKey } = await SignEd25519.generateKeyPair();
      const signed = await DistSigner.run({
        mode: 'sign',
        artifact: { path: artifact, kind: 'manifest' },
        signature: { path: signature },
        privateKey,
      });
      expect(signed.ok).to.eql(true);

      await Fs.write(artifact, new TextEncoder().encode('{"v":2}\n'), { throw: true });
      const verified = await DistSigner.run({
        mode: 'verify',
        artifact: { path: artifact, kind: 'manifest' },
        signature: { path: signature },
        publicKey,
      });
      expect(verified.ok).to.eql(false);
      if (verified.ok) throw new Error('Expected verification failure after tamper.');
      expect(verified.code).to.eql('E_VERIFY');
      expect(verified.stage).to.eql('verify');
    });

    it('verify → fails with wrong public key', async () => {
      await using temporary = await temporaryDirectory();
      const dir = temporary.absolute;
      const artifact = Fs.join(dir, 'dist.json');
      const signature = Fs.join(dir, 'dist.json.sig');
      await Fs.write(artifact, new TextEncoder().encode('{"v":1}\n'), { throw: true });

      const signer = await SignEd25519.generateKeyPair();
      const wrong = await SignEd25519.generateKeyPair();

      const signed = await DistSigner.run({
        mode: 'sign',
        artifact: { path: artifact, kind: 'manifest' },
        signature: { path: signature },
        privateKey: signer.privateKey,
      });
      expect(signed.ok).to.eql(true);

      const verified = await DistSigner.run({
        mode: 'verify',
        artifact: { path: artifact, kind: 'manifest' },
        signature: { path: signature },
        publicKey: wrong.publicKey,
      });
      expect(verified.ok).to.eql(false);
      if (verified.ok) throw new Error('Expected verification failure with wrong public key.');
      expect(verified.code).to.eql('E_VERIFY');
      expect(verified.stage).to.eql('verify');
    });

    it('prints detached signature sample and signer result metadata', async () => {
      await using temporary = await temporaryDirectory();
      const dir = temporary.absolute;
      const artifact = Fs.join(dir, 'dist.json');
      const signature = Fs.join(dir, 'dist.json.sig');
      const bytes = new TextEncoder().encode('{"sample":true,"v":1}\n');
      await Fs.write(artifact, bytes, { throw: true });

      const { privateKey, publicKey } = await SignEd25519.generateKeyPair();
      const signed = await DistSigner.run({
        mode: 'sign',
        artifact: { path: artifact, kind: 'manifest' },
        signature: { path: signature },
        privateKey,
        identityRef: 'local-test-key-print-sample',
      });
      expect(signed.ok).to.eql(true);

      const sigRead = await Fs.read(signature);
      expect(sigRead.ok).to.eql(true);
      if (!sigRead.ok || !sigRead.data) {
        throw new Error('Expected detached signature sidecar to exist.');
      }

      const verified = await DistSigner.run({
        mode: 'verify',
        artifact: { path: artifact, kind: 'manifest' },
        signature: { path: signature },
        publicKey,
        identityRef: 'local-test-key-print-sample',
      });
      expect(verified.ok).to.eql(true);

      const sigBytes = sigRead.data;
      const sigHex = Hash.toHex(sigBytes.subarray(0, 16));

      console.info(c.brightCyan(c.bold('\nDistSigner detached signature sample')));
      console.info(c.gray(`artifact  → ${artifact}`));
      console.info(c.gray(`signature → ${signature}`));
      console.info(c.gray(`sig bytes → ${sigBytes.length}`));
      console.info(c.gray(`sig hex   → ${sigHex}…`));
      console.info(c.gray('sign res  →'), signed);
      console.info(c.gray('verify res→'), verified);
    });
  });

  describe('dist.json semantics and canonicalization invariants', () => {
    const ownKeyCases = [
      { name: 'own keys with default writeback', key: '__proto__', writeBack: true },
      { name: 'own keys without writeback', key: '__proto__', writeBack: false },
      { name: 'ordinary-key canonical byte control', key: '_own', writeBack: true },
      { name: 'own keys over inherited setters', key: '_signerOwnKey', writeBack: true },
    ] as const;

    for (const test of ownKeyCases) {
      it(`sign → preserves ${test.name}`, async () => {
        await using temporary = await temporaryDirectory('driver-signer.dist.own-keys.');
        const dir = temporary.absolute;
        const inherited = Object.getOwnPropertyDescriptor(Object.prototype, test.key);
        let setterCalls = 0;
        try {
          // Exercise setter dispatch even on runtimes that special-case __proto__ assignment.
          if (test.key === '_signerOwnKey') {
            Object.defineProperty(Object.prototype, test.key, {
              configurable: true,
              set() {
                setterCalls += 1;
                throw new Error('Canonical reconstruction invoked an inherited setter.');
              },
            });
          }
          const artifact = Fs.join(dir, 'dist.json');
          const signature = Fs.join(dir, 'dist.json.sig');
          // Replacing the key preserves its sort position, giving a pre-fix positive control.
          const canonical = canonicalOwnKeyFixture(test.key);
          const parsed = Json.parse<Record<string, unknown>>(canonical);
          if (!Is.record(parsed)) throw new Error('Expected canonical JSON fixture.');
          const { type, hash, ...rest } = parsed;
          const source = Json.stringify({ type, hash, ...rest }, 0);
          expect(Obj.hasOwn(parsed, test.key)).to.eql(true);
          await Fs.write(artifact, source, { throw: true });

          const keys = await SignEd25519.generateKeyPair();
          const signed = await DistSigner.run({
            mode: 'sign',
            artifact: { path: artifact, kind: 'dist.json' },
            signature: { path: signature },
            privateKey: keys.privateKey,
            ...(test.writeBack ? {} : { writeBack: { distSignDescriptor: false } }),
          });
          expect(setterCalls).to.eql(0);
          expect(signed.ok).to.eql(true);

          const written = await Fs.readText(artifact);
          if (!written.ok || !written.data) throw new Error('Expected signed Dist document.');
          expect(written.data).to.eql(test.writeBack ? canonical : source);
          const loaded = await Pkg.Dist.load(artifact);
          expect(loaded.kind).to.eql('canonical');
          if (!loaded.dist) throw new Error('Expected canonical Dist document.');
          for (const key of [test.key, 'constructor', 'toString']) {
            expect(Obj.hasOwn(loaded.dist, key)).to.eql(true);
            expect(Obj.hasOwn(loaded.dist.hash.parts, key)).to.eql(true);
          }
          expect(Object.keys(loaded.dist.hash.parts).length).to.eql(4);

          // Verify against independently ordered literal bytes, not the signer's canonicalizer.
          const expectedBytes = new TextEncoder().encode(canonical);
          const detached = await Fs.read(signature);
          if (!detached.ok || !detached.data) throw new Error('Expected detached signature.');
          expect(runData(signed).artifactHash).to.eql(Hash.sha256(expectedBytes));
          expect(
            await SignEd25519.verify({
              bytes: expectedBytes,
              signature: detached.data,
              publicKey: keys.publicKey,
            }),
          ).to.eql(true);

          const verify = () =>
            DistSigner.run({
              mode: 'verify',
              artifact: { path: artifact, kind: 'dist.json' },
              signature: { path: signature },
              publicKey: keys.publicKey,
            });
          expect((await verify()).ok).to.eql(true);

          // This nested descriptive member must be signed even though it is not inventory.
          const changed = written.data.replace('"before"', '"after"');
          expect(changed).not.to.eql(written.data);
          await Fs.write(artifact, changed, { throw: true });
          const rejected = await verify();
          expect(rejected.ok).to.eql(false);
          if (rejected.ok) throw new Error('Expected own-member mutation to invalidate signature.');
          expect(rejected.code).to.eql('E_VERIFY');
          expect(rejected.stage).to.eql('verify');
        } finally {
          if (test.key === '_signerOwnKey') {
            if (inherited) Object.defineProperty(Object.prototype, test.key, inherited);
            else Reflect.deleteProperty(Object.prototype, test.key);
          }
        }
      });
    }

    it('sign → writes detached signature descriptor into canonical dist.json and preserves Dist.compute hash', async () => {
      await using temporary = await temporaryDirectory();
      const dir = temporary.absolute;
      await Fs.write(Fs.join(dir, 'a.txt'), new TextEncoder().encode('hello\n'), { throw: true });

      const before = await Pkg.Dist.compute({ dir, save: true });
      expect(before.kind).to.eql('computed');
      if (before.kind !== 'computed') throw new Error(before.error.message);

      const artifact = Fs.join(dir, 'dist.json');
      const signature = Fs.join(dir, 'dist.json.sig');
      const keys = await SignEd25519.generateKeyPair();

      const signed = await DistSigner.run({
        mode: 'sign',
        artifact: { path: artifact, kind: 'dist.json' },
        signature: { path: signature },
        privateKey: keys.privateKey,
        identityRef: 'kid:dist-sample-1',
      });
      expect(signed.ok).to.eql(true);

      const after = await Pkg.Dist.compute({ dir, save: false });
      expect(after.kind).to.eql('computed');
      if (after.kind !== 'computed') throw new Error(after.error.message);
      expect(after.pin).to.eql(before.pin);
      expect(after.dist.hash.digest).to.eql(before.dist.hash.digest);
      expect(after.dist.hash.parts).to.eql(before.dist.hash.parts);

      const loaded = await Fs.readJson<Record<string, unknown>>(artifact);
      expect(loaded.ok).to.eql(true);
      if (!loaded.ok || !loaded.data) throw new Error('Expected dist.json to load.');

      const build = loaded.data.build as Record<string, unknown>;
      const sign = build.sign as Record<string, unknown>;
      expect(typeof sign).to.eql('object');
      expect(sign.path).to.eql('./dist.json.sig');
      expect(sign.scheme).to.eql('Ed25519');
      expect(sign.key).to.eql('kid:dist-sample-1');

      const verified = await DistSigner.run({
        mode: 'verify',
        artifact: { path: artifact, kind: 'dist.json' },
        signature: { path: signature },
        publicKey: keys.publicKey,
      });
      expect(verified.ok).to.eql(true);

      const signedData = runData(signed);
      const verifiedData = runData(verified);
      expect(verifiedData.artifactHash).to.eql(signedData.artifactHash);
      expect(verifiedData.verified).to.eql(true);
    });

    it('real own-key payload → signer writeback → original-pin verification, with distinct tamper subjects', async () => {
      await using temporary = await temporaryDirectory('driver-signer.dist.pipeline.');
      const root = await Fs.realPath(temporary.absolute);
      const dir = Fs.join(root, 'payload');
      const artifact = Fs.join(dir, 'dist.json');
      const signature = Fs.join(root, 'dist.json.sig'); // Outside the closed payload inventory.
      await Fs.write(Fs.join(dir, '__proto__'), 'A', { throw: true });
      const computed = await Pkg.Dist.compute({ dir, save: true });
      if (computed.kind !== 'computed') throw computed.error;
      const pin = Object.freeze({ ...computed.pin });
      expect(Obj.hasOwn(computed.dist.hash.parts, '__proto__')).to.eql(true);
      const document = { ...computed.dist, ['__proto__']: { note: 'original' } };
      await Fs.write(artifact, Json.stringify(document), { throw: true });
      const { privateKey, publicKey } = await SignEd25519.generateKeyPair();
      const signed = await DistSigner.run({
        mode: 'sign',
        artifact: { path: artifact, kind: 'dist.json' },
        signature: { path: signature },
        privateKey,
      });
      expect(signed.ok).to.eql(true);
      const loaded = await Pkg.Dist.load(artifact);
      if (!loaded.dist) throw new Error('Expected signed Dist document.');
      expect(loaded.kind).to.eql('canonical');
      expect(Obj.hasOwn(loaded.dist.hash.parts, '__proto__')).to.eql(true);
      expect(Object.getOwnPropertyDescriptor(loaded.dist, '__proto__')?.value)
        .to.eql({ note: 'original' });
      expect(loaded.dist.build.sign).to.eql({ path: signature, scheme: 'Ed25519' });
      const verifyPin = () =>
        Pkg.Dist.Pinned.verify({
          dir,
          pin,
          limits: { manifestBytes: 1024 * 1024, entries: 16, fileBytes: 1024, totalBytes: 1024 },
        });
      const verifySignature = () =>
        DistSigner.run({
          mode: 'verify',
          artifact: { path: artifact, kind: 'dist.json' },
          signature: { path: signature },
          publicKey,
        });
      const verified = await verifyPin();
      expect(verified.kind).to.eql('verified');
      if (verified.kind !== 'verified') throw new Error('Expected pinned signed payload.');
      expect(verified.evidence.content.digest).to.eql(pin.digest);
      expect(verified.evidence.content.parts).to.eql(computed.dist.hash.parts);
      expect(runData(await verifySignature()).verified).to.eql(true);

      await Fs.write(
        artifact,
        Json.stringify({ ...loaded.dist, ['__proto__']: { note: 'changed' } }),
        { throw: true },
      );
      const signatureRefused = await verifySignature();
      expect(signatureRefused.ok).to.eql(false);
      if (signatureRefused.ok) throw new Error('Expected descriptive signature refusal.');
      expect(signatureRefused.code).to.eql('E_VERIFY');
      expect((await verifyPin()).kind).to.eql('verified');

      await Fs.write(Fs.join(dir, '__proto__'), 'B', { throw: true });
      expect((await verifyPin()).kind).to.eql('content-mismatch');
      const changed = await Pkg.Dist.compute({ dir, save: false });
      if (changed.kind !== 'computed') throw changed.error;
      expect(changed.pin).not.to.eql(pin);
    });

    it('generic manifest ignores dist sign descriptor write-back trigger', async () => {
      await using temporary = await temporaryDirectory();
      const dir = temporary.absolute;
      const artifact = Fs.join(dir, 'manifest.json');
      const signature = Fs.join(dir, 'manifest.json.sig');
      const source = '{"hello":"world"}\n';
      await Fs.write(artifact, source, { throw: true });

      const { privateKey } = await SignEd25519.generateKeyPair();
      const signed = await DistSigner.run({
        mode: 'sign',
        artifact: { path: artifact, kind: 'manifest' },
        signature: { path: signature },
        privateKey,
        writeBack: { distSignDescriptor: true },
      });
      expect(signed.ok).to.eql(true);

      const text = await Fs.readText(artifact);
      expect(text.ok).to.eql(true);
      expect(text.data).to.eql(source);
    });

    it('dist.json write-back can be explicitly disabled', async () => {
      await using temporary = await temporaryDirectory();
      const dir = temporary.absolute;
      await Fs.write(Fs.join(dir, 'a.txt'), new TextEncoder().encode('hello\n'), { throw: true });
      const computed = await Pkg.Dist.compute({ dir, save: true });
      expect(computed.error).to.eql(undefined);

      const artifact = Fs.join(dir, 'dist.json');
      const signature = Fs.join(dir, 'dist.json.sig');
      const keys = await SignEd25519.generateKeyPair();

      const signed = await DistSigner.run({
        mode: 'sign',
        artifact: { path: artifact, kind: 'dist.json' },
        signature: { path: signature },
        privateKey: keys.privateKey,
        identityRef: 'kid:opt-out',
        writeBack: { distSignDescriptor: false },
      });
      expect(signed.ok).to.eql(true);

      const loaded = await Fs.readJson<Record<string, unknown>>(artifact);
      expect(loaded.ok).to.eql(true);
      if (!loaded.ok || !loaded.data) throw new Error('Expected dist.json to load.');
      const build = loaded.data.build as Record<string, unknown>;
      expect(build.sign).to.eql(undefined);

      const verified = await DistSigner.run({
        mode: 'verify',
        artifact: { path: artifact, kind: 'dist.json' },
        signature: { path: signature },
        publicKey: keys.publicKey,
      });
      expect(verified.ok).to.eql(true);
    });

    it('dist.json descriptor preserves caller path when signature sidecar is in a different directory', async () => {
      await using temporary = await temporaryDirectory();
      const dir = temporary.absolute;
      const sigDir = Fs.join(dir, 'signatures');
      await Fs.write(Fs.join(dir, 'a.txt'), new TextEncoder().encode('hello\n'), { throw: true });
      const computed = await Pkg.Dist.compute({ dir, save: true });
      expect(computed.error).to.eql(undefined);

      const artifact = Fs.join(dir, 'dist.json');
      const signature = Fs.join(sigDir, 'dist.json.sig');
      const keys = await SignEd25519.generateKeyPair();

      const signed = await DistSigner.run({
        mode: 'sign',
        artifact: { path: artifact, kind: 'dist.json' },
        signature: { path: signature },
        privateKey: keys.privateKey,
      });
      expect(signed.ok).to.eql(true);

      const loaded = await Fs.readJson<Record<string, unknown>>(artifact);
      expect(loaded.ok).to.eql(true);
      if (!loaded.ok || !loaded.data) throw new Error('Expected dist.json to load.');
      const build = loaded.data.build as Record<string, unknown>;
      const sign = build.sign as Record<string, unknown>;
      expect(sign.path).to.eql(signature);
      expect(sign.scheme).to.eql('Ed25519');

      const verified = await DistSigner.run({
        mode: 'verify',
        artifact: { path: artifact, kind: 'dist.json' },
        signature: { path: signature },
        publicKey: keys.publicKey,
      });
      expect(verified.ok).to.eql(true);
    });

    it('prints canonical dist.json sample with detached signature descriptor and signer metadata', async () => {
      await using temporary = await temporaryDirectory();
      const dir = temporary.absolute;
      await Fs.write(Fs.join(dir, 'a.txt'), new TextEncoder().encode('hello\n'), { throw: true });
      const computed = await Pkg.Dist.compute({ dir, save: true });
      expect(computed.error).to.eql(undefined);

      const artifact = Fs.join(dir, 'dist.json');
      const signature = Fs.join(dir, 'dist.json.sig');
      const { privateKey, publicKey } = await SignEd25519.generateKeyPair();

      const signed = await DistSigner.run({
        mode: 'sign',
        artifact: { path: artifact, kind: 'dist.json' },
        signature: { path: signature },
        privateKey,
        identityRef: 'kid:print-sample',
      });
      expect(signed.ok).to.eql(true);

      const verified = await DistSigner.run({
        mode: 'verify',
        artifact: { path: artifact, kind: 'dist.json' },
        signature: { path: signature },
        publicKey,
      });
      expect(verified.ok).to.eql(true);

      const json = await Fs.readText(artifact);
      expect(json.ok).to.eql(true);
      if (!json.ok || !json.data) throw new Error('Expected dist.json text to load.');
      const parsed = await Fs.readJson<Record<string, unknown>>(artifact);
      expect(parsed.ok).to.eql(true);
      if (!parsed.ok || !parsed.data) throw new Error('Expected dist.json object to load.');
      const build = parsed.data.build as Record<string, unknown>;
      const sign = build.sign as Record<string, unknown>;

      console.info(c.brightCyan(c.bold('\nDistSigner canonical dist.json sample')));
      console.info(c.gray(`artifact  → ${artifact}`));
      console.info(c.gray(`signature → ${signature}`));
      console.info(c.gray('dist.json  →'));
      console.info(c.italic(c.yellow(json.data)));
      const signJson = `${Json.stringify(sign, 2)}\n`;
      console.info(c.brightCyan(c.bold('\nDistSigner dist.json build.sign descriptor')));
      console.info(c.gray('build.sign →'));
      console.info(c.italic(c.yellow(signJson)));
      console.info(c.gray('sign res   →'), signed);
      console.info(c.gray('verify res →'), verified);
    });

    it('verify → succeeds across dist.json formatting and key-order changes', async () => {
      await using temporary = await temporaryDirectory();
      const dir = temporary.absolute;
      await Fs.write(Fs.join(dir, 'a.txt'), new TextEncoder().encode('hello\n'), { throw: true });
      const computed = await Pkg.Dist.compute({ dir, save: true });
      expect(computed.error).to.eql(undefined);

      const artifact = Fs.join(dir, 'dist.json');
      const signature = Fs.join(dir, 'dist.json.sig');
      const keys = await SignEd25519.generateKeyPair();

      const signed = await DistSigner.run({
        mode: 'sign',
        artifact: { path: artifact, kind: 'dist.json' },
        signature: { path: signature },
        privateKey: keys.privateKey,
      });
      expect(signed.ok).to.eql(true);

      const loaded = await Fs.readJson<Record<string, unknown>>(artifact);
      expect(loaded.ok).to.eql(true);
      if (!loaded.ok || !loaded.data) throw new Error('Expected dist.json to load.');

      const src = loaded.data;
      const reordered = {
        hash: src.hash,
        build: src.build,
        pkg: src.pkg,
        type: src.type,
      };
      await Fs.write(artifact, `${Json.stringify(reordered, 2)}\n`, { throw: true });

      const verified = await DistSigner.run({
        mode: 'verify',
        artifact: { path: artifact, kind: 'dist.json' },
        signature: { path: signature },
        publicKey: keys.publicKey,
      });
      expect(verified.ok).to.eql(true);
      const signedData = runData(signed);
      const verifiedData = runData(verified);
      expect(signedData.artifactPath).to.eql(artifact);
      expect(signedData.signaturePath).to.eql(signature);
      expect(signedData.verified).to.eql(false);
      expect(verifiedData.artifactPath).to.eql(artifact);
      expect(verifiedData.signaturePath).to.eql(signature);
      expect(verifiedData.verified).to.eql(true);
      expect(verifiedData.artifactHash).to.eql(signedData.artifactHash);
      expect(verifiedData.artifactHash).to.match(/^sha256-[0-9a-f]{64}$/);
    });
  });
});

/** Test-owned directory: disposal is armed before any fixture setup can fail. */
async function temporaryDirectory(prefix = 'driver-signer.dist.') {
  const temporary = await Fs.makeTempDir({ prefix });
  const life = Rx.lifecycleAsync(async () => {
    await Fs.remove(temporary.absolute);
  });
  return { ...temporary, ...life };
}

/** Independently ordered canonical document, including nested own-property JSON data. */
function canonicalOwnKeyFixture(key: string): string {
  const hash = 'sha256-0000000000000000000000000000000000000000000000000000000000000000';
  // Independent native tuple encoding; the signer must preserve every member of this document.
  const digest = Hash.sha256(JSON.stringify(['sys.dist/v2', [
    [key, hash, 1],
    ['a.txt', hash, 1],
    ['constructor', hash, 1],
    ['toString', hash, 1],
  ]]));
  const json = Str.dedent(`
    {
      "__proto__": {
        "a": true,
        "nested": [
          {
            "__proto__": "before",
            "constructor": 7,
            "toString": null
          },
          false,
          0,
          "text"
        ],
        "z": false
      },
      "build": {
        "builder": "fixture",
        "hash": {
          "policy": "fixture"
        },
        "runtime": "fixture",
        "sign": {
          "path": "./dist.json.sig",
          "scheme": "Ed25519"
        },
        "size": {
          "pkg": 0,
          "total": 4
        },
        "time": 0
      },
      "constructor": "metadata",
      "hash": {
        "digest": "${digest}",
        "parts": {
          "__proto__": "${hash}:size=1",
          "a.txt": "${hash}:size=1",
          "constructor": "${hash}:size=1",
          "toString": "${hash}:size=1"
        },
        "scheme": "sys.dist/v2"
      },
      "toString": "metadata",
      "type": "fixture"
    }
  `);
  // Existing Dist signing uses indented JSON followed by two LF bytes; keep that exact contract.
  return `${json.replaceAll('"__proto__"', `"${key}"`)}\n\n`;
}

import { c, describe, expect, it } from '../../-test.ts';
import { type t, Fs, Pkg, Json, SignEd25519 } from '../common.ts';
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

  describe('exact-bytes detached signature invariants', () => {
    it('sign → verify succeeds with a local test key-pair', async () => {
      const dir = await Deno.makeTempDir({ prefix: 'driver-signer.dist.' });
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
      const dir = await Deno.makeTempDir({ prefix: 'driver-signer.dist.' });
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
      const dir = await Deno.makeTempDir({ prefix: 'driver-signer.dist.' });
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
      const dir = await Deno.makeTempDir({ prefix: 'driver-signer.dist.' });
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
      const dir = await Deno.makeTempDir({ prefix: 'driver-signer.dist.' });
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
      if (!sigRead.ok || !sigRead.data)
        throw new Error('Expected detached signature sidecar to exist.');

      const verified = await DistSigner.run({
        mode: 'verify',
        artifact: { path: artifact, kind: 'manifest' },
        signature: { path: signature },
        publicKey,
        identityRef: 'local-test-key-print-sample',
      });
      expect(verified.ok).to.eql(true);

      const sigBytes = sigRead.data;
      const sigHex = Array.from(sigBytes)
        .slice(0, 16)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

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
    it('sign → writes detached signature descriptor into canonical dist.json and preserves Dist.compute hash', async () => {
      const dir = await Deno.makeTempDir({ prefix: 'driver-signer.dist.' });
      await Fs.write(Fs.join(dir, 'a.txt'), new TextEncoder().encode('hello\n'), { throw: true });

      const before = await Pkg.Dist.compute({ dir, save: true });
      expect(before.error).to.eql(undefined);

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
      expect(after.error).to.eql(undefined);
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

    it('generic manifest ignores dist sign descriptor write-back trigger', async () => {
      const dir = await Deno.makeTempDir({ prefix: 'driver-signer.dist.' });
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
      const dir = await Deno.makeTempDir({ prefix: 'driver-signer.dist.' });
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
      const dir = await Deno.makeTempDir({ prefix: 'driver-signer.dist.' });
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
      const dir = await Deno.makeTempDir({ prefix: 'driver-signer.dist.' });
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
      const dir = await Deno.makeTempDir({ prefix: 'driver-signer.dist.' });
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

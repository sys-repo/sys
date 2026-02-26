import { c, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { SignEd25519 } from '@sys/crypto/sign/ed25519';
import { Fs, Pkg as FsPkg } from '@sys/fs';
import { DistSigner } from '../mod.ts';

describe(`DistSigner`, () => {
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

      const verified = await DistSigner.run({
        mode: 'verify',
        artifact: { path: artifact, kind: 'manifest' },
        signature: { path: signature },
        publicKey,
      });
      expect(verified.ok).to.eql(true);
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
      if (!sigRead.ok || !sigRead.data) throw new Error('Expected detached signature sidecar to exist.');

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
    it('verify → succeeds across dist.json formatting and key-order changes', async () => {
      const dir = await Deno.makeTempDir({ prefix: 'driver-signer.dist.' });
      await Fs.write(Fs.join(dir, 'a.txt'), new TextEncoder().encode('hello\n'), { throw: true });
      const computed = await FsPkg.Dist.compute({ dir, save: true });
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
      await Fs.write(artifact, `${JSON.stringify(reordered, null, 2)}\n`, { throw: true });

      const verified = await DistSigner.run({
        mode: 'verify',
        artifact: { path: artifact, kind: 'dist.json' },
        signature: { path: signature },
        publicKey: keys.publicKey,
      });
      expect(verified.ok).to.eql(true);
    });
  });
});

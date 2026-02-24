import { describe, expect, it } from '../../-test.ts';
import { SignEd25519 } from '../mod.ts';

describe(`Sign.Ed25519`, () => {
  it('API', async () => {
    const m = await import('@sys/crypto/sign');
    const mm = await import('@sys/crypto/sign/ed25519');
    expect(m.SignEd25519).to.equal(SignEd25519);
    expect(mm.SignEd25519).to.equal(SignEd25519);
  });

  it('generate → sign → verify', async () => {
    const { privateKey, publicKey } = await SignEd25519.generateKeyPair();
    const bytes = new TextEncoder().encode('hello signer');
    const signature = await SignEd25519.sign({ bytes, privateKey });
    const ok = await SignEd25519.verify({ bytes, signature, publicKey });

    expect(signature).to.be.instanceOf(Uint8Array);
    expect(signature.length > 0).to.eql(true);
    expect(ok).to.eql(true);
  });

  it('verify: false when bytes are tampered', async () => {
    const { privateKey, publicKey } = await SignEd25519.generateKeyPair();
    const original = new TextEncoder().encode('hello signer');
    const tampered = new TextEncoder().encode('hello signer!');
    const signature = await SignEd25519.sign({ bytes: original, privateKey });

    const ok = await SignEd25519.verify({ bytes: tampered, signature, publicKey });
    expect(ok).to.eql(false);
  });

  it('verify: false with the wrong public key', async () => {
    const pairA = await SignEd25519.generateKeyPair();
    const pairB = await SignEd25519.generateKeyPair();
    const bytes = new TextEncoder().encode('hello signer');
    const signature = await SignEd25519.sign({ bytes, privateKey: pairA.privateKey });

    const ok = await SignEd25519.verify({ bytes, signature, publicKey: pairB.publicKey });
    expect(ok).to.eql(false);
  });
});

import { describe, expect, it } from '../../-test.ts';
import { SignEd25519 } from '../mod.ts';

describe(`Sign.Ed25519`, () => {
  it('API', async () => {
    const m = await import('@sys/crypto/sign');
    const mm = await import('@sys/crypto/sign/ed25519');
    expect(m.SignEd25519).to.equal(SignEd25519);
    expect(mm.SignEd25519).to.equal(SignEd25519);
  });
});

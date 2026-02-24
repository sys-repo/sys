import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { DistSigner } from '../mod.ts';

describe(`DistSigner`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-signer/dist');
    expect(m.DistSigner).to.equal(DistSigner);
  });

  describe('phase-a skeleton behavior', () => {
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

    it('run: returns canonical not-implemented failure result', async () => {
      const res = await DistSigner.run({
        mode: 'sign',
        artifact: { path: '/tmp/example/dist.json', kind: 'dist.json' },
        signature: { path: '/tmp/example/dist.json.sig' },
        identityRef: 'local-test-key-1',
      });

      expect(res.ok).to.eql(false);
      if (res.ok) throw new Error('Expected DistSigner.run to return a failure result.');

      expect(res.code).to.eql('E_INTERNAL');
      expect(res.stage).to.eql('internal');
      expect(res.error.name).to.eql('Error');
      expect(res.error.message).to.contain('not implemented');
      expect(res.data?.target).to.eql('content-manifest');
      expect(res.data?.mode).to.eql('sign');
    });
  });
});

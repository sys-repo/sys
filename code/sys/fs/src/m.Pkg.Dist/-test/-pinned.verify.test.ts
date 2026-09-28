import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Pkg } from '../../m.Pkg/mod.ts';
import { limits, setup, teardown } from './-u.pinned.fixture.ts';

describe('Pkg.Dist.Pinned.verify', () => {
  it('returns immutable owner-derived evidence for one exact generation', async () => {
    const fixture = await setup();
    try {
      const result = await Pkg.Dist.Pinned.verify({
        dir: fixture.dir,
        pin: fixture.pin,
        limits,
      });

      expectTypeOf(result).toEqualTypeOf<t.Pkg.Dist.Pinned.Verify.Result>();
      expect(result.kind).to.eql('verified');
      if (result.kind !== 'verified') return;

      expect(result.evidence.content.digest).to.eql(fixture.pin.digest);
      expect(result.evidence.manifestChecksum).to.eql(fixture.manifestChecksum);
      expect(result.evidence.manifestBytes).to.eql(fixture.manifest.byteLength);
      expect(result.evidence.assets).to.eql({
        files: Object.keys(fixture.dist.hash.parts).length,
        totalBytes: fixture.dist.build.size.total,
        packageBytes: fixture.dist.build.size.pkg,
      });
      expect(result.evidence.content).to.eql(fixture.dist.hash);
      expect('dist' in result.evidence).to.eql(false);
      const frozen = [
        result,
        result.evidence,
        result.evidence.assets,
        result.evidence.content,
        result.evidence.content.parts,
      ];
      expect(frozen.every(Object.isFrozen)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });
});

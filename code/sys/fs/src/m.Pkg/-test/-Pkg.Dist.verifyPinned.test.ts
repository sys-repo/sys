import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Pkg } from '../mod.ts';
import { limits, setup, teardown } from './-u.verifyPinned.fixture.ts';

describe('Pkg.Dist.verifyPinned', () => {
  it('returns immutable owner-derived evidence for one exact generation', async () => {
    const fixture = await setup();
    try {
      const result = await Pkg.Dist.verifyPinned({
        dir: fixture.dir,
        integrity: fixture.integrity,
        limits,
      });

      expectTypeOf(result).toEqualTypeOf<t.Pkg.Dist.VerifyPinned.Result>();
      expect(result.kind).to.eql('verified');
      if (result.kind !== 'verified') return;

      expect(result.evidence.integrity).to.eql(fixture.integrity);
      expect(result.evidence.manifestBytes).to.eql(fixture.manifest.byteLength);
      expect(result.evidence.assets).to.eql({
        files: Object.keys(fixture.dist.hash.parts).length,
        totalBytes: fixture.dist.build.size.total,
        packageBytes: fixture.dist.build.size.pkg,
      });
      expect(result.evidence.dist).to.eql(fixture.dist);
      const frozen = [
        result,
        result.evidence,
        result.evidence.assets,
        result.evidence.dist,
        result.evidence.dist.pkg!,
        result.evidence.dist.build,
        result.evidence.dist.build.size,
        result.evidence.dist.build.hash,
        result.evidence.dist.build.hash.ignore!,
        result.evidence.dist.build.hash.ignore!.rules,
        result.evidence.dist.hash,
        result.evidence.dist.hash.parts,
      ];
      expect(frozen.every(Object.isFrozen)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });
});

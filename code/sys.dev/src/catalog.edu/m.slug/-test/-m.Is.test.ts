import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t } from '../common.ts';
import { Slug } from '../mod.ts';

describe('Slug.Is', () => {
  describe('Is.videoRecorderBinding', () => {
    it('videoRecorderBinding: signature is correct', () => {
      type Expect = (m: unknown) => m is t.VideoRecorderBinding;
      expectTypeOf(Slug.Is.videoRecorderBinding).toEqualTypeOf<Expect>();
    });

    it('videoRecorderBinding: runtime truth table', () => {
      const ok = { id: 'video-recorder', as: 'rec1' };
      const wrongId = { id: 'video-player', as: 'rec1' };
      const missingAs = { id: 'video-recorder' };
      const emptyAs = { id: 'video-recorder', as: '' };

      expect(Slug.Is.videoRecorderBinding(ok)).to.eql(true);
      expect(Slug.Is.videoRecorderBinding(wrongId)).to.eql(false);
      expect(Slug.Is.videoRecorderBinding(missingAs as any)).to.eql(false);
      expect(Slug.Is.videoRecorderBinding(emptyAs)).to.eql(false);
      expect(Slug.Is.videoRecorderBinding(null)).to.eql(false);
      expect(Slug.Is.videoRecorderBinding(42)).to.eql(false);
    });

    it('videoRecorderBinding: narrows type', () => {
      const input: unknown = { id: 'video-recorder', as: 'cam' };
      if (Slug.Is.videoRecorderBinding(input)) {
        // Narrowed to t.VideoRecorderBinding here:
        expectTypeOf(input.id).toEqualTypeOf<'video-recorder'>();
        expectTypeOf(input.as).toEqualTypeOf<string>();
        expect(input.as.length > 0).to.eql(true);
      } else {
        expect(true).to.eql(false); // ← should not happen.
      }
    });
  });
});

import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t, Player } from '../common.ts';
import { mergePlayback, mergeSlug } from '../mod.ts';

describe(`effects`, () => {
  describe('patch', () => {
    it('merges slug patch onto existing slice', () => {
      const loading = { isLoading: true };
      const state: t.SlugPlaybackState = {
        slug: {
          selectedPath: ['a'],
          loading,
        },
      };

      const patch = mergeSlug(state, { selectedPath: ['b'] });
      expect(patch).to.eql({
        slug: {
          selectedPath: ['b'],
          loading,
        },
      });
      expectTypeOf(patch).toMatchTypeOf<t.SlugPlaybackPatch>();
    });

    it('merges playback patch onto existing slice', () => {
      const decks = Player.Video.Decks.create();
      const state: t.SlugPlaybackState = {
        playback: { decks },
      };

      const patch = mergePlayback(state, { snapshot: undefined });
      expect(patch.playback?.decks).to.equal(decks);
      expect(patch.playback?.snapshot).to.equal(undefined);
      expectTypeOf(patch).toMatchTypeOf<t.SlugPlaybackPatch>();
    });
  });
});

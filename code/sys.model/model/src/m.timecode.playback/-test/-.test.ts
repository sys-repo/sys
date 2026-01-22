import { describe, expect, it } from '../../-test.ts';
import { PlaybackSchema } from '../mod.ts';

describe(`timecode.playback`, () => {
  it('API', async () => {
    const m = await import('@sys/model/timecode/playback');
    expect(m.PlaybackSchema).to.equal(PlaybackSchema);
  });
});

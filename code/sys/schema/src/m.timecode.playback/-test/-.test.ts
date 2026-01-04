import { describe, expect, it } from '../../-test.ts';
import { PlaybackSchema } from '../mod.ts';

describe(`schema/timecode/playback`, () => {
  it('API', async () => {
    const m = await import('@sys/schema/timecode/playback');
    expect(m.PlaybackSchema).to.equal(PlaybackSchema);
  });
});

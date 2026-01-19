import { describe, expect, it } from '../../-test.ts';
import { PlaybackSchema } from '../mod.ts';

describe(`schema/wire/timecode/playback`, () => {
  it('API', async () => {
    const m = await import('@sys/schema/wire/timecode/playback');
    expect(m.PlaybackSchema).to.equal(PlaybackSchema);
  });
});

import { describe, expect, it } from '../../../-test.ts';

import { type t, Is } from '../common.ts';
import { PlaybackDriver, Dev } from '../mod.ts';

describe('Media.PlaybackDriver', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components/media/timecode/playback-driver');
    expect(m.PlaybackDriver).to.equal(PlaybackDriver);
    expect(m.Dev).to.equal(Dev);
  });
});

import { describe, expect, it } from '../../../-test.ts';
import { shouldInitPlayback } from '../-spec/-u.playback.runtime.ts';

describe('ui.Driver.MediaPlayback/-u.playback.runtime', () => {
  it('does not init without timeline', () => {
    const res = shouldInitPlayback({
      hasTimeline: false,
      hasPlayback: true,
      initToken: 'req-1',
      lastInitToken: '',
    });
    expect(res).to.eql(false);
  });

  it('does not init without playback payload', () => {
    const res = shouldInitPlayback({
      hasTimeline: true,
      hasPlayback: false,
      initToken: 'req-1',
      lastInitToken: '',
    });
    expect(res).to.eql(false);
  });

  it('does not re-init when token is unchanged', () => {
    const res = shouldInitPlayback({
      hasTimeline: true,
      hasPlayback: true,
      initToken: 'req-1',
      lastInitToken: 'req-1',
    });
    expect(res).to.eql(false);
  });

  it('does init when session token changes (same content shape allowed)', () => {
    const res = shouldInitPlayback({
      hasTimeline: true,
      hasPlayback: true,
      initToken: 'req-2',
      lastInitToken: 'req-1',
    });
    expect(res).to.eql(true);
  });
});


import { describe, expect, it } from '../../../-test.ts';
import { shouldInitPlayback, toCurrentPayload, toCurrentPosition, toPlaybackData } from '../u.head.ts';

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

  it('guards playback content from unknown input', () => {
    expect(toPlaybackData(undefined)).to.eql(undefined);
    expect(toPlaybackData({ kind: 'file-content' })).to.eql(undefined);

    const playback = { docid: 'abc', composition: { segments: [] }, beats: [] } as any;
    const assets = [] as const;
    expect(toPlaybackData({ kind: 'playback-content', playback, assets })).to.eql({ playback, assets });
  });

  it('derives current position from snapshot beat index', () => {
    const snapshot = {
      state: {
        currentBeat: 3,
        timeline: {
          segments: [{ beat: { from: 0, to: 2 } }, { beat: { from: 2, to: 5 } }],
        },
      },
    } as any;
    expect(toCurrentPosition(snapshot)).to.eql('segment-2:beat-4');
  });

  it('returns undefined current position when timeline is missing', () => {
    expect(toCurrentPosition(undefined)).to.eql(undefined);
    expect(toCurrentPosition({ state: { currentBeat: 1 } } as any)).to.eql(undefined);
  });

  it('derives current payload from current beat', () => {
    const payload = { title: 'Hello' };
    const res = toCurrentPayload({
      playback: { beats: [{ payload: { title: 'A' } }, { payload }] } as any,
      snapshot: { state: { currentBeat: 1 } } as any,
    });
    expect(res).to.eql(payload);
  });
});

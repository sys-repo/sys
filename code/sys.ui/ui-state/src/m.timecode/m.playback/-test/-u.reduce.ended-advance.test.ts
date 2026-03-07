import { describe, expect, it, type t } from '../../../-test.ts';
import { Playback } from '../mod.ts';
import { emptyState } from './u.fixture.ts';

type PlayCmd = Extract<t.PlaybackCmd, { readonly kind: 'cmd:deck:play' }>;
type SeekCmd = Extract<t.PlaybackCmd, { readonly kind: 'cmd:deck:seek' }>;
type SwapCmd = Extract<t.PlaybackCmd, { readonly kind: 'cmd:swap-decks' }>;

function beat(index: number, vTime: number, segmentId: string, duration = 1000): t.PlaybackBeat {
  return {
    index,
    vTime,
    duration,
    segmentId,
  };
}

function timelineTwoSegments(): t.PlaybackTimeline {
  /**
   * Two segments:
   * - seg:0 beats [0,1]
   * - seg:1 beats [2,3]
   */
  return {
    beats: [
      beat(0, 0, 'seg:0'),
      beat(1, 1000, 'seg:0'),
      beat(2, 2000, 'seg:1'),
      beat(3, 3000, 'seg:1'),
    ],
    segments: [
      { id: 'seg:0', beat: { from: 0, to: 2 } },
      { id: 'seg:1', beat: { from: 2, to: 4 } },
    ],
    virtualDuration: 4000,
  };
}

function initState(timeline: t.PlaybackTimeline) {
  const prev = emptyState();
  return Playback.reduce(prev, { kind: 'playback:init', timeline }).state;
}

function hasPlay(cmds: readonly t.PlaybackCmd[]) {
  return cmds.some((c) => c.kind === 'cmd:deck:play');
}

function playCmd(cmds: readonly t.PlaybackCmd[]): PlayCmd | undefined {
  return cmds.find((c): c is PlayCmd => c.kind === 'cmd:deck:play');
}

function hasSeek(cmds: readonly t.PlaybackCmd[]) {
  return cmds.some((c) => c.kind === 'cmd:deck:seek');
}

function seekCmd(cmds: readonly t.PlaybackCmd[]): SeekCmd | undefined {
  return cmds.find((c): c is SeekCmd => c.kind === 'cmd:deck:seek');
}

function hasSwap(cmds: readonly t.PlaybackCmd[]) {
  return cmds.some((c) => c.kind === 'cmd:swap-decks');
}

function swapCmd(cmds: readonly t.PlaybackCmd[]): SwapCmd | undefined {
  return cmds.find((c): c is SwapCmd => c.kind === 'cmd:swap-decks');
}

describe('Playback.reduce — ended advance', () => {
  it('standby ended is non-fatal (status only)', () => {
    const tl = timelineTwoSegments();
    const s0 = initState(tl);

    const res = Playback.reduce(s0, {
      kind: 'video:ended',
      deck: s0.decks.standby,
    });

    expect(res.state.phase).to.eql('active');
    expect(res.state.intent).to.eql('stop'); // init intent
    expect(res.state.decks.status[s0.decks.standby]).to.eql('ended');

    // No forced navigation implied.
    expect(hasSwap(res.cmds)).to.eql(false);
  });

  it('active ended with no next segment enters terminal ended', () => {
    const tl = timelineTwoSegments();

    // Seek into the last segment (seg:1) at beat 3, so there is no next segment.
    const s0 = Playback.reduce(initState(tl), { kind: 'playback:seek:beat', beat: 3 }).state;

    const res = Playback.reduce(s0, {
      kind: 'video:ended',
      deck: s0.decks.active,
    });

    expect(res.state.phase).to.eql('ended');
    expect(res.state.intent).to.eql('stop');
    expect(res.state.decks.status[s0.decks.active]).to.eql('ended');
  });

  it('after terminal ended, subsequent video:time is ignored (no vTime smear / no cmds)', () => {
    const tl = timelineTwoSegments();

    // Seek into the last segment (seg:1) at beat 3, so there is no next segment.
    const s0 = Playback.reduce(initState(tl), { kind: 'playback:seek:beat', beat: 3 }).state;

    const ended = Playback.reduce(s0, {
      kind: 'video:ended',
      deck: s0.decks.active,
    });

    expect(ended.state.phase).to.eql('ended');
    expect(ended.state.currentBeat).to.eql(3);
    expect(ended.state.vTime).to.eql(tl.beats[3]!.vTime);

    // Any later time tick is stale and must not update state.
    const tick = Playback.reduce(ended.state, {
      kind: 'video:time',
      deck: ended.state.decks.active,
      vTime: (tl.beats[3]!.vTime + 500) as t.Msecs,
    });

    // Identity: reducer must not even clone state here.
    expect(tick.state).to.equal(ended.state);

    // No smear, no implicit navigation, no side-effect intents.
    expect(tick.state.phase).to.eql('ended');
    expect(tick.state.currentBeat).to.eql(3);
    expect(tick.state.vTime).to.eql(tl.beats[3]!.vTime);

    expect(tick.cmds).to.eql([]);
    expect(tick.events).to.eql([]);
  });

  it('active ended advances to next segment start; preserves play intent', () => {
    const tl = timelineTwoSegments();

    // Start in seg:0 beat 1, set intent play.
    const s0 = Playback.reduce(initState(tl), { kind: 'playback:seek:beat', beat: 1 }).state;
    const s1 = Playback.reduce(s0, { kind: 'playback:play' }).state;

    expect(s1.intent).to.eql('play');
    expect(s1.currentBeat).to.eql(1);

    const res = Playback.reduce(s1, {
      kind: 'video:ended',
      deck: s1.decks.active,
    });

    // Next segment begins at beat 2.
    expect(res.state.currentBeat).to.eql(2);
    expect(res.state.phase).to.eql('active');

    // Segment boundary implies swap (seg:0 → seg:1).
    expect(hasSwap(res.cmds)).to.eql(true);
    expect(swapCmd(res.cmds)).to.eql({ kind: 'cmd:swap-decks' });

    // Must seek active deck to the beat boundary.
    expect(hasSeek(res.cmds)).to.eql(true);
    expect(seekCmd(res.cmds)?.vTime).to.eql(tl.beats[2]!.vTime);

    // Preserves play intent by reasserting play on the new active deck.
    expect(hasPlay(res.cmds)).to.eql(true);
    expect(playCmd(res.cmds)?.deck).to.eql(res.state.decks.active);
  });

  it('active ended advances to next segment start; does not force play when intent is stop/pause', () => {
    const tl = timelineTwoSegments();

    // Start in seg:0 beat 1, intent is stop (init).
    const s0 = Playback.reduce(initState(tl), { kind: 'playback:seek:beat', beat: 1 }).state;
    expect(s0.intent).to.eql('stop');

    const res = Playback.reduce(s0, {
      kind: 'video:ended',
      deck: s0.decks.active,
    });

    expect(res.state.currentBeat).to.eql(2);
    expect(hasPlay(res.cmds)).to.eql(false);
  });
});

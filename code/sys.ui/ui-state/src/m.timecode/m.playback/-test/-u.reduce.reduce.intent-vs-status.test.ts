import { describe, expect, it } from '../../../-test.ts';
import { reduce } from '../u.reduce.ts';
import { emptyState, timeline } from './u.fixture.ts';

describe('Playback.reduce — intent vs status', () => {
  it('intent changes do not imply deck status', () => {
    const init = reduce(emptyState(), { kind: 'playback:init', timeline: timeline() });
    const s0 = init.state;

    const r1 = reduce(s0, { kind: 'playback:play' });
    expect(r1.state.intent).to.eql('play');
    expect(r1.state.decks.status[s0.decks.active]).to.eql(s0.decks.status[s0.decks.active]);

    const r2 = reduce(s0, { kind: 'playback:pause' });
    expect(r2.state.intent).to.eql('pause');
    expect(r2.state.decks.status[s0.decks.active]).to.eql(s0.decks.status[s0.decks.active]);

    const r3 = reduce(s0, { kind: 'playback:stop' });
    expect(r3.state.intent).to.eql('stop');
    expect(r3.state.decks.status[s0.decks.active]).to.eql(s0.decks.status[s0.decks.active]);
  });

  it('runtime status does not imply intent', () => {
    const init = reduce(emptyState(), { kind: 'playback:init', timeline: timeline() });
    const s0 = init.state;

    const a = reduce(s0, { kind: 'video:buffering', deck: 'A', is: true });
    expect(a.state.intent).to.eql(s0.intent);

    const b = reduce(s0, { kind: 'video:ready', deck: 'A' });
    expect(b.state.intent).to.eql(s0.intent);

    const c = reduce(s0, { kind: 'video:ended', deck: 'A' });
    expect(c.state.intent).to.eql(s0.intent);
  });

  it('buffering is status-only (does not change phase)', () => {
    const init = reduce(emptyState(), { kind: 'playback:init', timeline: timeline() });
    const s0 = init.state;

    const r1 = reduce(s0, { kind: 'video:buffering', deck: 'A', is: true });

    expect(r1.state.phase).to.eql(s0.phase);
    expect(r1.events.some((e) => e.kind === 'playback:phase')).to.eql(false);
  });

  it('buffering end reconciles status to intent (best-effort)', () => {
    const init = reduce(emptyState(), { kind: 'playback:init', timeline: timeline() });

    // intent=play → status=playing when buffering ends
    const playing = reduce(reduce(init.state, { kind: 'playback:play' }).state, {
      kind: 'video:buffering',
      deck: 'A',
      is: false,
    });
    expect(playing.state.intent).to.eql('play');
    expect(playing.state.decks.status.A).to.eql('playing');

    // intent=pause → status=paused when buffering ends
    const paused = reduce(reduce(init.state, { kind: 'playback:pause' }).state, {
      kind: 'video:buffering',
      deck: 'A',
      is: false,
    });
    expect(paused.state.intent).to.eql('pause');
    expect(paused.state.decks.status.A).to.eql('paused');

    // intent=stop → status=ready when buffering ends
    const ready = reduce(reduce(init.state, { kind: 'playback:stop' }).state, {
      kind: 'video:buffering',
      deck: 'A',
      is: false,
    });
    expect(ready.state.intent).to.eql('stop');
    expect(ready.state.decks.status.A).to.eql('ready');
  });

  it('intent survives runtime signals (no accidental intent drift)', () => {
    const init = reduce(emptyState(), { kind: 'playback:init', timeline: timeline() });

    // Set intent=play.
    const s1 = reduce(init.state, { kind: 'playback:play' }).state;
    expect(s1.intent).to.eql('play');

    // Runner noise should not mutate intent.
    const s2 = reduce(s1, { kind: 'video:ready', deck: 'A' }).state;
    expect(s2.intent).to.eql('play');

    const s3 = reduce(s2, { kind: 'video:buffering', deck: 'A', is: true }).state;
    expect(s3.intent).to.eql('play');

    const s4 = reduce(s3, { kind: 'video:buffering', deck: 'A', is: false }).state;
    expect(s4.intent).to.eql('play');

    const s5 = reduce(s4, { kind: 'video:time', deck: 'A', vTime: 1000 }).state;
    expect(s5.intent).to.eql('play');

    const s6 = reduce(s5, { kind: 'video:ended', deck: 'A' }).state;
    expect(s6.intent).to.eql('play');
  });
});

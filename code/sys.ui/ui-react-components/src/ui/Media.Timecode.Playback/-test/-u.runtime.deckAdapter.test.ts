import { describe, expect, it, type t } from '../../../-test.ts';
import { Convert } from '../u.convert.ts';
import {
  createPlaybackRuntimeFromDecks,
  createVideoDeckRuntime,
} from '../u.runtime.deckAdapter.ts';
import { TestVideoPlayerSignals } from './u.fixture.ts';

describe('u.deckAdapter', () => {
  it('createVideoDeckRuntime: get + each', () => {
    const A = TestVideoPlayerSignals.make();
    const B = TestVideoPlayerSignals.make();

    const decks = createVideoDeckRuntime({ A, B });

    expect(decks.A).to.equal(A);
    expect(decks.B).to.equal(B);

    expect(decks.get('A')).to.equal(A);
    expect(decks.get('B')).to.equal(B);

    type T = {
      deck: t.TimecodeState.Playback.DeckId;
      signals: t.VideoPlayerSignals;
    };

    const seen: T[] = [];
    decks.each((e) => seen.push(e));

    expect(seen.map((e) => e.deck)).to.eql(['A', 'B']);
    expect(seen[0].signals).to.equal(A);
    expect(seen[1].signals).to.equal(B);
  });

  it('createPlaybackRuntimeFromDecks: play/pause', () => {
    const A = TestVideoPlayerSignals.make();
    const B = TestVideoPlayerSignals.make();
    const decks = createVideoDeckRuntime({ A, B });
    const runtime = createPlaybackRuntimeFromDecks(decks);

    runtime.deck.play('A');
    runtime.deck.pause('A');
    runtime.deck.play('B');
    runtime.deck.pause('B');

    expect(TestVideoPlayerSignals.state(A).played).to.eql(1);
    expect(TestVideoPlayerSignals.state(A).paused).to.eql(1);
    expect(TestVideoPlayerSignals.state(B).played).to.eql(1);
    expect(TestVideoPlayerSignals.state(B).paused).to.eql(1);
  });

  it('createPlaybackRuntimeFromDecks: seek uses default vTime(ms) → secs mapping', () => {
    const A = TestVideoPlayerSignals.make();
    const B = TestVideoPlayerSignals.make();
    const decks = createVideoDeckRuntime({ A, B });
    const runtime = createPlaybackRuntimeFromDecks(decks);

    runtime.deck.seek?.('A', 1500 as t.Msecs);

    const calls = TestVideoPlayerSignals.state(A).jumpTo;
    expect(calls.length).to.eql(1);
    expect(calls[0]).to.eql({ second: 1.5, play: false });
  });

  it('createPlaybackRuntimeFromDecks: seek uses custom mapper', () => {
    const A = TestVideoPlayerSignals.make();
    const B = TestVideoPlayerSignals.make();
    const decks = createVideoDeckRuntime({ A, B });

    const mapper: t.VideoDeckTimeMapper = {
      toPlayerSecs: (e) => {
        const base = Convert.toSecs(e.vTime);
        return (Number(base) + 10) as t.Secs;
      },
    };

    const runtime = createPlaybackRuntimeFromDecks(decks, mapper);
    runtime.deck.seek?.('B', 2000 as t.Msecs);

    const calls = TestVideoPlayerSignals.state(B).jumpTo;
    expect(calls.length).to.eql(1);
    expect(calls[0]).to.eql({ second: 12, play: false });
  });
});

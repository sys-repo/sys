import { describe, expect, it } from '../../../-test.ts';
import { bumpEndedTick } from '../common.ts';
import { createRunner } from '../u.runner.create.ts';
import {
  createPlaybackRuntimeFromDecks,
  createVideoDeckRuntime,
} from '../u.runtime.deckAdapter.ts';
import { flushSignals, TestVideoPlayerSignals, timeline } from './u.fixture.ts';

describe('Playback.endedTick bridge', () => {
  it('endedTick bump → video:ended input → machine ends (active deck)', async () => {
    const A = TestVideoPlayerSignals.make();
    const B = TestVideoPlayerSignals.make();

    const decks = createVideoDeckRuntime({ A, B });
    const runtime = createPlaybackRuntimeFromDecks(decks);
    const runner = createRunner({ runtime });

    runner.send({ kind: 'playback:init', timeline: timeline() });
    expect(runner.get().state.phase).to.eql('active');

    const before = A.props.endedTick.value;
    bumpEndedTick(A.props);
    expect(A.props.endedTick.value).to.eql(before + 1);

    // Allow endedTick bridge effect to run.
    await flushSignals();

    expect(runner.get().state.phase).to.eql('ended');
    runner.dispose();
  });

  it('dispose stops bridge propagation (endedTick no longer advances machine)', async () => {
    const A = TestVideoPlayerSignals.make();
    const B = TestVideoPlayerSignals.make();

    const decks = createVideoDeckRuntime({ A, B });
    const runtime = createPlaybackRuntimeFromDecks(decks);
    const runner = createRunner({ runtime });

    runner.send({ kind: 'playback:init', timeline: timeline() });
    expect(runner.get().state.phase).to.eql('active');

    runner.dispose();

    bumpEndedTick(A.props);

    // Give microtask a chance; must still not advance.
    await flushSignals();

    expect(runner.get().state.phase).to.eql('active');
  });
});

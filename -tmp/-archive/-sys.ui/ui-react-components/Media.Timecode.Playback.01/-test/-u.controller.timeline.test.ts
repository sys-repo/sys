import { describe, expect, it } from '../../../-test.ts';
import { Playback } from '../mod.ts';
import { createTimelineController } from '../u.controller.timeline.ts';
import { createRuntime, timeline } from './u.fixture.ts';

describe('u.timelineController', () => {
  it('play() emits playback:play', () => {
    const { runtime } = createRuntime();
    const runner = Playback.runner({ runtime });
    const ctrl = createTimelineController(runner);

    ctrl.init(timeline());
    ctrl.play();
    expect(runner.get().intent).to.eql('play');
  });

  it('pause() emits playback:pause', () => {
    const { runtime } = createRuntime();
    const runner = Playback.runner({ runtime });
    const ctrl = createTimelineController(runner);

    ctrl.init(timeline());
    ctrl.play();
    ctrl.pause();
    expect(runner.get().intent).to.eql('pause');
  });

  it('toggle() switches based on current intent', () => {
    const { runtime } = createRuntime();
    const runner = Playback.runner({ runtime });
    const ctrl = createTimelineController(runner);

    ctrl.init(timeline());

    ctrl.toggle();
    expect(runner.get().intent).to.eql('play');

    ctrl.toggle();
    expect(runner.get().intent).to.eql('pause');
  });

  it('init(timeline) emits playback:init', () => {
    const { runtime } = createRuntime();
    const runner = Playback.runner({ runtime });
    const ctrl = createTimelineController(runner);

    ctrl.init(timeline());
    expect(runner.get().state.timeline).to.exist;
  });

  it('seekToBeat(index) selects the beat and causes a runtime seek', () => {
    const { runtime, calls } = createRuntime();
    const runner = Playback.runner({ runtime });
    const ctrl = createTimelineController(runner);

    ctrl.init(timeline());
    ctrl.seekToBeat(2);

    expect(runner.get().state.currentBeat).to.eql(2);

    const seekCalls = calls.filter((e) => e.kind === 'seek');
    expect(seekCalls.length).to.be.greaterThan(0);

    const last = seekCalls[seekCalls.length - 1];
    expect(last.vTime).to.eql(2000);
    expect(['A', 'B']).to.include(last.deck);
  });

  it('Law: after ended, seekToBeat() re-arms the machine (phase resets to active)', () => {
    const { runtime, calls } = createRuntime();
    const runner = Playback.runner({ runtime });
    const ctrl = createTimelineController(runner);

    ctrl.init(timeline());
    ctrl.play();

    // Arrange: force runtime reality into ended for the active deck.
    runner.send({ kind: 'video:ended', deck: 'A' });
    expect(runner.get().state.phase).to.eql('ended');

    // Act: user explicitly selects a new beat (restart / re-arm).
    calls.length = 0;
    ctrl.seekToBeat(0);

    // Invariant: navigation must make the machine runnable again.
    expect(runner.get().state.currentBeat).to.eql(0);
    expect(runner.get().state.phase).to.eql('active');

    // And it must have performed a runtime seek (so media layer is aligned).
    const seekCalls = calls.filter((e) => e.kind === 'seek');
    expect(seekCalls.length).to.be.greaterThan(0);

    const lastSeek = seekCalls[seekCalls.length - 1];
    expect(lastSeek.vTime).to.eql(0);

    // Bonus: play must be meaningful again (clock gate depends on phase === 'active').
    calls.length = 0;
    ctrl.play();

    const playCalls = calls.filter((e) => e.kind === 'play');
    expect(playCalls.length).to.be.greaterThan(0);
  });
});

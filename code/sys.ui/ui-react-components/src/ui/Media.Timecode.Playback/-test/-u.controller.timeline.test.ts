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
});

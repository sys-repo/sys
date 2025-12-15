import { describe, expect, it } from '../../../-test.ts';
import { Playback } from '../mod.ts';
import { createTimelineController } from '../u.timelineController.ts';
import { createRuntime, timeline } from './u.fixture.ts';

describe('u.timelineController', () => {
  it('play() emits playback:play', () => {
    const { runtime } = createRuntime();
    const runner = Playback.runner({ runtime });
    const ctrl = createTimelineController(runner);

    ctrl.init(timeline());
    ctrl.play();
    expect(runner.get().intent).to.equal('play');
  });

  it('pause() emits playback:pause', () => {
    const { runtime } = createRuntime();
    const runner = Playback.runner({ runtime });
    const ctrl = createTimelineController(runner);

    ctrl.init(timeline());
    ctrl.play();
    ctrl.pause();
    expect(runner.get().intent).to.equal('pause');
  });

  it('toggle() switches based on current intent', () => {
    const { runtime } = createRuntime();
    const runner = Playback.runner({ runtime });
    const ctrl = createTimelineController(runner);

    ctrl.init(timeline());

    ctrl.toggle();
    expect(runner.get().intent).to.equal('play');

    ctrl.toggle();
    expect(runner.get().intent).to.equal('pause');
  });

  it('init(timeline) emits playback:init', () => {
    const { runtime } = createRuntime();
    const runner = Playback.runner({ runtime });
    const ctrl = createTimelineController(runner);

    ctrl.init(timeline());
    expect(runner.get().state.timeline).to.exist;
  });
});

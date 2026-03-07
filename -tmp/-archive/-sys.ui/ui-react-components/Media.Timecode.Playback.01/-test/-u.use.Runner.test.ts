import { type t, act, describe, expect, it, renderHook, DomMock } from '../../../-test.ts';
import { Playback } from '../mod.ts';
import { createRuntime, timeline } from './u.fixture.ts';

describe('useRunner', () => {
  DomMock.polyfill();

  function expectIsProjected(snapshot: t.PlaybackRunnerHook['snapshot']): void {
    const projected = Playback.project.runnerState(snapshot.state);
    expect(snapshot.phase).to.eql(projected.phase);
    expect(snapshot.intent).to.eql(projected.intent);
    expect(snapshot.currentBeat).to.eql(projected.currentBeat);
    expect(snapshot.decks).to.eql(projected.decks);
  }

  it('exposes an initial snapshot (deterministic init)', () => {
    const { runtime } = createRuntime();
    const { result } = renderHook(() => Playback.useRunner({ runtime }));

    expect(result.current.snapshot).to.have.property('phase');
    expect(result.current.snapshot).to.have.property('intent');
    expectIsProjected(result.current.snapshot);
  });

  it('updates snapshot when sending inputs', () => {
    const { runtime } = createRuntime();
    const { result } = renderHook(() => Playback.useRunner({ runtime }));

    act(() => result.current.send({ kind: 'playback:init', timeline: timeline() }));
    expect(result.current.snapshot.state.timeline).to.exist;
    expectIsProjected(result.current.snapshot);

    act(() => result.current.send({ kind: 'playback:play' }));
    expect(result.current.snapshot.intent).to.equal('play');
    expectIsProjected(result.current.snapshot);
  });

  it('disposes the runner on unmount', () => {
    const { runtime } = createRuntime();
    const { unmount } = renderHook(() => Playback.useRunner({ runtime }));
    expect(() => unmount()).to.not.throw();
  });

  it('recreates the runner when runtime changes', () => {
    const r1 = createRuntime();
    const r2 = createRuntime();

    const hook = renderHook(({ runtime }) => Playback.useRunner({ runtime }), {
      initialProps: { runtime: r1.runtime },
    });

    const s1 = hook.result.current.snapshot;
    hook.rerender({ runtime: r2.runtime });
    const s2 = hook.result.current.snapshot;

    // Identity: new runner snapshot instance.
    expect(s2).to.not.equal(s1);
    expectIsProjected(s2);
  });

  it('recreates the runner when initial changes', () => {
    const { runtime } = createRuntime();

    const initA = Playback.runner({ runtime }).get().state;
    const initB = Playback.runner({ runtime }).get().state; // distinct instance, same shape

    const hook = renderHook(({ initial }) => Playback.useRunner({ runtime, initial }), {
      initialProps: { initial: initA } as const,
    });

    const s1 = hook.result.current.snapshot;
    hook.rerender({ initial: initB });
    const s2 = hook.result.current.snapshot;

    expect(s2).to.not.equal(s1);
    expectIsProjected(s2);
  });
});

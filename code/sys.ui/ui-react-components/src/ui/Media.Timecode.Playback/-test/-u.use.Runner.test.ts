import { act, describe, expect, it, renderHook, DomMock } from '../../../-test.ts';
import { Playback } from '../mod.ts';
import { createRuntime, timeline } from './u.fixture.ts';

describe('useRunner', () => {
  DomMock.polyfill();

  it('creates a runner and exposes initial state', () => {
    const { runtime } = createRuntime();
    const { result } = renderHook(() => Playback.useRunner({ runtime }));

    expect(result.current.snapshot).to.have.property('phase');
    expect(result.current.snapshot).to.have.property('intent');
  });

  it('updates state when sending inputs', () => {
    const { runtime } = createRuntime();
    const { result } = renderHook(() => Playback.useRunner({ runtime }));

    act(() => result.current.send({ kind: 'playback:init', timeline: timeline() }));
    expect(result.current.snapshot.state.timeline).to.exist;

    act(() => result.current.send({ kind: 'playback:play' }));
    expect(result.current.snapshot.intent).to.equal('play');
  });

  it('disposes the runner on unmount', () => {
    const { runtime } = createRuntime();
    const { unmount } = renderHook(() => Playback.useRunner({ runtime }));
    expect(() => unmount()).to.not.throw();
  });

  it('recreates the runner when runtime changes', () => {
    const r1 = createRuntime();
    const r2 = createRuntime();

    const useRunner = Playback.useRunner;
    const initialProps = { runtime: r1.runtime };
    const hook = renderHook(({ runtime }) => useRunner({ runtime }), { initialProps });
    const { result, rerender } = hook;

    const s1 = result.current.snapshot;
    rerender({ runtime: r2.runtime });
    const s2 = result.current.snapshot;

    expect(s2).to.not.equal(s1);
  });
});

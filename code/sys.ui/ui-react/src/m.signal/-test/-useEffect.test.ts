import {
  act,
  afterAll,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  renderHook,
  Testing,
} from '../../-test.ts';
import { Signal } from '../mod.ts';
import { useSignalEffect } from '../u.useEffect.ts';

describe('Signal.useEffect | useSignalEffect (React)', () => {
  DomMock.init(beforeEach, afterAll);

  /**
   * Dead-simple, first-principles test: use `renderHook` with one signal.
   * The effect reads the signal (establishing a dependency) and we capture
   * the observed sequence in `fired`.
   */
  it('basic reactivity (legacy shape preserved)', async () => {
    const { result } = renderHook(() => {
      const s = Signal.useSignal(0);
      const fired: number[] = [];

      useSignalEffect(() => {
        // establish dependency:
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        s.value;
        fired.push(s.value);
      });

      return {
        get fired() {
          return fired.slice();
        },
        inc: () => (s.value += 1),
        clear: () => {
          while (fired.length) fired.pop();
        },
      };
    });

    // Initial mount triggers at least once.
    await Testing.wait();
    expect(result.current.fired.length).to.be.gte(1);

    // Clear so we only assert post-mount changes:
    act(() => result.current.clear());

    // Three distinct re-runs:
    act(() => result.current.inc());
    await Testing.wait();

    act(() => result.current.inc());
    await Testing.wait();

    act(() => result.current.inc());
    await Testing.wait();

    // Tail should be exactly 1,2,3 (allowing any StrictMode double mounts before the clear()).
    expect(result.current.fired.length).to.be.gte(3);
    const tail = result.current.fired.slice(-3);
    expect(tail).to.eql([1, 2, 3]);
  });

  it('lazy lifecycle: no Abortable until e.life is accessed', async () => {
    const { result, unmount } = renderHook(() => {
      const s = Signal.useSignal(0);

      let runs = 0;
      let disposals = 0;
      let touchLife = false;

      useSignalEffect((e) => {
        // establish dependency
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        s.value;
        runs += 1;

        if (touchLife) {
          e.life.dispose$.subscribe(() => (disposals += 1));
        }
      });

      return {
        get runs() {
          return runs;
        },
        get disposals() {
          return disposals;
        },
        inc: () => (s.value += 1),
        touchLifeNow: () => {
          touchLife = true;
        },
      };
    });

    await Testing.wait();
    expect(result.current.runs).to.eql(1);
    expect(result.current.disposals).to.eql(0);

    // Re-run without life used → still no disposal
    act(() => result.current.inc());
    await Testing.wait();
    expect(result.current.runs).to.eql(2);
    expect(result.current.disposals).to.eql(0);

    // Begin touching life:
    act(() => result.current.touchLifeNow());
    act(() => result.current.inc());
    await Testing.wait();
    expect(result.current.runs).to.eql(3);
    expect(result.current.disposals).to.eql(0); // previous run had no life

    // Next change disposes the life created on prior run
    act(() => result.current.inc());
    await Testing.wait();
    expect(result.current.runs).to.eql(4);
    expect(result.current.disposals).to.eql(1);

    unmount();
  });

  it('stable identity within a run, new instance per re-run', async () => {
    const { result, unmount } = renderHook(() => {
      const s = Signal.useSignal(0);
      const ids: unknown[] = [];

      useSignalEffect((e) => {
        // establish dependency
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        s.value;

        // same instance within a single run:
        const a = e.life;
        const b = e.life;
        expect(a).to.equal(b);

        ids.push(a);
      });

      return {
        get lifeIds() {
          return ids.slice();
        },
        inc: () => (s.value += 1),
      };
    });

    await Testing.wait();
    const [first] = result.current.lifeIds;

    act(() => result.current.inc());
    await Testing.wait();
    const [, second] = result.current.lifeIds;

    act(() => result.current.inc());
    await Testing.wait();
    const [, , third] = result.current.lifeIds;

    expect(first).to.not.equal(second);
    expect(second).to.not.equal(third);

    unmount();
  });

  it('disposes on re-run and on unmount (if life was created)', async () => {
    const { result, unmount } = renderHook(() => {
      const s = Signal.useSignal(0);
      let disposals = 0;

      useSignalEffect((e) => {
        // establish dependency and force life creation
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        s.value;
        e.life.dispose$.subscribe(() => (disposals += 1));
      });

      return {
        get disposals() {
          return disposals;
        },
        inc: () => (s.value += 1),
      };
    });

    await Testing.wait();

    act(() => result.current.inc());
    await Testing.wait();
    expect(result.current.disposals).to.eql(1);

    unmount();
    await Testing.wait();
    expect(result.current.disposals).to.eql(2);
  });
});

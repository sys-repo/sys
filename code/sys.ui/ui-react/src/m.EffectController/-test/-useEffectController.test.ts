// file: code/sys.ui/ui-react/src/m.EffectController/-test/-useEffectController.test.ts
import { act, describe, DomMock, expect, it, renderHook } from '../../-test.ts';
import { StdEffectController } from '../common.ts';

// NOTE: monorepo-only test fixture import (not exported/published).
import { createFakeRef } from '../../../../../sys/std/src/m.EffectController/-test/u.fixture.ts';
import { useEffectController } from '../u.useEffectController.ts';

type State = { readonly count?: number };
type Patch = Partial<State>;

describe('useEffectController', () => {
  DomMock.polyfill();

  const create = (initial: State = {}) => {
    const ref = createFakeRef<State>(initial);
    return StdEffectController.create<State, Patch>({ ref });
  };

  const flush = async () => {
    // Flush React effects + state updates.
    await act(async () => await Promise.resolve());
  };

  it('returns undefined when controller is undefined', async () => {
    const { result } = renderHook(() => useEffectController(undefined));
    await flush();
    expect(result.current).to.eql(undefined);
  });

  it('returns current snapshot and updates on change', async () => {
    const ctrl = create({ count: 0 });

    const { result } = renderHook(() => useEffectController(ctrl));
    await flush(); // ensure subscription mounted

    expect(result.current).to.eql({ count: 0 });

    await act(async () => ctrl.next({ count: 1 }));
    await flush();

    expect(result.current).to.eql({ count: 1 });

    ctrl.dispose();
  });

  it('accepts shorthand callback as options', async () => {
    const ctrl = create({ count: 0 });
    const calls: number[] = [];

    renderHook(() =>
      useEffectController(ctrl, (e) => {
        calls.push(e.state.count ?? -1);
      }),
    );
    await flush(); // ensure subscription mounted

    await act(async () => ctrl.next({ count: 1 }));
    await flush();

    await act(async () => ctrl.next({ count: 2 }));
    await flush();

    expect(calls).to.eql([1, 2]);

    ctrl.dispose();
  });

  it('does not call onChange on init by default', async () => {
    const ctrl = create({ count: 0 });
    const calls: number[] = [];

    renderHook(() =>
      useEffectController(ctrl, {
        onChange: (e) => calls.push(e.state.count ?? -1),
      }),
    );
    await flush(); // mount effects

    expect(calls).to.eql([]);

    await act(async () => ctrl.next({ count: 1 }));
    await flush();

    expect(calls).to.eql([1]);

    ctrl.dispose();
  });

  it('fireOnInit calls once on mount and then on subsequent changes', async () => {
    const ctrl = create({ count: 0 });
    const calls: number[] = [];

    renderHook(() =>
      useEffectController(ctrl, {
        fireOnInit: true,
        onChange: (e) => calls.push(e.state.count ?? -1),
      }),
    );
    await flush(); // mount effects → should fire init

    expect(calls).to.eql([0]);

    await act(async () => ctrl.next({ count: 1 }));
    await flush();

    expect(calls).to.eql([0, 1]);

    ctrl.dispose();
  });

  it('switching controller identity resets init gate', async () => {
    const a = create({ count: 1 });
    const b = create({ count: 10 });
    const calls: number[] = [];

    const { rerender } = renderHook(
      ({ ctrl }) =>
        useEffectController(ctrl, {
          fireOnInit: true,
          onChange: (e) => calls.push(e.state.count ?? -1),
        }),
      { initialProps: { ctrl: a } },
    );
    await flush();

    expect(calls).to.eql([1]);

    rerender({ ctrl: b });
    await flush();

    expect(calls).to.eql([1, 10]);

    await act(async () => b.next({ count: 11 }));
    await flush();

    expect(calls).to.eql([1, 10, 11]);

    a.dispose();
    b.dispose();
  });

  it('unmount unsubscribes (no further callbacks)', async () => {
    const ctrl = create({ count: 0 });
    const calls: number[] = [];

    const { unmount } = renderHook(() =>
      useEffectController(ctrl, (e) => calls.push(e.state.count ?? -1)),
    );
    await flush(); // subscription mounted

    await act(async () => ctrl.next({ count: 1 }));
    await flush();

    expect(calls).to.eql([1]);

    unmount();
    await flush();

    await act(async () => ctrl.next({ count: 2 }));
    await flush();

    expect(calls).to.eql([1]);

    ctrl.dispose();
  });
});

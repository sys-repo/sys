import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  renderHook,
} from '../../../-test.ts';
import { StdEffectController } from '../common.ts';

// NOTE: monorepo-only test fixture import (not exported/published).
import { createFakeRef } from '../../../../../../sys/std/src/m.EffectController/-test/u.fixture.ts';
import { useEffectController } from '../u.useEffectController.ts';

type State = { readonly count?: number };
type Patch = Partial<State>;

describe('useEffectController', { sanitizeResources: false, sanitizeOps: false }, () => {
  DomMock.init({ beforeEach, afterEach });

  const create = (initial: State = {}) => {
    const ref = createFakeRef<State>(initial);
    return StdEffectController.create<State, Patch>({ ref });
  };

  const flush = async () => {
    // Flush React effects + state updates (microtask tail).
    await act(async () => {
      await Promise.resolve();
    });
  };

  it('returns undefined when controller is undefined', async () => {
    const { result, unmount } = renderHook(() => useEffectController(undefined));

    try {
      await flush();
      expect(result.current).to.eql(undefined);
    } finally {
      unmount();
      await flush();
    }
  });

  it('returns current snapshot and updates on change', async () => {
    const ctrl = create({ count: 0 });
    const { result, unmount } = renderHook(() => useEffectController(ctrl));

    try {
      await flush(); // ensure subscription mounted

      expect(result.current).to.eql({ count: 0 });

      await act(async () => ctrl.next({ count: 1 }));
      await flush();

      expect(result.current).to.eql({ count: 1 });
    } finally {
      unmount();
      await flush();
      ctrl.dispose();
    }
  });

  it('accepts shorthand callback as options', async () => {
    const ctrl = create({ count: 0 });
    const calls: number[] = [];

    const { unmount } = renderHook(() =>
      useEffectController(ctrl, (e) => {
        calls.push(e.state.count ?? -1);
      }),
    );

    try {
      await flush(); // ensure subscription mounted

      await act(async () => ctrl.next({ count: 1 }));
      await flush();

      await act(async () => ctrl.next({ count: 2 }));
      await flush();

      expect(calls).to.eql([1, 2]);
    } finally {
      unmount();
      await flush();
      ctrl.dispose();
    }
  });

  it('does not call onChange on init by default', async () => {
    const ctrl = create({ count: 0 });
    const calls: number[] = [];

    const { unmount } = renderHook(() =>
      useEffectController(ctrl, {
        onChange: (e) => calls.push(e.state.count ?? -1),
      }),
    );

    try {
      await flush(); // mount effects

      expect(calls).to.eql([]);

      await act(async () => ctrl.next({ count: 1 }));
      await flush();

      expect(calls).to.eql([1]);
    } finally {
      unmount();
      await flush();
      ctrl.dispose();
    }
  });

  it('fireOnInit calls once on mount and then on subsequent changes', async () => {
    const ctrl = create({ count: 0 });
    const calls: number[] = [];

    const { unmount } = renderHook(() =>
      useEffectController(ctrl, {
        fireOnInit: true,
        onChange: (e) => calls.push(e.state.count ?? -1),
      }),
    );

    try {
      await flush(); // mount effects → should fire init

      expect(calls).to.eql([0]);

      await act(async () => ctrl.next({ count: 1 }));
      await flush();

      expect(calls).to.eql([0, 1]);
    } finally {
      unmount();
      await flush();
      ctrl.dispose();
    }
  });

  it('switching controller identity resets init gate', async () => {
    const a = create({ count: 1 });
    const b = create({ count: 10 });
    const calls: number[] = [];

    const { rerender, unmount } = renderHook(
      ({ ctrl }) =>
        useEffectController(ctrl, {
          fireOnInit: true,
          onChange: (e) => calls.push(e.state.count ?? -1),
        }),
      { initialProps: { ctrl: a } },
    );

    try {
      await flush();
      expect(calls).to.eql([1]);

      rerender({ ctrl: b });
      await flush();

      expect(calls).to.eql([1, 10]);

      await act(async () => b.next({ count: 11 }));
      await flush();

      expect(calls).to.eql([1, 10, 11]);
    } finally {
      unmount();
      await flush();
      a.dispose();
      b.dispose();
    }
  });

  it('unmount unsubscribes (no further callbacks)', async () => {
    const ctrl = create({ count: 0 });
    const calls: number[] = [];

    const { unmount } = renderHook(() =>
      useEffectController(ctrl, (e) => calls.push(e.state.count ?? -1)),
    );

    try {
      await flush(); // subscription mounted

      await act(async () => ctrl.next({ count: 1 }));
      await flush();

      expect(calls).to.eql([1]);

      unmount();
      await flush();

      await act(async () => ctrl.next({ count: 2 }));
      await flush();

      expect(calls).to.eql([1]);
    } finally {
      // idempotent: safe even if already unmounted above
      unmount();
      await flush();
      ctrl.dispose();
    }
  });
});

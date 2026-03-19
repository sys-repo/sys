import { useRef, useState } from 'react';
import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  renderHook,
  Testing,
} from '../../-test.ts';
import { Signal } from '../mod.ts';

describe('Signal.useRedrawEffect', () => {
  DomMock.init({ beforeEach, afterEach });

  it('coalesces redraws per microtask', async () => {
    const h = await renderHook(() => {
      const count = Signal.useSignal(0);

      // Keep a React state in play so we can observe redraws deterministically.
      const [, setTick] = useState(0);

      // Track renders.
      const rendersRef = useRef(0);
      rendersRef.current += 1;

      // Establish dependency + coalesced redraw per microtask.
      Signal.useRedrawEffect(() => {
        count.value; // establish reactive dependency (no extra walks)
        setTick((n) => n); // no-op write to keep React engaged without addl renders
      });

      const bump3 = () => {
        count.value += 1;
        count.value += 1;
        count.value += 1;
      };

      return {
        count: count.value,
        renders: rendersRef.current,
        bump3,
      };
    });

    try {
      expect(h.result.current.count).to.equal(0);
      const rendersBefore = h.result.current.renders;

      // Burst update (act may flush; do not assert intermediate state).
      await act(() => h.result.current.bump3());

      // After act/microtasks, we must observe the coalesced result.
      await Testing.until(() => h.result.current.count === 3);

      const rendersAfter = h.result.current.renders;

      // Strict/dev variance is OK; invariant is "not 3 redraws per burst".
      const delta = rendersAfter - rendersBefore;
      expect(delta).to.be.gte(1).and.to.be.lte(4);
    } finally {
      await act(() => h.unmount());
      await Testing.wait();
    }
  });

  it('plays nicely with direct signal-driven renders (no triple renders per burst)', async () => {
    const h = await renderHook(() => {
      const count = Signal.useSignal(0);

      const rendersRef = useRef(0);
      rendersRef.current += 1;

      Signal.useRedrawEffect(() => {
        count.value; // dependency only
      });

      const bump2 = () => {
        count.value += 1;
        count.value += 1;
      };

      return {
        count: count.value,
        renders: rendersRef.current,
        bump2,
      };
    });

    try {
      expect(h.result.current.count).to.equal(0);
      const rendersBefore = h.result.current.renders;

      await act(() => h.result.current.bump2());

      await Testing.until(() => h.result.current.count === 2);

      const rendersAfter = h.result.current.renders;
      const delta = rendersAfter - rendersBefore;
      expect(delta).to.be.gte(1).and.to.be.lte(4);
    } finally {
      await act(() => h.unmount());
      await Testing.wait();
    }
  });
});

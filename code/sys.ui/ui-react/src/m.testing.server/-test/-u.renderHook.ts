import { describe, expect, it } from '../../-test.ts';
import { DomMock, act, renderHook } from '../mod.ts';

describe(
  'renderHook',

  /**
   * NOTE:
   * HappyDOM currently leaves timers around (AsyncTaskManager). This suite intentionally
   * reproduces that environment while ensuring our lazy import is safe.
   */
  { sanitizeOps: false, sanitizeResources: false },

  () => {
    it('lazy-imports @testing-library/react only after DOM is present; act flushes effects', async () => {
      // Critical: do NOT pre-polyfill here. The wrapper must handle it.
      expect((globalThis as any).window).to.equal(undefined);

      const res = await renderHook(() => {
        expect((globalThis as any).window).to.be.ok;

        // Local state via closure → no React imports needed.
        let didRun = false;

        // Schedule a microtask-like change that we will flush via `act`.
        queueMicrotask(() => {
          didRun = true;
        });

        return {
          value: 123,
          didRun: () => didRun,
        };
      });

      expect(res.result.current.value).to.equal(123);
      expect(res.result.current.didRun()).to.equal(false);

      // Flush queued microtasks/effects in the same way callsites do.
      await act(async () => {
        await Promise.resolve();
      });

      expect(res.result.current.didRun()).to.equal(true);

      res.unmount();

      // Keep the global clean for other suites.
      DomMock.unpolyfill();
      expect((globalThis as any).window).to.equal(undefined);
    });
  },
);

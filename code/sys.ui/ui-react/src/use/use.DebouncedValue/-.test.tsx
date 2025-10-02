import { act } from 'react';
import {
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
  renderHook,
  Schedule,
  type t,
} from '../../-test.ts';
import { useDebouncedValue } from './mod.ts';

const sleep = (ms: number) => act(() => Schedule.sleep(ms, 'micro')); // time + micro hop.

describe(
  'useDebouncedValue',
  { sanitizeResources: false, sanitizeOps: false },

  () => {
    DomMock.polyfill();

    it('type: matches t.UseDebouncedValue', () => {
      expectTypeOf(useDebouncedValue).toEqualTypeOf<t.UseDebouncedValue>();
    });

    it('publishes the initial value immediately', () => {
      const { result } = renderHook(
        ({ value, ms = 25 }: { value: unknown; ms?: t.Msecs }) => useDebouncedValue(value, ms),
        { initialProps: { value: 'A', ms: 25 } },
      );
      expect(result.current).to.eql('A');
    });

    it('delays updates until the debounce window elapses', async () => {
      const ms: t.Msecs = 25;
      const { result, rerender } = renderHook(
        ({ value, ms }: { value: unknown; ms: t.Msecs }) => useDebouncedValue(value, ms),
        { initialProps: { value: 'A', ms } },
      );
      expect(result.current).to.eql('A');

      await act(async () => {
        rerender({ value: 'B', ms });
      });

      // Immediately after change, still the prior value
      expect(result.current).to.eql('A');

      await act(async () => {
        await sleep(ms + 5);
      });
      expect(result.current).to.eql('B');
    });

    it('resets the timer on rapid successive changes (latest wins)', async () => {
      const ms: t.Msecs = 30;
      const { result, rerender } = renderHook(
        ({ value, ms }: { value: unknown; ms: t.Msecs }) => useDebouncedValue(value, ms),
        { initialProps: { value: 'A', ms } },
      );
      expect(result.current).to.eql('A');

      await act(async () => {
        rerender({ value: 'B', ms });
      });
      await act(async () => {
        await sleep(ms / 2); // halfway; not published yet
      });
      expect(result.current).to.eql('A');

      await act(async () => {
        rerender({ value: 'C', ms }); // reset timer
      });
      await act(async () => {
        await sleep(ms - 5); // still inside window
      });
      expect(result.current).to.eql('A');

      await act(async () => {
        await sleep(10); // exceed window from last change
      });
      expect(result.current).to.eql('C');
    });

    it('cancels pending timeout on unmount (no stray publishes)', async () => {
      const ms: t.Msecs = 40;
      const { result, rerender, unmount } = renderHook(
        ({ value, ms }: { value: unknown; ms: t.Msecs }) => useDebouncedValue(value, ms),
        { initialProps: { value: 'A', ms } },
      );
      expect(result.current).to.eql('A');

      await act(async () => {
        rerender({ value: 'Z', ms });
      });

      await act(async () => {
        unmount(); // cancel pending debounce
      });

      await act(async () => {
        await sleep(ms + 10);
      });
      // No post-unmount publish
      expect(result.current).to.eql('A');
    });
  },
);

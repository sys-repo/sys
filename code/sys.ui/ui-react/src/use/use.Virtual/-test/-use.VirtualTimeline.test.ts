import {
  type t,
  act,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  renderHook,
  Timecode,
} from '../../../-test.ts';
import { useVirtualTimeline } from '../mod.ts';
import { makeResolved } from './-u.ts';

let ORIG_TO_VT: (spec?: t.TimecodeCompositionSpec) => t.TimecodeResolved;

describe('useVirtualTimeline', () => {
  DomMock.init({ beforeEach, afterEach });

  beforeAll(() => {
    // Save original
    ORIG_TO_VT = (Timecode as any).Composite.toVirtualTimeline;
    // Patch via "any" to bypass readonly typing in tests.
    (Timecode as any).Composite.toVirtualTimeline = (spec: unknown): t.TimecodeResolved => {
      if (spec === 'A') return makeResolved(1_000, 1);
      if (spec === 'B') return makeResolved(2_000, 2);
      return makeResolved(0, 0);
    };
  });

  afterAll(() => {
    // Restore original
    (Timecode as any).Composite.toVirtualTimeline = ORIG_TO_VT;
  });

  it('returns resolved timeline + rev (mount → rev increments once)', async () => {
    const { result, unmount } = renderHook(() => useVirtualTimeline(undefined));
    try {
      await Promise.resolve(); // flush effect
      expect(result.current.rev).to.eql(1);
      expect(result.current.is.valid).to.eql(true);
      expect(result.current.is.empty).to.eql(true);
      expect(result.current.total).to.eql(0);
      expect(result.current.segments.length).to.eql(0);
    } finally {
      act(() => unmount());
    }
  });

  it('rev does not change when resolution is identical', async () => {
    const { result, rerender, unmount } = renderHook(
      (spec?: t.TimecodeCompositionSpec) =>
        // Cast sentinels to the expected type for the hook (test-only).
        useVirtualTimeline(spec),
      { initialProps: 'A' as unknown as t.TimecodeCompositionSpec },
    );
    try {
      await Promise.resolve();
      const rev1 = result.current.rev;
      const total1 = result.current.total;
      const len1 = result.current.segments.length;

      act(() => rerender('A' as unknown as t.TimecodeCompositionSpec));
      await Promise.resolve();

      expect(result.current.rev).to.eql(rev1);
      expect(result.current.total).to.eql(total1);
      expect(result.current.segments.length).to.eql(len1);
    } finally {
      act(() => unmount());
    }
  });

  it('rev increments when the resolved timeline changes', async () => {
    const { result, rerender, unmount } = renderHook(
      (spec?: t.TimecodeCompositionSpec) => useVirtualTimeline(spec),
      { initialProps: 'A' as unknown as t.TimecodeCompositionSpec },
    );
    try {
      await Promise.resolve();
      const revA = result.current.rev;

      act(() => rerender('B' as unknown as t.TimecodeCompositionSpec));
      await Promise.resolve();

      expect(result.current.rev).to.eql(revA + 1);
      expect(result.current.total).to.eql(2_000);
      expect(result.current.segments.length).to.eql(2);
    } finally {
      act(() => unmount());
    }
  });
});

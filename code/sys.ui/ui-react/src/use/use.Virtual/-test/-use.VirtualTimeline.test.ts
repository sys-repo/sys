import {
  type t,
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  renderHook,
} from '../../../-test.ts';
import { useVirtualTimeline } from '../mod.ts';

const specA = [{ src: 'test:a', duration: 1_000 as t.Msecs }] satisfies t.Timecode.Composite.Spec;
const specB = [
  { src: 'test:a', duration: 1_000 as t.Msecs },
  { src: 'test:b', duration: 1_000 as t.Msecs },
] satisfies t.Timecode.Composite.Spec;

describe('useVirtualTimeline', () => {
  DomMock.init({ beforeEach, afterEach });

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
      (spec?: t.Timecode.Composite.Spec) => useVirtualTimeline(spec),
      { initialProps: specA },
    );
    try {
      await Promise.resolve();
      const rev1 = result.current.rev;
      const total1 = result.current.total;
      const len1 = result.current.segments.length;

      act(() => rerender(specA));
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
      (spec?: t.Timecode.Composite.Spec) => useVirtualTimeline(spec),
      { initialProps: specA },
    );
    try {
      await Promise.resolve();
      const revA = result.current.rev;

      act(() => rerender(specB));
      await Promise.resolve();

      expect(result.current.rev).to.eql(revA + 1);
      expect(result.current.total).to.eql(2_000);
      expect(result.current.segments.length).to.eql(2);
    } finally {
      act(() => unmount());
    }
  });
});

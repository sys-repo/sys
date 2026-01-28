import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
  renderHook,
} from '../../-test.ts';
import { useRev } from './mod.ts';

describe('useRev', { sanitizeResources: false, sanitizeOps: false }, () => {
  DomMock.init({ beforeEach, afterEach });

  it('returns a tuple [rev, bump]', () => {
    const { result, unmount } = renderHook(() => useRev());
    const [rev, bump] = result.current;
    expectTypeOf(rev).toEqualTypeOf<number>();
    expectTypeOf(bump).toEqualTypeOf<() => void>();
    unmount();
  });

  it('starts at 0', () => {
    const { result, unmount } = renderHook(() => useRev());
    const [rev] = result.current;
    expect(rev).to.equal(0);
    unmount();
  });

  it('increments by 1 when bump() is called', async () => {
    const { result, unmount } = renderHook(() => useRev('micro'));
    const [, bump] = result.current;

    await act(async () => {
      bump();
      // microtasks resolve before next tick
      await Promise.resolve();
    });

    const [rev] = result.current;
    expect(rev).to.equal(1);
    unmount();
  });

  it('coalesces multiple bump() calls into a single increment within same frame', async () => {
    const { result, unmount } = renderHook(() => useRev('micro'));
    const [, bump] = result.current;

    await act(async () => {
      bump();
      bump();
      bump();
      await Promise.resolve(); // allow microtasks to flush
    });

    const [rev] = result.current;
    expect(rev).to.equal(1); // single coalesced update
    unmount();
  });

  it('accepts mode argument ("micro" | "macro" | "raf")', () => {
    const a = renderHook(() => useRev('micro'));
    const b = renderHook(() => useRev('macro'));
    const c = renderHook(() => useRev('raf'));
    // no throw = valid modes
    expect(true).to.be.true;
    a.unmount();
    b.unmount();
    c.unmount();
  });
});

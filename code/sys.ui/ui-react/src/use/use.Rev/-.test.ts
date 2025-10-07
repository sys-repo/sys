import { act, describe, DomMock, expect, expectTypeOf, it, renderHook } from '../../-test.ts';
import { useRev } from './mod.ts';

describe('useRev', { sanitizeResources: false, sanitizeOps: false }, () => {
  DomMock.polyfill();

  it('returns a tuple [rev, bump]', () => {
    const { result } = renderHook(() => useRev());
    const [rev, bump] = result.current;
    expectTypeOf(rev).toEqualTypeOf<number>();
    expectTypeOf(bump).toEqualTypeOf<() => void>();
  });

  it('starts at 0', () => {
    const { result } = renderHook(() => useRev());
    const [rev] = result.current;
    expect(rev).to.equal(0);
  });

  it('increments by 1 when bump() is called', async () => {
    const { result } = renderHook(() => useRev('micro'));
    const [, bump] = result.current;

    await act(async () => {
      bump();
      // microtasks resolve before next tick
      await Promise.resolve();
    });

    const [rev] = result.current;
    expect(rev).to.equal(1);
  });

  it('coalesces multiple bump() calls into a single increment within same frame', async () => {
    const { result } = renderHook(() => useRev('micro'));
    const [, bump] = result.current;

    await act(async () => {
      bump();
      bump();
      bump();
      await Promise.resolve(); // allow microtasks to flush
    });

    const [rev] = result.current;
    expect(rev).to.equal(1); // single coalesced update
  });

  it('accepts mode argument ("micro" | "macro" | "raf")', () => {
    renderHook(() => useRev('micro'));
    renderHook(() => useRev('macro'));
    renderHook(() => useRev('raf'));
    // no throw = valid modes
    expect(true).to.be.true;
  });
});

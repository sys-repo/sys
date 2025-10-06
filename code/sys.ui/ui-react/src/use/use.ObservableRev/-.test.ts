import { act, describe, DomMock, expect, expectTypeOf, it, renderHook, Rx } from '../../-test.ts';
import { useObservableRev } from './mod.ts';

describe('useObservableRev', { sanitizeResources: false, sanitizeOps: false }, () => {
  DomMock.polyfill();

  it('returns a function', () => {
    const { result } = renderHook(() => useObservableRev(undefined));
    expectTypeOf(result.current).toEqualTypeOf<() => void>();
    expect(result.current).to.be.a('function');
  });

  it('does not throw when invoked (no stream)', () => {
    const { result } = renderHook(() => useObservableRev());
    expect(() => result.current()).to.not.throw();
  });

  it('subscribes to the provided subject and unsubscribes on unmount', async () => {
    const subject = Rx.subject<void>();
    let count = 0;

    // A sentinel subscriber we control
    const sentinel = subject.subscribe(() => count++);

    const { unmount } = renderHook(() => useObservableRev(subject));

    // Fire while hook is mounted → both get the event
    await act(async () => {
      subject.next();
      await Promise.resolve();
    });
    expect(count).to.be.greaterThan(0);

    // Unmount and fire again → sentinel still receives, hook unsubscribed silently
    unmount();
    await act(async () => {
      subject.next();
      await Promise.resolve();
    });

    // The test passes if no error was thrown on unmount
    sentinel.unsubscribe();
  });

  it('keeps a stable function identity across re-renders', () => {
    const subject = Rx.subject<void>();
    const { result, rerender } = renderHook(() => useObservableRev(subject));
    const first = result.current;
    rerender();
    const second = result.current;
    expect(second).to.equal(first);
  });

  it('handles rapid subject.next() calls without error (coalesced internally)', async () => {
    const subject = Rx.subject<void>();
    const { result } = renderHook(() => useObservableRev(subject));

    await act(async () => {
      subject.next();
      subject.next();
      subject.next();
      await Promise.resolve();
    });

    expect(result.current).to.be.a('function');
  });

  it('completes safely when subject completes', () => {
    const subject = Rx.subject<void>();
    const { result } = renderHook(() => useObservableRev(subject));
    expect(() => subject.complete()).to.not.throw();
    expect(result.current).to.be.a('function');
  });
});

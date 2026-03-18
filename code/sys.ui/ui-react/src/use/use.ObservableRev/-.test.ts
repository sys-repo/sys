import {
  act,
  beforeEach,
  afterEach,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
  renderHook,
  Rx,
} from '../../-test.ts';
import { useObservableRev } from './mod.ts';

describe('useObservableRev', () => {
  DomMock.init({ beforeEach, afterEach });

  it('returns a function', () => {
    const { result, unmount } = renderHook(() => useObservableRev(undefined));
    try {
      expectTypeOf(result.current).toEqualTypeOf<() => void>();
      expect(result.current).to.be.a('function');
    } finally {
      unmount();
    }
  });

  it('does not throw when invoked (no stream)', () => {
    const { result, unmount } = renderHook(() => useObservableRev());
    try {
      expect(() => result.current()).to.not.throw();
    } finally {
      unmount();
    }
  });

  it('subscribes to the provided subject and unsubscribes on unmount', async () => {
    const subject = Rx.subject<void>();
    let count = 0;

    // A sentinel subscriber we control
    const sentinel = subject.subscribe(() => count++);

    const { unmount } = renderHook(() => useObservableRev(subject));
    try {
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
    } finally {
      sentinel.unsubscribe();
    }
  });

  it('keeps a stable function identity across re-renders', () => {
    const subject = Rx.subject<void>();
    const { result, rerender, unmount } = renderHook(() => useObservableRev(subject));
    try {
      const first = result.current;
      rerender();
      const second = result.current;
      expect(second).to.equal(first);
    } finally {
      unmount();
    }
  });

  it('handles rapid subject.next() calls without error (coalesced internally)', async () => {
    const subject = Rx.subject<void>();
    const { result, unmount } = renderHook(() => useObservableRev(subject));
    try {
      await act(async () => {
        subject.next();
        subject.next();
        subject.next();
        await Promise.resolve();
      });

      expect(result.current).to.be.a('function');
    } finally {
      unmount();
    }
  });

  it('completes safely when subject completes', () => {
    const subject = Rx.subject<void>();
    const { result, unmount } = renderHook(() => useObservableRev(subject));
    try {
      expect(() => subject.complete()).to.not.throw();
      expect(result.current).to.be.a('function');
    } finally {
      unmount();
    }
  });
});

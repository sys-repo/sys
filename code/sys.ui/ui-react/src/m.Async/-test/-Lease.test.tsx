import { act } from 'react';
import { DomMock, describe, expect, it, renderHook } from '../../-test.ts';
import { Lease } from '../mod.ts';

describe('Async: Lease', () => {
  DomMock.polyfill();

  describe('makeUseLease (hook)', () => {
    it('releases old key and claims new key on key change', () => {
      const lease = Lease.make<string>();
      const useLease = Lease.makeUseLease(lease);

      const { rerender, unmount } = renderHook(
        ({ keyId, token }: { keyId?: string; token: string }) => useLease(keyId, token),
        { initialProps: { keyId: 'A', token: 'T1' } },
      );

      expect(lease.isOwner('A', 'T1')).to.eql(true);

      act(() => {
        rerender({ keyId: 'B', token: 'T2' });
      });
      expect(lease.current('A')).to.eql(undefined);
      expect(lease.isOwner('B', 'T2')).to.eql(true);

      act(() => unmount());
      expect(lease.current('B')).to.eql(undefined);
    });

    it('idempotent on same token re-render (no spurious churn)', () => {
      const lease = Lease.make<string>();
      const useLease = Lease.makeUseLease(lease);
      const KEY = 'k';

      const { rerender, unmount } = renderHook(
        ({ token }: { token: string }) => useLease(KEY, token),
        { initialProps: { token: 'A' } },
      );

      // Re-render with the same token:
      act(() => rerender({ token: 'A' }));

      expect(lease.isOwner(KEY, 'A')).to.eql(true);
      act(() => unmount());
      expect(lease.current(KEY)).to.eql(undefined);
    });

    it('multiple keys are independent', () => {
      const lease = Lease.make<string>();
      const useLease = Lease.makeUseLease(lease);

      const h1 = renderHook(() => useLease('k1', 'A'));
      const h2 = renderHook(() => useLease('k2', 'B'));

      expect(lease.isOwner('k1', 'A')).to.eql(true);
      expect(lease.isOwner('k2', 'B')).to.eql(true);

      act(() => h1.unmount());
      expect(lease.current('k1')).to.eql(undefined);
      expect(lease.isOwner('k2', 'B')).to.eql(true);

      act(() => h2.unmount());
      expect(lease.current('k1')).to.eql(undefined);
      expect(lease.current('k2')).to.eql(undefined);
    });

    it('does nothing when key is undefined/null', () => {
      const lease = Lease.make<string>();
      const useLease = Lease.makeUseLease(lease);

      // undefined key
      const a = renderHook(() => useLease(undefined, 'X'));
      act(() => a.unmount());

      // null key (intentional type violation to assert runtime behavior)
      // @ts-expect-error intentional null
      const b = renderHook(() => useLease(null, 'Y'));
      act(() => b.unmount());

      expect(lease.size).to.eql(0);
    });

    it('does nothing when token is undefined (no claim)', () => {
      const lease = Lease.make<string>();
      const useLease = Lease.makeUseLease(lease);
      const KEY = 'k';

      // Intentionally pass undefined token; no claim should occur.
      const h = renderHook(
        ({ token }: { token?: string }) =>
          // @ts-expect-error: passing possibly undefined token to assert behavior
          useLease(KEY, token),
        { initialProps: { token: undefined } },
      );

      expect(lease.current(KEY)).to.eql(undefined);

      act(() => h.unmount());
      expect(lease.current(KEY)).to.eql(undefined);
    });
  });
});

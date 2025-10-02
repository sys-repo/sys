import TestRenderer, { act } from 'react-test-renderer';

import { type t, describe, expect, it } from '../../-test.ts';
import { Lease } from '../mod.ts';

describe('Async: Lease', () => {
  describe('makeUseLease (hook)', () => {
    it('releases old key and claims new key on key change', () => {
      const lease = Lease.make<string>();
      const useLease = Lease.makeUseLease(lease);

      const Holder: t.FC<{ keyId?: string; token: string }> = ({ keyId, token }) => {
        useLease(keyId, token);
        return null;
      };

      let root: TestRenderer.ReactTestRenderer;
      act(() => (root = TestRenderer.create(<Holder keyId="A" token="T1" />)));
      expect(lease.isOwner('A', 'T1')).to.eql(true);

      act(() => {
        root.update(<Holder keyId="B" token="T2" />);
      });
      expect(lease.current('A')).to.eql(undefined);
      expect(lease.isOwner('B', 'T2')).to.eql(true);

      act(() => root.unmount());
      expect(lease.current('B')).to.eql(undefined);
    });

    it('idempotent on same token re-render (no spurious churn)', () => {
      const lease = Lease.make<string>();
      const useLease = Lease.makeUseLease(lease);
      const KEY = 'k';

      const Probe: t.FC<{ token: string }> = ({ token }) => {
        useLease(KEY, token);
        return null;
      };

      let root: TestRenderer.ReactTestRenderer;
      act(() => (root = TestRenderer.create(<Probe token="A" />)));

      // Re-render with the same token:
      act(() => root.update(<Probe token="A" />));

      expect(lease.isOwner(KEY, 'A')).to.eql(true);
      act(() => root.unmount());
      expect(lease.current(KEY)).to.eql(undefined);
    });

    it('multiple keys are independent', () => {
      const lease = Lease.make<string>();
      const useLease = Lease.makeUseLease(lease);

      const A: t.FC = () => (useLease('k1', 'A'), null);
      const B: t.FC = () => (useLease('k2', 'B'), null);

      let tA!: TestRenderer.ReactTestRenderer;
      let tB!: TestRenderer.ReactTestRenderer;
      act(() => {
        tA = TestRenderer.create(<A />);
        tB = TestRenderer.create(<B />);
      });

      expect(lease.isOwner('k1', 'A')).to.eql(true);
      expect(lease.isOwner('k2', 'B')).to.eql(true);

      act(() => tA.unmount());
      expect(lease.current('k1')).to.eql(undefined);
      expect(lease.isOwner('k2', 'B')).to.eql(true);

      act(() => tB.unmount());
      expect(lease.current('k1')).to.eql(undefined);
      expect(lease.current('k2')).to.eql(undefined);
    });

    it('does nothing when key is undefined/null', () => {
      const lease = Lease.make<string>();
      const useLease = Lease.makeUseLease(lease);

      const ProbeUndef: t.FC = () => {
        useLease(undefined, 'X');
        return null;
      };
      const ProbeNull: t.FC = () => {
        // @ts-expect-error: intentional null for test
        useLease(null, 'Y');
        return null;
      };

      act(() => {
        const a = TestRenderer.create(<ProbeUndef />);
        a.unmount();
        const b = TestRenderer.create(<ProbeNull />);
        b.unmount();
      });

      expect(lease.size).to.eql(0);
    });

    it('does nothing when token is undefined (no claim)', () => {
      const lease = Lease.make<string>();
      const useLease = Lease.makeUseLease(lease);
      const KEY = 'k';

      const Probe: t.FC<{ token?: string }> = ({ token }) => {
        // Intentionally pass an undefined token to ensure no claim occurs.
        // @ts-expect-error - passing possibly undefined token to assert behavior
        useLease(KEY, token);
        return null;
      };

      let root!: TestRenderer.ReactTestRenderer;
      act(() => (root = TestRenderer.create(<Probe token={undefined} />)));

      // No claim should have been made
      expect(lease.current(KEY)).to.eql(undefined);

      act(() => root.unmount());
      expect(lease.current(KEY)).to.eql(undefined);
    });
  });
});

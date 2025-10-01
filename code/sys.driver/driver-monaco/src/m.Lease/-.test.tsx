import TestRenderer, { act } from 'react-test-renderer';
import { describe, expect, it, Rx } from '../-test.ts';
import { Lease } from './mod.ts';


describe('Lease (Mutex)', () => {
  describe('Lease.make', () => {
    it('basic claim/release semantics', () => {
      const lease = Lease.make<string>();

      // Claim key with "A"
      lease.claim('k', 'A');
      expect(lease.isOwner('k', 'A')).to.eql(true);

      // New claim with "B" replaces "A"
      lease.claim('k', 'B');
      expect(lease.isOwner('k', 'A')).to.eql(false);
      expect(lease.isOwner('k', 'B')).to.eql(true);

      // Release with non-owner token is a no-op
      lease.release('k', 'A');
      expect(lease.isOwner('k', 'B')).to.eql(true);

      // Releasing the current token clears the lease
      lease.release('k', 'B');
      expect(lease.current('k')).to.eql(undefined);
    });

    it('tracks number of keys leased', () => {
      const lease = Lease.make<string>();
      expect(lease.size).to.eql(0);

      lease.claim('a', 'A');
      lease.claim('b', 'B');
      expect(lease.size).to.eql(2);

      lease.release('a', 'A');
      expect(lease.size).to.eql(1);

      lease.release('b', 'B');
      expect(lease.size).to.eql(0);
    });
  });

  describe('Lease.guard', () => {
    it('passes events only when the guarded token currently holds the lease', () => {
      const lease = Lease.make<string>();
      const key = 'k';
      const A = 'A';
      const B = 'B';

      const src = Rx.subject<number>();

      const seenA: number[] = [];
      const seenB: number[] = [];

      // Two guarded views over the same source
      const subA = src.pipe(Lease.guard(lease, key, A)).subscribe((v) => seenA.push(v));
      const subB = src.pipe(Lease.guard(lease, key, B)).subscribe((v) => seenB.push(v));

      // No owner yet → nothing passes
      src.next(1);
      expect(seenA).to.eql([]);
      expect(seenB).to.eql([]);

      // A claims → only A sees events
      lease.claim(key, A);
      src.next(2);
      src.next(3);
      expect(seenA).to.eql([2, 3]);
      expect(seenB).to.eql([]);

      // B claims (latest-wins) → only B sees events now
      lease.claim(key, B);
      src.next(4);
      expect(seenA).to.eql([2, 3]); // no more for A
      expect(seenB).to.eql([4]);

      // Release with wrong token is a no-op
      lease.release(key, A);
      src.next(5);
      expect(seenB).to.eql([4, 5]);

      // Release current owner → nothing passes
      lease.release(key, B);
      src.next(6);
      expect(seenA).to.eql([2, 3]);
      expect(seenB).to.eql([4, 5]);

      subA.unsubscribe();
      subB.unsubscribe();
    });

    it('reacts dynamically to ownership changes within a single guarded pipeline', () => {
      const lease = Lease.make<string>();
      const key = 'k';
      const A = 'A';

      const src = Rx.subject<number>();
      const seen: number[] = [];
      const sub = src.pipe(Lease.guard(lease, key, A)).subscribe((v) => seen.push(v));

      // Not owner yet
      src.next(1);
      expect(seen).to.eql([]);

      // Claim → events pass
      lease.claim(key, A);
      src.next(2);
      src.next(3);
      expect(seen).to.eql([2, 3]);

      // Someone else claims → events stop
      lease.claim(key, 'B');
      src.next(4);
      expect(seen).to.eql([2, 3]);

      // Re-claim → events pass again
      lease.claim(key, A);
      src.next(5);
      expect(seen).to.eql([2, 3, 5]);

      sub.unsubscribe();
    });

    it('propagates completion and errors', () => {
      const lease = Lease.make<string>();
      const key = 'k';
      const A = 'A';
      lease.claim(key, A);

      const src = Rx.subject<number>();
      let completed = false;
      let err: unknown = undefined;

      const sub = src
        .pipe(Lease.guard(lease, key, A))
        .subscribe({ complete: () => (completed = true), error: (e) => (err = e) });

      src.complete();
      expect(completed).to.eql(true);
      expect(err).to.eql(undefined);

      // error propagation
      const src2 = Rx.subject<number>();
      let completed2 = false;
      let err2: unknown = undefined;

      const sub2 = src2
        .pipe(Lease.guard(lease, key, A))
        .subscribe({ complete: () => (completed2 = true), error: (e) => (err2 = e) });

      src2.error(new Error('boom'));
      expect(completed2).to.eql(false);
      expect((err2 as Error).message).to.eql('boom');

      sub.unsubscribe();
      sub2.unsubscribe();
    });

    it('multiple keys are independent', () => {
      const lease = Lease.make<string>();
      const k1 = 'k1';
      const k2 = 'k2';
      const A = 'A';
      const B = 'B';

      const src = Rx.subject<number>();
      const seen1: number[] = [];
      const seen2: number[] = [];

      const s1 = src.pipe(Lease.guard(lease, k1, A)).subscribe((v) => seen1.push(v));
      const s2 = src.pipe(Lease.guard(lease, k2, B)).subscribe((v) => seen2.push(v));

      lease.claim(k1, A);
      src.next(1);
      expect(seen1).to.eql([1]);
      expect(seen2).to.eql([]);

      lease.claim(k2, B);
      src.next(2);
      expect(seen1).to.eql([1, 2]);
      expect(seen2).to.eql([2]);

      lease.release(k1, A);
      src.next(3);
      expect(seen1).to.eql([1, 2]); // stopped
      expect(seen2).to.eql([2, 3]); // still flowing

      s1.unsubscribe();
      s2.unsubscribe();
    });
  });

  describe('Lease.makeUseLease (hook)', () => {
  it('claims on mount, releases on unmount', () => {
    const lease = Lease.make<string>();
    const useLease = Lease.makeUseLease(lease);
    const KEY = 'editor-1';
    const TOKEN = 'A';

    const Probe: React.FC = () => {
      useLease(KEY, TOKEN);
      return null;
    };

    // Mount → claims
    let root: TestRenderer.ReactTestRenderer;
    act(() => {
      root = TestRenderer.create(<Probe />);
    });
    expect(lease.isOwner(KEY, TOKEN)).to.eql(true);

    // Unmount → releases (no owner)
    act(() => {
      root.unmount();
    });
    expect(lease.current(KEY)).to.eql(undefined);
  });

  it('latest-wins when two components claim the same key', () => {
    const lease = Lease.make<string>();
    const useLease = Lease.makeUseLease(lease);
    const KEY = 'k';

    const A: React.FC = () => {
      useLease(KEY, 'A');
      return null;
    };
    const B: React.FC = () => {
      useLease(KEY, 'B');
      return null;
    };

    // Mount A first
    let treeA: TestRenderer.ReactTestRenderer;
    act(() => {
      treeA = TestRenderer.create(<A />);
    });
    expect(lease.isOwner(KEY, 'A')).to.eql(true);

    // Mount B after → B takes ownership
    let treeB: TestRenderer.ReactTestRenderer;
    act(() => {
      treeB = TestRenderer.create(<B />);
    });
    expect(lease.isOwner(KEY, 'A')).to.eql(false);
    expect(lease.isOwner(KEY, 'B')).to.eql(true);

    // Unmount B → lease releases (does NOT revert to A; design is latest-wins, no re-claim)
    act(() => {
      treeB.unmount();
    });
    expect(lease.current(KEY)).to.eql(undefined);

    // Unmount A (no-op; it wasn’t owner)
    act(() => {
      treeA.unmount();
    });
    expect(lease.current(KEY)).to.eql(undefined);
  });

  it('does nothing when key is undefined/null', () => {
    const lease = Lease.make<string>();
    const useLease = Lease.makeUseLease(lease);

    const ProbeUndef: React.FC = () => {
      useLease(undefined, 'X');
      return null;
    };
    const ProbeNull: React.FC = () => {
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

  it('re-claim on re-render with a different token (same component)', () => {
    const lease = Lease.make<string>();
    const useLease = Lease.makeUseLease(lease);
    const KEY = 'k';

    const Holder: React.FC<{ token: string }> = ({ token }) => {
      useLease(KEY, token);
      return null;
    };

    let root: TestRenderer.ReactTestRenderer;
    act(() => {
      root = TestRenderer.create(<Holder token="A" />);
    });
    expect(lease.isOwner(KEY, 'A')).to.eql(true);

    // Re-render with B → B takes ownership
    act(() => {
      root.update(<Holder token="B" />);
    });
    expect(lease.isOwner(KEY, 'A')).to.eql(false);
    expect(lease.isOwner(KEY, 'B')).to.eql(true);

    // Unmount → clears
    act(() => {
      root.unmount();
    });
    expect(lease.current(KEY)).to.eql(undefined);
  });
});
});

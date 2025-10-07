import { describe, expect, it } from '../../-test.ts';
import { Rx } from '../common.ts';
import { Lease } from '../mod.ts';

describe('Lease (async/std)', () => {
  describe('make', () => {
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

  describe('guard', () => {
    it('passes events only when the guarded token currently holds the lease', () => {
      const lease = Lease.make<string>();
      const key = 'k';
      const A = 'A';
      const B = 'B';

      const src = Rx.subject<number>();
      const seenA: number[] = [];
      const seenB: number[] = [];

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
      expect(seenA).to.eql([2, 3]);
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
      expect(seen1).to.eql([1, 2]);
      expect(seen2).to.eql([2, 3]);

      s1.unsubscribe();
      s2.unsubscribe();
    });
  });
});

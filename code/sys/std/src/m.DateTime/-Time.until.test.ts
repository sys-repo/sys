import { describe, expect, it } from '../-test.ts';
import { rx } from '../m.Rx/mod.ts';
import { Time } from './mod.ts';

describe('Time.until', () => {
  const now = () => new Date().getTime();

  describe('delay', () => {
    it('completes ← (not disposed)', async () => {
      const { dispose$ } = rx.disposable();
      const startedAt = now();

      let disposeFired = 0;
      let count = 0;
      const time = Time.until(dispose$);
      time.dispose$.subscribe(() => disposeFired++);

      expect(now() - startedAt).to.be.lessThan(8);
      await time.delay(10, () => (count += 1));

      expect(now() - startedAt).to.be.greaterThan(8);
      expect(count).to.eql(1);
      expect(disposeFired).to.eql(0);
      expect(time.disposed).to.eql(false);
    });

    it('does not complete ← (disposed$)', async () => {
      const { dispose, dispose$ } = rx.disposable();

      let disposeFired = 0;
      let count = 0;
      const time = Time.until(dispose$);
      time.dispose$.subscribe(() => disposeFired++);
      expect(time.disposed).to.eql(false);

      const res = time.delay(10, () => (count += 1));
      dispose();

      await res;
      await Time.wait(20);
      expect(count).to.eql(0);
      expect(time.disposed).to.eql(true);
      expect(disposeFired).to.eql(1);
    });

    it('is a disposable', async () => {
      let disposeFired = 0;
      let count = 0;
      const time = Time.until();
      time.dispose$.subscribe(() => disposeFired++);
      expect(time.disposed).to.eql(false);

      const res = time.delay(10, () => (count += 1));
      time.dispose();

      await res;
      await Time.wait(20);
      expect(count).to.eql(0);
      expect(time.disposed).to.eql(true);
      expect(disposeFired).to.eql(1);
    });
  });
});

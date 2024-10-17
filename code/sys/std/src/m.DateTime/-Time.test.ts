import { Time } from '../mod.ts';
import { Testing, describe, expect, it } from '../-test.ts';
import { Duration } from './m.Time.Duration.ts';

describe('Time', () => {
  const calcDiff = (a: Date, b: Date = new Date()) => b.getTime() - a.getTime();

  it('API', () => {
    expect(Time.Duration).to.equal(Duration);
    expect(Time.duration).to.equal(Duration.create);
  });

  describe('Time.delay', () => {
    it('TimeDelayPromise: response structure', () => {
      const res = Time.delay(0);
      expect(typeof res.cancel).to.eql('function');
      expect(res.is).to.eql({ cancelled: false, completed: false, done: false });
      expect(res.timeout).to.eql(0);
      res.cancel();
    });

    it('10ms, ()=>', async () => {
      let fired = 0;
      const startedAt = new Date();
      const res = Time.delay(30, () => fired++);
      expect(fired).to.eql(0);
      expect(res.is).to.eql({ cancelled: false, completed: false, done: false });
      expect(res.timeout).to.eql(30);
      await res;
      expect(fired).to.eql(1);
      expect(calcDiff(startedAt)).to.be.closeTo(30, 40);
      expect(res.is).to.eql({ cancelled: false, completed: true, done: true });
    });

    it('0ms, ()=>', async () => {
      let fired = 0;
      const startedAt = new Date();
      const res = Time.delay(0, () => fired++);
      expect(fired).to.eql(0);
      await res;
      expect(fired).to.eql(1);
      expect(calcDiff(startedAt)).to.be.closeTo(0, 10); // NB: closer to zero.
      expect(res.is).to.eql({ cancelled: false, completed: true, done: true });
      expect(res.timeout).to.eql(0);
    });

    it('()=> | ← handler only, defaults to 0:msecs', async () => {
      let fired = 0;
      const startedAt = new Date();
      const res = Time.delay(() => fired++);
      expect(fired).to.eql(0);
      await res;
      expect(fired).to.eql(1);
      expect(calcDiff(startedAt)).to.be.closeTo(0, 10); // NB: closer to zero.
      expect(res.is).to.eql({ cancelled: false, completed: true, done: true });
      expect(res.timeout).to.eql(0);
    });

    it('cancel', async () => {
      let fired = 0;
      const res = Time.delay(5, () => fired++);
      res.cancel();

      await Testing.wait(20);
      expect(fired).to.eql(0); // NB: not fired.
      expect(res.is).to.eql({ cancelled: true, completed: false, done: true });
    });
  });

  describe('Time.wait', () => {
    it('Time.wait( n ) ← number/msecs param', async () => {
      const startedAt = new Date();
      expect(calcDiff(startedAt)).to.be.closeTo(0, 10);

      const res = Time.wait(15);
      await res;

      expect(res.timeout).to.eql(15);
      expect(calcDiff(startedAt)).to.be.greaterThan(14);
      expect(res.is).to.eql({ completed: true, cancelled: false, done: true });
    });

    it('Time.wait() ← no param', async () => {
      const startedAt = new Date();
      expect(calcDiff(startedAt)).to.be.closeTo(0, 10);

      const res = Time.wait();
      await res;

      expect(res.timeout).to.eql(0);
      expect(calcDiff(startedAt)).to.be.lessThan(10);
    });

    it('Time.wait → cancel', () => {
      const startedAt = new Date();
      const res = Time.wait(15);
      res.cancel();
      expect(calcDiff(startedAt)).to.be.closeTo(0, 5); // NB: cancel stops the delay.
      expect(res.is).to.eql({ completed: false, cancelled: true, done: true });
    });

    it('NB: microtask ← via Promise', async () => {
      await Promise.resolve();
    });
  });
});

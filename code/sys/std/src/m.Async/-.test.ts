import { describe, expect, it, Testing } from '../-test.ts';
import { Async, Time } from '../mod.ts';

describe('Async', () => {
  it('exposes the Time.delay function', () => {
    expect(Async.delay).to.equal(Time.delay);
  });

  describe('retry', () => {
    const testSetup = (options: { failWhenLessThanCount?: number } = {}) => {
      const { failWhenLessThanCount } = options;
      let count = 0;
      const fn = () => {
        count++;
        if (typeof failWhenLessThanCount === 'number' && count <= failWhenLessThanCount) {
          throw new Error('foo');
        }
        return count;
      };
      return {
        fn,
        get count() {
          return count;
        },
      };
    };

    it('works first time', async () => {
      const test = testSetup();
      const res1 = await Async.retry(test.fn);
      const res2 = await Async.retry(async () => {
        await Testing.wait(0);
        return test.fn();
      });
      expect(res1).to.eql(1);
      expect(res2).to.eql(2); // NB: async response.
    });

    it('fails twice, then works', async () => {
      const test = testSetup({ failWhenLessThanCount: 2 });
      const res = await Async.retry(test.fn, { maxTimeout: 100, minTimeout: 10 });
      expect(res).to.eql(3);
    });
  });
});

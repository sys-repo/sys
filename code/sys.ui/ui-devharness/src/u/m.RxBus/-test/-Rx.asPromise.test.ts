import { Rx, describe, expect, it } from '../../../-test.ts';
import { RxBus } from '../mod.ts';
import { asPromise } from '../u.promise.ts';

describe('RxBus.asPromise', () => {
  type E = { type: 'foo'; payload: { count: number } };

  it('API', () => {
    expect(RxBus.asPromise).to.equal(asPromise);
  });

  describe('first', () => {
    it('resolves first response', async () => {
      const $ = new Rx.Subject<E>();
      const promise = RxBus.asPromise.first(RxBus.payload<E>($, 'foo'));

      $.next({ type: 'foo', payload: { count: 1 } });
      $.next({ type: 'foo', payload: { count: 2 } });
      $.next({ type: 'foo', payload: { count: 3 } });

      const res = await promise;
      expect(res.payload).to.eql({ count: 1 });
      expect(res.error).to.eql(undefined);
    });

    it('error: completed observable', async () => {
      const $ = new Rx.Subject<E>();
      $.complete();

      const res = await RxBus.asPromise.first(RxBus.payload<E>($, 'foo'));

      expect(res.payload).to.eql(undefined);
      expect(res.error?.code).to.eql('completed');
      expect(res.error?.message).to.include('The given observable has already "completed"');
    });

    it('error: timeout', async () => {
      const $ = new Rx.Subject<E>();
      const res = await RxBus.asPromise.first(RxBus.payload<E>($, 'foo'), { timeout: 10 });
      expect(res.payload).to.eql(undefined);
      expect(res.error?.code).to.eql('timeout');
      expect(res.error?.message).to.include('Timed out after 10 msecs');
    });

    it('error: timeout ("op")', async () => {
      const op = 'foobar';
      const $ = new Rx.Subject<E>();
      const res = await RxBus.asPromise.first(RxBus.payload<E>($, 'foo'), { op, timeout: 10 });
      expect(res.payload).to.eql(undefined);
      expect(res.error?.code).to.eql('timeout');
      expect(res.error?.message).to.include('Timed out after 10 msecs');
      expect(res.error?.message).to.include(`[${op}]`);
    });
  });
});

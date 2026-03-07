import { describe, expect, it } from '../../-test.ts';
import { Await, maybeWait, semaphore } from '../../m.Async.Await/mod.ts';
import { Schedule } from '../../m.Async.Schedule/mod.ts';
import { Lease } from '../m.Lease.ts';

describe(`Async`, () => {
  it('API', async () => {
    const m = await import('@sys/std/async');
    expect(m.Schedule).to.equal(Schedule);
    expect(m.Await).to.equal(Await);
    expect(m.Await.semaphore).to.equal(semaphore);
    expect(m.Await.maybeWait).to.equal(maybeWait);
    expect(m.Lease).to.equal(Lease);
  });
});

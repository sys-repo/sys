import { describe, expect, it } from '../../-test.ts';
import { Await, maybeWait, semaphore } from '../mod.ts';

describe('Async.Await', () => {
  it('API', async () => {
    const m = await import('@sys/std/async');
    expect(m.Await).to.equal(Await);
    expect(m.Await.semaphore).to.equal(semaphore);
    expect(m.Await.maybeWait).to.equal(maybeWait);
  });
});

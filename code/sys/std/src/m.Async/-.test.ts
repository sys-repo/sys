import { describe, expect, it } from '../-test.ts';
import { Promise, maybeWait } from '../m.Async.Promise/mod.ts';
import { Schedule } from '../m.Async.Schedule/mod.ts';

describe(`Async`, () => {
  it('API', async () => {
    const m = await import('@sys/std/async');
    expect(m.Schedule).to.equal(Schedule);
    expect(m.Promise).to.equal(Promise);
    expect(m.maybeWait).to.equal(maybeWait);
  });
});

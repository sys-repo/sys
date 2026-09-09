import { describe, expect, it } from '../../-test.ts';
import { Is as BaseIs } from '../../m.Is/mod.ts';
import { Is } from '../mod.ts';

describe('Is (server runtime)', () => {
  it('API', async () => {
    const m = await import('@sys/std/is/server');

    expect(m.Is).to.equal(Is);
    expect(Is.object).to.equal(BaseIs.object);
    expect(Is.promise).to.equal(BaseIs.promise);
    expect(Is.error).to.equal(BaseIs.error);
  });
});

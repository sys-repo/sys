import { type t, describe, expect, it } from '../../-test.ts';
import { Try } from '../../m.Try/mod.ts';
import { Err } from '../mod.ts';

describe('Error', () => {
  it('API', async () => {
    const m = await import('@sys/std/error');
    expect(Err.Try).to.equal(Try);
    expect(m.Err).to.equal(Err);
    expect(m.Try).to.equal(Try);
  });
});

import { type t, describe, it, expect, expectTypeOf } from '../../-test.ts';

describe('Async', () => {
  it('API', async () => {
    const m = await import('@sys/std/async');
  });
});

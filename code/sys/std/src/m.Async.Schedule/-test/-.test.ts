import { describe, expect, it } from '../../-test.ts';
import { Schedule } from '../mod.ts';

describe('Schedule', () => {
  it('public export → canonical Schedule identity', async () => {
    const module = await import('@sys/std/async');
    expect(module.Schedule).to.equal(Schedule);
  });
});

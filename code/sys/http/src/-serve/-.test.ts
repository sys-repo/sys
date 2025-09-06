import { describe, expect, it } from '../-test.ts';
import { start } from './mod.ts';

describe('@sys/http/serve', () => {
  it('API', async () => {
    const m = await import('@sys/http/serve');
    expect(m.start).to.equal(start);
  });
});

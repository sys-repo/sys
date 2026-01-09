import { Testing, describe, expect, it } from '../../../-test.ts';
import { Preload } from '../mod.ts';

describe('Http.Preload', () => {
  it('API', async () => {
    const m = await import('@sys/http/client');
    expect(m.Preload).to.equal(Preload);
    expect(m.HttpClient.Preload).to.equal(Preload);
    expect(m.Http.Preload).to.equal(Preload);
  });
});

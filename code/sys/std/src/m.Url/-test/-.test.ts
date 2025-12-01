import { describe, expect, it } from '../../-test.ts';
import { JsrUrl } from '../../m.Url.Jsr/mod.ts';
import { Url } from '../mod.ts';

describe('Url', () => {
  it('API', async () => {
    const m = await import('@sys/std/url');
    expect(m.Url).to.equal(Url);
    expect(m.JsrUrl).to.equal(JsrUrl);
  });
});

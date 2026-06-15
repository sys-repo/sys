import { describe, expect, it, JsrUrl, print } from './common.ts';

describe('JsrUrl', () => {
  it('API', async () => {
    const m = await import('@sys/std/url');
    expect(m.JsrUrl).to.equal(JsrUrl);
  });

  it('origin', () => {
    expect(JsrUrl.origin).to.eql('https://jsr.io');
    print('JsrUrl.origin', JsrUrl.origin);
  });
});

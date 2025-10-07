import { describe, expect, it } from '../-test.ts';
import { Cache, Fetch, Http, HttpClient } from './mod.ts';

describe('HTTP Client', () => {
  it('API', async () => {
    const m = await import('@sys/http/client');
    expect(m.Http).to.equal(Http);
    expect(m.HttpClient).to.equal(HttpClient);
    expect(Http).to.equal(HttpClient);

    expect(m.Cache).to.equal(Cache);
    expect(m.Fetch).to.equal(Fetch);
  });
});

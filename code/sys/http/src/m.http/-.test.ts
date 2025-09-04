import { describe, expect, it } from '../-test.ts';
import { Cache, Fetch, Http, HttpClient, HttpServer } from './mod.ts';

describe(`Http (universal)`, () => {
  it('API', async () => {
    const m = await import('@sys/http');

    expect(m.Http).to.equal(Http);
    expect(m.HttpClient).to.equal(HttpClient);
    expect(m.HttpServer).to.equal(HttpServer);
    expect(m.Fetch).to.equal(Fetch);
    expect(m.Cache).to.equal(Cache);
  });

  it('Http (lib)', () => {
    expect(Http.Client).to.equal(HttpClient);
    expect(Http.Server).to.equal(HttpServer);
  });
});

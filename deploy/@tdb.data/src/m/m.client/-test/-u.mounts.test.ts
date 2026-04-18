import { afterEach, describe, expect, it } from '../../../-test.ts';
import { SlugMounts } from '../../m.Mounts/mod.ts';
import { DataClient } from '../mod.ts';

describe('DataClient.Mounts.load', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('valid doc → ok', async () => {
    globalThis.fetch = async () =>
      new Response(SlugMounts.stringify({ mounts: [{ mount: 'sample-1' }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

    const res = await DataClient.Mounts.load('http://example.com/data/');
    expect(res).to.eql({
      ok: true,
      value: { mounts: [{ mount: 'sample-1' }] },
    });
  });

  it('invalid doc → schema error', async () => {
    globalThis.fetch = async () =>
      new Response('{"mounts":[{"mount":"bad/mount"}]}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

    const res = await DataClient.Mounts.load('http://example.com/data/');
    expect(res.ok).to.eql(false);
    if (res.ok) return;
    expect(res.error.kind).to.eql('schema');
    expect(res.error.message).to.include('Mount index failed @sys/schema validation');
  });

  it('404 → empty mounts doc', async () => {
    globalThis.fetch = async () => new Response('Not Found', { status: 404, statusText: 'Not Found' });

    const res = await DataClient.Mounts.load('http://example.com/data/');
    expect(res).to.eql({
      ok: true,
      value: { mounts: [] },
    });
  });

  it('520 non-local parse failure → http error', async () => {
    globalThis.fetch = async () =>
      new Response('<html><body>fallback</body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });

    const res = await DataClient.Mounts.load('http://example.com/data/');
    expect(res.ok).to.eql(false);
    if (res.ok) return;
    expect(res.error.kind).to.eql('http');
  });

  it('520 localhost mounts fallback → empty mounts doc', async () => {
    globalThis.fetch = async () =>
      new Response('<html><body>fallback</body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });

    const res = await DataClient.Mounts.load('http://localhost:1234/data/');
    expect(res).to.eql({
      ok: true,
      value: { mounts: [] },
    });
  });
});

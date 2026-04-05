import { afterEach, describe, expect, it } from '../../../-test.ts';
import { SlcMounts } from '../../m.Mounts/mod.ts';
import { DataClient } from '../mod.ts';

describe('DataClient.Mounts.load', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('valid doc → ok', async () => {
    globalThis.fetch = async () =>
      new Response(SlcMounts.stringify({ mounts: [{ mount: 'sample-1' }] }), {
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
});

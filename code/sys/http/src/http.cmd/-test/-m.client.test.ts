import { describe, expect, it, Json, type t } from '../../-test.ts';
import { HttpCmd } from '../mod.ts';
import type { FixtureName, FixturePayload, FixtureResult } from './t.ts';
import { abortableFetch, expectFailure, fetchFor, NS, options, POLICY, URL } from './u.fixture.ts';

describe('HttpCmd.client', () => {
  it('runs typed unary Cmd roundtrips over HTTP JSON', async () => {
    const client = clientFor(HttpCmd.handler(options()));
    try {
      expect(await client.send('fixture.echo', { text: 'client', suffix: ' ok' })).to.eql({
        text: 'client ok',
      });
    } finally {
      client.dispose();
    }
  });

  it('sanitizes remote errors without command metadata', async () => {
    const client = clientFor(HttpCmd.handler(options()));
    try {
      const err = await expectFailure(
        () => client.send('fixture.fail', { message: 'remote boom' }),
        'remote',
      );
      expect(err.status).to.eql(500);
    } finally {
      client.dispose();
    }
  });

  for (const body of ['not-json', Json.stringify({ ok: true }), '']) {
    it(`rejects invalid response body ${Json.stringify(body, 0)}`, async () => {
      const client = HttpCmd.client({
        url: URL,
        policy: POLICY,
        fetch: () => Promise.resolve(new Response(body, { status: 404 })),
      });
      try {
        const error = await expectFailure(() => client.send('fixture.echo', {}), 'protocol');
        expect(error.status).to.eql(404);
      } finally {
        client.dispose();
      }
    });
  }

  it('times out active requests and forwards cancellation', async () => {
    const transport = abortableFetch();
    const client = HttpCmd.client({
      url: URL,
      policy: { ...POLICY, timeout: 10 },
      fetch: transport.fetch,
    });
    try {
      await expectFailure(() => client.send('fixture.echo', {}), 'timeout');
      expect(await transport.aborted).to.eql('timeout');
    } finally {
      client.dispose();
    }
  });

  it('disposes active requests and rejects future sends before dispatch', async () => {
    const transport = abortableFetch();
    const client = HttpCmd.client({ url: URL, policy: POLICY, fetch: transport.fetch });
    const pending = client.send('fixture.echo', {});
    client.dispose();
    await expectFailure(() => pending, 'disposed');
    expect(await transport.aborted).to.eql('disposed');
    await expectFailure(() => client.send('fixture.echo', {}), 'disposed', 'not-dispatched');
  });
});

function clientFor(
  handler: t.HttpCmd.RequestHandler,
): t.HttpCmd.Client<FixtureName, FixturePayload, FixtureResult> {
  return HttpCmd.client({ url: URL, ns: NS, policy: POLICY, fetch: fetchFor(handler) });
}

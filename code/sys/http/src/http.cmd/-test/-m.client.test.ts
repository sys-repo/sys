import { describe, expect, it, Json, type t } from '../../-test.ts';
import { HttpCmd } from '../mod.ts';
import {
  abortableFetch,
  expectCmdError,
  fetchFor,
  NS,
  options,
  URL,
  type FixtureName,
  type FixturePayload,
  type FixtureResult,
} from './u.fixture.ts';

describe('HttpCmd.client', () => {
  it('runs typed unary Cmd roundtrips over HTTP JSON', async () => {
    const handler = HttpCmd.handler(options());
    const client = HttpCmd.client<FixtureName, FixturePayload, FixtureResult>({
      url: URL,
      ns: NS,
      fetch: fetchFor(handler),
    });

    try {
      const res = await client.send('fixture.echo', { text: 'client', suffix: ' ok' });
      expect(res).to.eql({ text: 'client ok' });
    } finally {
      client.dispose();
    }
  });

  it('maps Cmd result errors to CmdError.Remote', async () => {
    const client = clientFor(HttpCmd.handler(options()));

    try {
      const err = await expectCmdError(
        () => client.send('fixture.fail', { message: 'remote boom' }),
        'CmdError.Remote',
      );
      expect(err.message).to.eql('remote boom');
      expect(err.ns).to.eql(NS);
      expect(err.cmd?.name).to.eql('fixture.fail');
    } finally {
      client.dispose();
    }
  });

  it('maps malformed response JSON to CmdError.Remote', async () => {
    const client = HttpCmd.client<FixtureName, FixturePayload, FixtureResult>({
      url: URL,
      ns: NS,
      fetch: async () => new Response('not-json', { status: 200 }),
    });

    try {
      const err = await expectCmdError(
        () => client.send('fixture.echo', { text: 'x' }),
        'CmdError.Remote',
      );
      expect(err.message.startsWith('HTTP Cmd response was not JSON:')).to.eql(true);
    } finally {
      client.dispose();
    }
  });

  it('maps non-Cmd response JSON to CmdError.Remote', async () => {
    const client = HttpCmd.client<FixtureName, FixturePayload, FixtureResult>({
      url: URL,
      ns: NS,
      fetch: async () => new Response(Json.stringify({ ok: true }), { status: 200 }),
    });

    try {
      const err = await expectCmdError(
        () => client.send('fixture.echo', { text: 'x' }),
        'CmdError.Remote',
      );
      expect(err.message).to.eql('HTTP Cmd response was not a Cmd result.');
    } finally {
      client.dispose();
    }
  });

  it('maps HTTP failures to CmdError.Remote', async () => {
    const client = HttpCmd.client<FixtureName, FixturePayload, FixtureResult>({
      url: URL,
      ns: NS,
      fetch: async () => new Response('nope', { status: 404, statusText: 'Not Found' }),
    });

    try {
      const err = await expectCmdError(
        () => client.send('fixture.echo', { text: 'x' }),
        'CmdError.Remote',
      );
      expect(err.message).to.eql('HTTP Cmd request failed: 404 Not Found');
    } finally {
      client.dispose();
    }
  });

  it('times out active requests as CmdError.Timeout', async () => {
    const transport = abortableFetch();
    const client = HttpCmd.client<FixtureName, FixturePayload, FixtureResult>({
      url: URL,
      ns: NS,
      timeout: 1,
      fetch: transport.fetch,
    });

    try {
      const err = await expectCmdError(
        () => client.send('fixture.echo', { text: 'slow' }),
        'CmdError.Timeout',
      );
      expect(err.message).to.eql('Command "fixture.echo" timed out after 1ms.');
      expect(await transport.aborted).to.eql('timeout');
    } finally {
      client.dispose();
    }
  });

  it('aborts active requests when disposed as CmdError.ClientDisposed', async () => {
    const transport = abortableFetch();
    const client = HttpCmd.client<FixtureName, FixturePayload, FixtureResult>({
      url: URL,
      ns: NS,
      fetch: transport.fetch,
    });

    const pending = client.send('fixture.echo', { text: 'slow' });
    client.dispose();

    const err = await expectCmdError(() => pending, 'CmdError.ClientDisposed');
    expect(err.message).to.eql('Command client disposed before response.');
    expect(await transport.aborted).to.eql('sys.http.cmd.client.dispose');
  });

  it('rejects sends after disposal as CmdError.ClientDisposed', async () => {
    const client = clientFor(HttpCmd.handler(options()));
    client.dispose();

    const err = await expectCmdError(
      () => client.send('fixture.echo', { text: 'late' }),
      'CmdError.ClientDisposed',
    );
    expect(err.message).to.eql('Command client is disposed.');
  });
});

function clientFor(handler: t.HttpCmd.RequestHandler): t.HttpCmd.Client<
  FixtureName,
  FixturePayload,
  FixtureResult
> {
  return HttpCmd.client<FixtureName, FixturePayload, FixtureResult>({
    url: URL,
    ns: NS,
    fetch: fetchFor(handler),
  });
}

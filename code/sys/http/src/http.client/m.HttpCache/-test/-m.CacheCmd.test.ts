import { type t, describe, expect, it } from '../../../-test.ts';

import { CacheCmd } from '../m.CacheCmd.ts';
import { Cache } from '../mod.ts';

describe('Http.Cache.Cmd', () => {
  it('API', () => {
    expect(Cache.Cmd).to.equal(CacheCmd);
  });

  it('constants', () => {
    expect(CacheCmd.NS).to.eql('http.cache');
    expect(CacheCmd.CONNECT).to.eql('http.cache.cmd.connect');
    expect(CacheCmd.CLEAR).to.eql('http.cache.clear');
    expect(typeof CacheCmd.Handlers.clear).to.eql('function');
  });

  it('make: unary command algebra', async () => {
    const cmd = CacheCmd.make();
    const { port1, port2 } = new MessageChannel();

    const host = cmd.host(port1, {
      'http.cache.clear': (e) => {
        const deleted = e.scope === 'all' ? ['a', 'b', 'c'] : ['a', 'b'];
        return {
          ok: true,
          deleted,
          total: deleted.length,
          at: 123 as t.Msecs,
        };
      },
    });

    const client = cmd.client(port2);
    const result = await client.send(CacheCmd.CLEAR, { scope: 'pkg' });

    expect(result.ok).to.eql(true);
    expect(result.deleted).to.eql(['a', 'b']);
    expect(result.total).to.eql(2);
    expect(result.at).to.eql(123);

    client.dispose();
    host.dispose();
  });

  it('listen: hosts clear command from handshake', async () => {
    const { port1: target, port2: sender } = new MessageChannel();
    const { port1: clientEndpoint, port2: hostEndpoint } = new MessageChannel();

    const life = CacheCmd.listen({
      target,
      silent: true,
      clear: ({ scope }) => {
        const deleted = scope === 'all' ? ['x', 'y', 'z'] : ['x'];
        return { ok: true, deleted, total: deleted.length, at: Date.now() };
      },
    });

    sender.postMessage({ kind: CacheCmd.CONNECT }, [hostEndpoint]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const client = CacheCmd.make().client(clientEndpoint);
    const result = await client.send(CacheCmd.CLEAR, { scope: 'all' });

    expect(result.ok).to.eql(true);
    expect(result.deleted).to.eql(['x', 'y', 'z']);
    expect(result.total).to.eql(3);
    expect(typeof result.at).to.eql('number');

    client.dispose();
    life.dispose();
    target.close();
    sender.close();
    clientEndpoint.close();
  });
});

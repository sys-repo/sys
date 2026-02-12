import { type t, describe, it, expect, Testing } from '../../../-test.ts';

import { Cache } from '../mod.ts';
import { CacheCmd } from '../m.CacheCmd.ts';

describe('Http.Cache.Cmd', () => {
  it('API', () => {
    expect(Cache.Cmd).to.equal(CacheCmd);
  });

  it('constants', () => {
    expect(CacheCmd.NS).to.eql('http.cache');
    expect(CacheCmd.CLEAR).to.eql('http.cache.clear');
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
});

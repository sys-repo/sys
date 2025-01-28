import { type t, describe, expect, it } from '../-test.ts';
import { Http, pkg } from './common.ts';
import { testSetup } from '../-test.ts';

describe('DenoCloud (Server)', () => {
  it('server: start → req/res → dispose', async () => {
    const test = testSetup();
    const fetch = Http.fetch();

    const res = await fetch.json<t.RootResponse>(test.url.base);
    expect(res.status).to.eql(200);

    const body = res.data;
    expect(body?.pkg.name).to.eql(pkg.name);
    expect(body?.pkg.version).to.eql(pkg.version);

    await test.dispose();
  });

  describe('middleware', () => {
    it('auth: disabled', async () => {
      const test = testSetup();
      const { client, log, dispose } = test;
      expect(log.count).to.eql(0);

      await client.info();
      expect(log.count).to.eql(1);
      expect(log.items[0].status).to.eql('Skipped:Disabled');

      await dispose();
    });

    it('auth: enabled → allowed path', async () => {
      const test = testSetup({ authEnabled: true });
      const { client, log, dispose } = test;
      expect(log.count).to.eql(0);

      await client.info();
      expect(log.count).to.eql(1);
      expect(log.items[0].status).to.eql('Skipped:Allowed');

      await dispose();
    });
  });
});

import { describe, expect, it } from '../../../-test.ts';
import { startServer } from '../mod.ts';
import { Fixture } from '../../-test/u.ts';

describe('serve server lifecycle', () => {
  it('startServer: starts a reusable local server context', async () => {
    const dir = await Fixture.makeTempDir('serve-start');
    await Fixture.writeFile(dir, 'index.html', '<!doctype html><h1>hello</h1>');

    const context = startServer({ name: 'Test Site', dir }, { host: 'local', silent: true });
    try {
      expect(context.host).to.eql('local');
      expect(context.hostname).to.eql('127.0.0.1');
      expect(context.baseUrl).to.match(/^http:\/\/localhost:\d+$/);

      const res = await fetch(`${context.baseUrl}/`);
      expect(res.status).to.eql(200);
      expect(await res.text()).to.contain('hello');
    } finally {
      await context.close();
    }
  });
});

import { describe, expect, expectError, it, type t } from '../../-test.ts';
import { Serve } from '../mod.ts';
import { Fixture } from './u.ts';

describe('Serve.start', () => {
  it('starts a silent closeable server from owner YAML', async () => {
    const cwd = await Fixture.makeTempDir('serve-start-api');
    await Fixture.writeFile(cwd, 'site/index.html', '<!doctype html><h1>hello</h1>');
    await Fixture.writeFile(cwd, '-config/@sys.tools.serve/site.yaml', 'name: Site\ndir: ./site\n');

    const server = await Serve.start({
      cwd,
      config: '-config/@sys.tools.serve/site.yaml',
      port: 0,
    });
    try {
      expect(server.ok).to.eql(true);
      expect(server.cwd).to.eql(cwd);
      expect(server.config).to.eql(`${cwd}/-config/@sys.tools.serve/site.yaml`);
      expect(server.location.name).to.eql('Site');
      expect(server.location.dir).to.eql(`${cwd}/site`);
      expect(server.host).to.eql('local');
      expect(server.hostname).to.eql('127.0.0.1');
      expect(server.baseUrl).to.match(/^http:\/\/localhost:\d+$/);
      expect(server.url).to.eql(`${server.baseUrl}/`);

      const res = await fetch(server.url);
      expect(res.status).to.eql(200);
      expect(await res.text()).to.contain('hello');
    } finally {
      await server.close();
      await server.finished;
    }
  });

  it('supports explicit network host and idempotent close', async () => {
    const cwd = await Fixture.makeTempDir('serve-start-api-network');
    await Fixture.writeFile(cwd, 'site/index.html', '<!doctype html><h1>network</h1>');
    await Fixture.writeFile(cwd, '-config/@sys.tools.serve/site.yaml', 'name: Site\ndir: ./site\n');

    const server = await Serve.start({
      cwd,
      config: './-config/@sys.tools.serve/site.yaml',
      host: 'network',
      port: 0,
    });
    try {
      expect(server.host).to.eql('network');
      expect(server.hostname).to.eql('0.0.0.0');
      expect(server.baseUrl).to.match(/^http:\/\/0\.0\.0\.0:\d+$/);
    } finally {
      await server.close();
      await server.close();
      await server.finished;
    }
  });

  it('rejects invalid runtime overrides before starting a server', async () => {
    const cwd = await Fixture.makeTempDir('serve-start-api-invalid');
    await Fixture.writeFile(cwd, 'site/index.html', '<!doctype html><h1>invalid</h1>');
    await Fixture.writeFile(cwd, '-config/@sys.tools.serve/site.yaml', 'name: Site\ndir: ./site\n');

    await expectError(
      () =>
        Serve.start({
          cwd,
          config: '-config/@sys.tools.serve/site.yaml',
          host: 'wide' as t.ServeTool.Host,
        }),
      'Serve.start: invalid host value:',
    );
    await expectError(
      () => Serve.start({ cwd, config: '-config/@sys.tools.serve/site.yaml', port: 65536 }),
      'Serve.start: invalid port value:',
    );
  });

  it('throws a useful error when owner YAML cannot be loaded', async () => {
    const cwd = await Fixture.makeTempDir('serve-start-api-missing');

    await expectError(
      () => Serve.start({ cwd, config: '-config/@sys.tools.serve/missing.yaml' }),
      'Serve.start: failed to load config:',
    );
  });
});

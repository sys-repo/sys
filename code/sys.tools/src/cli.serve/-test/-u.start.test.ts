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
      expect(server.selector).to.eql({
        kind: 'config',
        config: `${cwd}/-config/@sys.tools.serve/site.yaml`,
      });
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

  it('starts from a direct directory selector', async () => {
    const cwd = await Fixture.makeTempDir('serve-start-api-dir');
    await Fixture.writeFile(cwd, 'site/index.html', '<!doctype html><h1>direct</h1>');

    const server = await Serve.start({ cwd, dir: './site', port: 0 });
    try {
      expect(server.selector).to.eql({ kind: 'dir', input: './site', dir: `${cwd}/site` });
      expect(server.config).to.eql(undefined);
      expect(server.location.name).to.eql('site');
      expect(server.location.dir).to.eql(`${cwd}/site`);

      const res = await fetch(server.url);
      expect(res.status).to.eql(200);
      expect(await res.text()).to.contain('direct');
    } finally {
      await server.close();
      await server.finished;
    }
  });

  it('resolves explicit config paths relative to caller cwd', async () => {
    const cwd = await Fixture.makeTempDir('serve-start-api-config-cwd');
    await Fixture.writeFile(cwd, 'site/index.html', '<!doctype html><h1>external</h1>');
    await Fixture.writeFile(cwd, 'profiles/site.yaml', 'name: External\ndir: ./site\n');

    const server = await Serve.start({ cwd, config: 'profiles/site.yaml', port: 0 });
    try {
      expect(server.selector).to.eql({ kind: 'config', config: `${cwd}/profiles/site.yaml` });
      expect(server.config).to.eql(`${cwd}/profiles/site.yaml`);
      expect(server.location.name).to.eql('External');
      expect(server.location.dir).to.eql(`${cwd}/site`);
    } finally {
      await server.close();
      await server.finished;
    }
  });

  it('resolves named config profiles through the serve config directory', async () => {
    const cwd = await Fixture.makeTempDir('serve-start-api-profile');
    await Fixture.writeFile(cwd, 'site/index.html', '<!doctype html><h1>profile</h1>');
    await Fixture.writeFile(cwd, '-config/@sys.tools.serve/view.yaml', 'name: View\ndir: ./site\n');

    const server = await Serve.start({ cwd, profile: 'view', port: 0 });
    try {
      expect(server.selector).to.eql({
        kind: 'profile',
        profile: 'view',
        config: `${cwd}/-config/@sys.tools.serve/view.yaml`,
      });
      expect(server.config).to.eql(`${cwd}/-config/@sys.tools.serve/view.yaml`);
      expect(server.location.name).to.eql('View');
      expect(server.location.dir).to.eql(`${cwd}/site`);

      const res = await fetch(server.url);
      expect(res.status).to.eql(200);
      expect(await res.text()).to.contain('profile');
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

  it('requires exactly one config selector', async () => {
    const cwd = await Fixture.makeTempDir('serve-start-api-selector');

    await expectError(
      () => Serve.start({ cwd } as t.ServeTool.StartArgs),
      'Serve.start: exactly one of dir, config or profile is required.',
    );
    await expectError(
      () =>
        Serve.start({
          cwd,
          config: '-config/@sys.tools.serve/site.yaml',
          profile: 'site',
        } as unknown as t.ServeTool.StartArgs),
      'Serve.start: exactly one of dir, config or profile is required.',
    );
  });

  it('rejects path-like profile values', async () => {
    const cwd = await Fixture.makeTempDir('serve-start-api-profile-path');

    await expectError(
      () => Serve.start({ cwd, profile: './profile.yaml' }),
      'Serve.start: profile must be a bare config name.',
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

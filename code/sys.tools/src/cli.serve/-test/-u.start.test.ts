import { describe, expect, expectError, it, type t, Time } from '../../-test.ts';
import { Serve } from '../mod.ts';
import { Fixture } from './u.ts';

describe('Serve.start', () => {
  it('type-level: accepts owner config refs and lifecycle input', () => {
    const until = new AbortController().signal;
    const args: t.ServeTool.StartArgs = {
      cwd: '/tmp' as t.StringDir,
      paths: { config: './config.yaml' },
      until,
    };

    expect(args.paths?.config).to.eql('./config.yaml');
    expect(args.until).to.equal(until);
  });

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

  it('exposes renderer-neutral serve status snapshots', async () => {
    const cwd = await Fixture.makeTempDir('serve-start-api-status');
    await Fixture.writeFile(cwd, 'site/index.html', '<!doctype html><h1>status</h1>');
    await Fixture.writeFile(
      cwd,
      '-config/@sys.tools.serve/view.yaml',
      'name: View\ndir: ./site\ninfo:\n  path: /view/\n  dist: dist/\n',
    );

    const server = await Serve.start({
      cwd,
      paths: { config: '-config/@sys.tools.serve/view.yaml' },
      port: 0,
    });
    try {
      expect(server.status()).to.eql({
        state: 'ready',
        kind: 'static-serve',
        name: 'View',
        root: `${cwd}/site`,
        config: `${cwd}/-config/@sys.tools.serve/view.yaml`,
        urls: [{ href: `${server.baseUrl}/view/`, label: 'path' }],
        details: [{ label: 'dist', value: 'dist/' }],
      });

      await server.close('test.status');
      await server.finished;

      expect(server.status().state).to.eql('stopped');
    } finally {
      await server.close('test.cleanup');
      await server.finished;
    }
  });

  it('adds dist metadata details when the served artifact has a dist.json', async () => {
    const artifact = 'view/.pulled/ui.components';
    const builtAt = Date.now() - 4 * 24 * 60 * 60 * 1000;
    const { cwd } = await Fixture.makeDistServeTarget({
      section: 'serve-start-api-dist-status',
      builtAt,
      artifact,
      indexHtml: '<!doctype html><h1>artifact</h1>',
      configText: `name: View\ndir: .\ninfo:\n  path: /${artifact}/\n`,
    });

    const server = await Serve.start({
      cwd,
      paths: { config: '-config/@sys.tools.serve/view.yaml' },
      port: 0,
    });
    try {
      const builtDate = Time.utc(new Date(builtAt)).format('yyyy MMM dd');
      expect(server.status().details).to.eql([
        { label: 'pkg', value: '@sys/example 1.2.3' },
        { label: 'dist', value: `#1bb18, 2.1 MB, ${builtDate} · 4d ago` },
      ]);
    } finally {
      await server.close('test.dist-status');
      await server.finished;
    }
  });

  it('omits elapsed age for dist metadata built less than one minute ago', async () => {
    const builtAt = Date.now();
    const { cwd } = await Fixture.makeDistServeTarget({
      section: 'serve-start-api-fresh-dist-status',
      builtAt,
      indexHtml: '<!doctype html><h1>fresh</h1>',
    });

    const server = await Serve.start({
      cwd,
      paths: { config: '-config/@sys.tools.serve/view.yaml' },
      port: 0,
    });
    try {
      const builtDate = Time.utc(new Date(builtAt)).format('yyyy MMM dd');
      expect(server.status().details).to.eql([
        { label: 'pkg', value: '@sys/example 1.2.3' },
        { label: 'dist', value: `#1bb18, 2.1 MB, ${builtDate}` },
      ]);
    } finally {
      await server.close('test.fresh-dist-status');
      await server.finished;
    }
  });

  it('starts from an owner config ref selector', async () => {
    const cwd = await Fixture.makeTempDir('serve-start-api-paths-config');
    await Fixture.writeFile(cwd, 'site/index.html', '<!doctype html><h1>paths config</h1>');
    await Fixture.writeFile(cwd, '-config/@sys.tools.serve/site.yaml', 'name: Site\ndir: ./site\n');

    const server = await Serve.start({
      cwd,
      paths: { config: '-config/@sys.tools.serve/site.yaml' },
      port: 0,
    });
    try {
      expect(server.selector).to.eql({
        kind: 'config',
        config: `${cwd}/-config/@sys.tools.serve/site.yaml`,
      });
      expect(server.config).to.eql(`${cwd}/-config/@sys.tools.serve/site.yaml`);
      expect(server.location.name).to.eql('Site');
      expect(server.location.dir).to.eql(`${cwd}/site`);

      const res = await fetch(server.url);
      expect(res.status).to.eql(200);
      expect(await res.text()).to.contain('paths config');
    } finally {
      await server.close();
      await server.finished;
    }
  });

  it('starts from equivalent config and owner config refs', async () => {
    const cwd = await Fixture.makeTempDir('serve-start-api-equal-config-refs');
    await Fixture.writeFile(cwd, 'site/index.html', '<!doctype html><h1>same config</h1>');
    await Fixture.writeFile(cwd, 'profiles/site.yaml', 'name: Same\ndir: ./site\n');

    const server = await Serve.start({
      cwd,
      config: './profiles/site.yaml',
      paths: { config: `${cwd}/profiles/site.yaml` },
      port: 0,
    });
    try {
      expect(server.selector).to.eql({ kind: 'config', config: `${cwd}/profiles/site.yaml` });
      expect(server.config).to.eql(`${cwd}/profiles/site.yaml`);
      expect(server.location.name).to.eql('Same');
      expect(server.location.dir).to.eql(`${cwd}/site`);
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

  it('closes from external lifecycle input', async () => {
    const cwd = await Fixture.makeTempDir('serve-start-api-until');
    await Fixture.writeFile(cwd, 'site/index.html', '<!doctype html><h1>until</h1>');

    const abort = new AbortController();
    const server = await Serve.start({ cwd, dir: './site', port: 0, until: abort.signal });

    try {
      const res = await fetch(server.url);
      expect(res.status).to.eql(200);
      expect(await res.text()).to.contain('until');

      abort.abort('test.until');
      await Fixture.expectFinishedSoon(server.finished);
      await server.close('test.after-until');
    } finally {
      abort.abort('test.cleanup');
      await server.close('test.cleanup');
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

  it('rejects conflicting config refs', async () => {
    const cwd = await Fixture.makeTempDir('serve-start-api-config-ref-conflict');

    await expectError(
      () =>
        Serve.start({
          cwd,
          config: './profiles/a.yaml',
          paths: { config: './profiles/b.yaml' },
        }),
      'Serve.start: config and paths.config resolve to different paths.',
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
    await expectError(
      () =>
        Serve.start({
          cwd,
          dir: '.',
          paths: { config: './site.yaml' },
        } as unknown as t.ServeTool.StartArgs),
      'Serve.start: exactly one of dir, config or profile is required.',
    );
    await expectError(
      () =>
        Serve.start({
          cwd,
          profile: 'site',
          paths: { config: './site.yaml' },
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

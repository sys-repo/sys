import { describe, expect, Fs, it, Rx, Str, type t, Testing, Try } from '../../-test.ts';
import { ViteService } from '../mod.ts';
import { startDev } from '../u.dev.ts';

describe('@sys/driver-vite/service', () => {
  it('API', async () => {
    const m = await import('@sys/driver-vite/service');

    expect(m.ViteService).to.equal(ViteService);
    expect('ViteDev' in m).to.eql(false);
    expect('startDev' in m).to.eql(false);
    expect(typeof ViteService.resources).to.eql('function');
    expect(typeof ViteService.start).to.eql('function');
  });

  it('declares configured Vite listener resources without starting dev', async () => {
    const fs = await Testing.dir('driver-vite.service.resources');
    const config = fs.join('-config/@sys.driver-vite/view.yaml');
    await Fs.write(
      config,
      Str.dedent(`
        name: View
        dir: ./view
        port: 5173
      `).trimStart(),
    );

    const resources = await ViteService.resources({ cwd: fs.dir, paths: { config } });

    expect(resources).to.eql([{ kind: 'tcp-listener', host: 'localhost', port: 5173 }]);
  });

  it('omits Vite resources when no strict configured port exists', async () => {
    const fs = await Testing.dir('driver-vite.service.resources.none');
    const config = fs.join('-config/@sys.driver-vite/view.yaml');
    await Fs.write(config, '{}\n');

    const resources = await ViteService.resources({ cwd: fs.dir, paths: { config } });

    expect(resources).to.eql([]);
  });

  it('starts Vite.dev from Cell lifecycle args and owner config', async () => {
    const fs = await Testing.dir('driver-vite.service.dev');
    const config = fs.join('-config/@sys.driver-vite/view.yaml');
    await Fs.write(
      config,
      Str.dedent(`
        name: View
        dir: ./view
        port: 5173
      `).trimStart(),
    );
    const until = new AbortController().signal;
    const server = fakeServer({ port: 5179, url: 'http://localhost:5179/' });
    let captured: t.Vite.Dev.Args | undefined;

    const handle = await startDev(
      { cwd: fs.dir, paths: { config }, silent: true, until },
      {
        dev: async (args) => {
          captured = args;
          return server;
        },
      },
    );

    expect(captured).to.eql({
      cwd: fs.join('view'),
      port: 5173,
      strictPort: true,
      silent: true,
      until,
    });
    expect(handle.cwd).to.eql(fs.join('view'));
    expect(handle.config).to.eql(config);
    expect(handle.port).to.eql(5179);
    expect(handle.url).to.eql('http://localhost:5179/');
    expect(handle.status()).to.eql({
      state: 'ready',
      name: 'View',
      kind: 'vite:dev',
      root: fs.join('view'),
      config,
      urls: [{ href: 'http://localhost:5179/', label: 'local' }],
      details: [{ label: 'port', value: '5179' }],
    });

    await handle.close('done');
    await handle.finished;
    expect(server.disposed).to.eql(true);
    expect(handle.status().state).to.eql('stopped');
  });

  it('defaults config values without leaking Cell-specific args to Vite.dev', async () => {
    const fs = await Testing.dir('driver-vite.service.defaults');
    const configRel = '-config/@sys.driver-vite/view.yaml';
    const config = fs.join(configRel);
    await Fs.write(config, '{}\n');
    let captured: t.Vite.Dev.Args | undefined;

    const handle = await startDev(
      { cwd: fs.dir, paths: { config: configRel } },
      {
        dev: async (args) => {
          captured = args;
          return fakeServer();
        },
      },
    );

    expect(captured).to.eql({ cwd: fs.dir, port: undefined, silent: true, until: undefined });
    expect(handle.status()).to.eql({
      state: 'ready',
      kind: 'vite:dev',
      root: fs.dir,
      config,
      urls: [{ href: 'http://localhost:4321/', label: 'local' }],
      details: [{ label: 'port', value: '4321' }],
    });
    await handle.dispose();
  });

  it('fails clearly for invalid owner configs', async () => {
    const fs = await Testing.dir('driver-vite.service.invalid-config');
    const unknown = fs.join('unknown.yaml');
    const invalidYaml = fs.join('invalid.yaml');
    const invalidPort = fs.join('invalid-port.yaml');

    await Fs.write(unknown, 'extra: true\n');
    await Fs.write(invalidYaml, 'bad: [\n');
    await Fs.write(invalidPort, 'port: 70000\n');

    const missingError = await catchError(() =>
      startDev({ cwd: fs.dir, paths: { config: fs.join('missing.yaml') } })
    );
    const unknownError = await catchError(() =>
      startDev({ cwd: fs.dir, paths: { config: unknown } })
    );
    const yamlError = await catchError(() =>
      startDev({ cwd: fs.dir, paths: { config: invalidYaml } })
    );
    const portError = await catchError(() =>
      startDev({ cwd: fs.dir, paths: { config: invalidPort } })
    );

    expect(missingError?.message).to.eql(
      `@sys/driver-vite/service ViteService: failed to read config: ${fs.join('missing.yaml')}`,
    );
    expect(unknownError?.message).to.eql(
      `@sys/driver-vite/service ViteService: unknown config field 'extra' in ${unknown}`,
    );
    expect(yamlError?.message).to.eql(
      `@sys/driver-vite/service ViteService: failed to parse config YAML: ${invalidYaml}`,
    );
    expect(portError?.message).to.eql(
      `@sys/driver-vite/service ViteService: config field 'port' must be an integer from 1 to 65535 in ${invalidPort}`,
    );
  });
});

/**
 * Helpers:
 */
type FakeServerOptions = {
  readonly port?: number;
  readonly url?: string;
};

function fakeServer(options: FakeServerOptions = {}): t.Vite.Dev.Process {
  const port = options.port ?? 4321;
  const life = Rx.lifecycleAsync();
  return {
    port,
    url: options.url ?? `http://localhost:${port}/`,
    listen: async () => {},
    keyboard: async () => {},
    proc: {} as t.Process.Handle,
    dispose: life.dispose,
    get dispose$() {
      return life.dispose$;
    },
    get disposed() {
      return life.disposed;
    },
  };
}

async function catchError(fn: () => unknown | Promise<unknown>): Promise<Error | undefined> {
  const { result } = await Try.run(fn);
  return result.ok ? undefined : result.error;
}

import { describe, expect, expectTypeOf, Fs, it, Str, type t, Testing } from '../../-test.ts';
import { Dist, DistServer } from '../../m.server.dist/mod.ts';
import { setup, teardown } from '../../m.server.dist/-test/u.fixture.ts';
import { DistService } from '../mod.ts';

describe('DistService', () => {
  it('API', async () => {
    const m = await import('@sys/server/dist/service');

    expect(m.DistService).to.equal(DistService);
    expect(Object.keys(m)).to.eql(['DistService']);
    expect(Object.keys(DistService)).to.eql(['start', 'resources']);
    expect(Object.isFrozen(DistService)).to.eql(true);
    expectTypeOf(DistService).toEqualTypeOf<t.DistService.Lib>();
    expectTypeOf(DistService).toMatchTypeOf<
      t.Service.LifecycleEndpoint<t.DistService.StartArgs, t.HttpServer.Started>
    >();
  });

  it('rejects unknown and accessor service authority before config I/O', async () => {
    const input = {
      cwd: '/tmp/cell' as t.StringDir,
      paths: { config: '/tmp/missing.yaml' as t.StringPath },
      silent: true,
      unexpected: true,
    };
    const unknown = await catchError(() => {
      return DistService.start(input as t.DistService.StartArgs);
    });
    expect(unknown?.message).to.eql('DistService: invalid service arguments.');

    let reads = 0;
    const paths = {};
    Object.defineProperty(paths, 'config', {
      enumerable: true,
      get() {
        reads++;
        return '/tmp/missing.yaml';
      },
    });
    const accessor = await catchError(() => {
      return DistService.start(
        { cwd: '/tmp/cell' as t.StringDir, paths } as t.DistService.StartArgs,
      );
    });
    expect(accessor?.message).to.eql('DistService: invalid service arguments.');
    expect(reads).to.eql(0);
  });

  it('declares only fixed non-zero configured listener resources', async () => {
    const dir = await Testing.dir('dist-service.resources');
    const config = Fs.join(dir.dir, 'dist.yaml');
    await Fs.write(config, configYaml({ dir: './generation', port: 5050 }));

    const resources = await DistService.resources({
      cwd: dir.dir as t.StringDir,
      paths: { config },
    });
    expect(resources).to.eql([{ kind: 'tcp-listener', host: '127.0.0.1', port: 5050 }]);
    expect(Object.isFrozen(resources)).to.eql(true);
    expect(Object.isFrozen(resources[0])).to.eql(true);

    await Fs.write(config, configYaml({ dir: './generation', port: 0 }));
    const ephemeral = await DistService.resources({
      cwd: dir.dir as t.StringDir,
      paths: { config },
    });
    expect(ephemeral).to.eql([]);
    expect(Object.isFrozen(ephemeral)).to.eql(true);
  });

  it('admits contained directory names that begin with two periods', async () => {
    const dir = await Testing.dir('dist-service.dot-prefix');
    const config = Fs.join(dir.dir, 'dist.yaml');
    await Fs.write(config, configYaml({ dir: './..cache/generation', port: 5050 }));

    const resources = await DistService.resources({
      cwd: dir.dir as t.StringDir,
      paths: { config },
    });
    expect(resources).to.eql([{ kind: 'tcp-listener', host: '127.0.0.1', port: 5050 }]);
  });

  it('rejects padded and control-bearing config strings', async () => {
    const dir = await Testing.dir('dist-service.config-text');
    const config = Fs.join(dir.dir, 'dist.yaml');
    const base = configYaml({ dir: './generation' });
    const cases = [
      ['padded name', base.replace('name: neutral-dist', 'name: " neutral-dist"')],
      ['padded dir', configYaml({ dir: '"./generation "' })],
      ['name control', base.replace('name: neutral-dist', 'name: "neutral\\u001Bhost"')],
      ['dir NUL', configYaml({ dir: '"./generation\\0escape"' })],
    ] as const;

    for (const [label, yaml] of cases) {
      await Fs.write(config, yaml);
      const error = await catchError(() => {
        return DistService.resources({ cwd: dir.dir as t.StringDir, paths: { config } });
      });
      expect([label, error?.message.startsWith('DistService: invalid config')]).to.eql([
        label,
        true,
      ]);
    }
  });

  it('starts from strict contained config and delegates to DistServer', async () => {
    const fixture = await setup();
    let server: t.HttpServer.Started | undefined;
    try {
      const materialized = await Dist.materialize(fixture.args());
      expect(materialized.kind).to.eql('promoted');
      if (materialized.kind !== 'promoted') return;

      const cwd = Fs.dirname(fixture.storeDir);
      const config = Fs.join(cwd, 'dist.yaml');
      await Fs.write(
        config,
        configYaml({
          dir: materialized.dir,
          integrity: materialized.integrity,
          port: 0,
        }),
      );

      server = await DistService.start({
        cwd,
        paths: { config },
        silent: true,
      });

      const response = await fetch(server.origin);
      expect(response.status).to.eql(200);
      expect(await response.text()).to.eql('<h1>verified</h1>');
    } finally {
      await server?.close('test.cleanup');
      await teardown(fixture);
    }
  });

  it('forwards Cell-owned cancellation without admitting YAML lifecycle overrides', async () => {
    const fixture = await setup();
    try {
      const materialized = await Dist.materialize(fixture.args());
      expect(materialized.kind).to.eql('promoted');
      if (materialized.kind !== 'promoted') return;

      const cwd = Fs.dirname(fixture.storeDir);
      const config = Fs.join(cwd, 'dist.yaml');
      await Fs.write(
        config,
        configYaml({
          dir: materialized.dir,
          integrity: materialized.integrity,
        }),
      );
      const controller = new AbortController();
      controller.abort('private-cell-reason');

      const error = await catchError(() => {
        return DistService.start({
          cwd,
          paths: { config },
          silent: true,
          until: controller.signal,
        });
      });
      const isStartError = DistServer.Error.is(error);
      expect(isStartError).to.eql(true);
      if (!isStartError) return;
      expect(error.reason).to.eql('cancelled');
      expect(error.message).to.eql('DistServer.start: startup cancelled.');
      expect(JSON.stringify(error)).to.not.include('private-cell-reason');
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects unknown config and directory escape before startup', async () => {
    const dir = await Testing.dir('dist-service.config');
    const config = Fs.join(dir.dir, 'dist.yaml');
    await Fs.write(config, `${configYaml({ dir: '../escape' })}unknown: true\n`);

    const unknown = await catchError(() => {
      return DistService.start({ cwd: dir.dir as t.StringDir, paths: { config }, silent: true });
    });
    expect(unknown?.message).to.contain('DistService: invalid config');

    await Fs.write(config, configYaml({ dir: '../escape' }));
    const escape = await catchError(() => {
      return DistService.start({ cwd: dir.dir as t.StringDir, paths: { config }, silent: true });
    });
    expect(escape?.message).to.eql('DistService: dir escapes service cwd.');

    await Fs.write(
      config,
      configYaml({ dir: './generation' }).replace('entries: 100', 'entries: 0'),
    );
    const limits = await catchError(() => {
      return DistService.start({ cwd: dir.dir as t.StringDir, paths: { config }, silent: true });
    });
    expect(limits?.message).to.contain('DistService: invalid config');

    await Fs.write(
      config,
      configYaml({ dir: './generation' }).replace('hostname: 127.0.0.1', 'hostname: 0.0.0.0'),
    );
    const hostname = await catchError(() => {
      return DistService.start({ cwd: dir.dir as t.StringDir, paths: { config }, silent: true });
    });
    expect(hostname?.message).to.contain('DistService: invalid config');
  });
});

function configYaml(options: {
  readonly dir: string;
  readonly integrity?: t.StringHash;
  readonly port?: number;
}) {
  return Str.dedent(`
    name: neutral-dist
    dir: ${options.dir}
    integrity: ${options.integrity ?? `sha256-${'0'.repeat(64)}`}
    limits:
      manifestBytes: 1048576
      entries: 100
      fileBytes: 1048576
      totalBytes: 4194304
    hostname: 127.0.0.1
    port: ${options.port ?? 0}
  `).trimStart();
}

async function catchError(fn: () => unknown | Promise<unknown>): Promise<Error | undefined> {
  try {
    await fn();
  } catch (cause) {
    return cause as Error;
  }
}

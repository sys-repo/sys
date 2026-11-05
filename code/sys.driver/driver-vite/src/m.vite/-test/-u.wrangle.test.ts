import { describe, expect, Fs, it, Path, ROOT } from '../../-test.ts';
import { resolveFromImportMap } from '../../-test/u.importMap.ts';
import { Wrangle } from '../u/u.wrangle.ts';
import { createConsumer, option, readImportMap } from './fixture.u.wrangle.ts';

const vite8 = { dependencies: { vite: '8.0.2' } };
const vite7 = { dependencies: { vite: '7.3.1' } };

describe('Vite.Wrangle command construction', () => {
  it('explicit frozen-cache policy → child flags without changing ordinary builds', async () => {
    await using consumer = await createConsumer({ packageJson: vite8 });
    const ordinary = await consumer.command('build');
    const constrained = await Wrangle.command(consumer.paths, 'build', 'frozen-cache');
    try {
      expect(ordinary.args).not.to.include('--frozen');
      expect(ordinary.args).not.to.include('--cached-only');
      expect(constrained.args.slice(0, 4)).to.eql([
        'run',
        '--no-prompt',
        '--frozen',
        '--cached-only',
      ]);
      const ordinaryMap = option(ordinary.args, '--import-map');
      const constrainedMap = option(constrained.args, '--import-map');
      expect(constrainedMap).not.to.eql(ordinaryMap);
      expect(Path.basename(constrainedMap)).to.eql(Path.basename(ordinaryMap));
      const expectedArgs = ordinary.args.slice(2).map((arg) =>
        arg === `--import-map=${ordinaryMap}` ? `--import-map=${constrainedMap}` : arg
      );
      expect(constrained.args.slice(4)).to.eql(expectedArgs);
      expect(constrained.env).to.eql(ordinary.env);

      const { path, imports } = await readImportMap(constrained.args);
      const moduleSyncPath = Path.fromFileUrl(imports['#module-sync-enabled']);
      expect(await Fs.exists(moduleSyncPath)).to.eql(true);
      await constrained.dispose();
      expect(await Fs.exists(path)).to.eql(false);
      expect(await Fs.exists(moduleSyncPath)).to.eql(false);
      expect(await Fs.exists(ordinaryMap)).to.eql(true);
      expect(await Fs.exists(consumer.root)).to.eql(true);
    } finally {
      await constrained.dispose();
    }
  });

  describe('package authority', () => {
    it('anchors npm resolution at the nearest consumer package', async () => {
      await using consumer = await createConsumer({
        packageJson: { dependencies: {} },
        project: 'code/projects/foo',
      });
      const anchor = await Wrangle.packageAnchor(consumer.cwd);
      expect(anchor).to.eql(Path.join(consumer.root, 'package.json'));
    });

    it('uses the consumer pin when the driver module has an HTTPS origin', async () => {
      await using consumer = await createConsumer({
        packageJson: vite7,
        project: 'code/projects/foo',
      });
      const moduleUrl = 'https://jsr.io/@sys/driver-vite/0.0.317/src/m.vite/u/u.wrangle.ts';
      const specifier = await Wrangle.viteSpecifier(consumer.cwd, moduleUrl);
      expect(specifier).to.eql('npm:vite@7.3.1');
    });
  });

  describe('startup configuration', () => {
    it('Vite 8 → native loader and a disposable map with narrowly scoped runtime additions', async () => {
      await using consumer = await createConsumer({
        packageJson: { dependencies: { ...vite8.dependencies, '@vitejs/plugin-react': '6.0.1' } },
        imports: { '@sys/http': './src/http.ts' },
      });
      const command = await consumer.command('build');
      const { path, imports } = await readImportMap(command.args);

      expect(command.args.filter((arg) => arg.startsWith('npm:vite@'))).to.eql(['npm:vite@8.0.2']);
      expect(option(command.args, '--configLoader')).to.eql('native');
      expect(imports.vite).to.eql('npm:vite@8.0.2');
      expect(imports['vite/internal']).to.eql('npm:vite@8.0.2/internal');
      expect(imports['vite/module-runner']).to.eql('npm:vite@8.0.2/module-runner');
      expect(imports['#module-sync-enabled']).to.match(/^file:.*module-sync-enabled\.mjs$/);
      expect(imports.zlib).to.eql('node:zlib');
      const excluded = [
        'fs',
        'path',
        'rolldown/experimental',
        'tinyglobby',
        '@rolldown/pluginutils',
      ];
      for (const name of excluded) {
        expect(imports[name], name).to.eql(undefined);
      }
      const http = resolveFromImportMap(path, imports['@sys/http']);
      const expectedHttp = Path.toFileUrl(Path.join(consumer.root, 'src/http.ts')).href;
      expect(http).to.eql(expectedHttp);

      // Prove command disposal independently of the fixture's directory cleanup.
      await command.dispose();
      expect(await Fs.exists(path)).to.eql(false);
      expect(await Fs.exists(consumer.root)).to.eql(true);
    });

    it('Vite 7 → default loader and no startup map', async () => {
      await using consumer = await createConsumer({ packageJson: vite7 });
      const { args } = await consumer.command('build');

      expect(args.filter((arg) => arg.startsWith('npm:vite@'))).to.eql(['npm:vite@7.3.1']);
      expect(args.some((arg) => arg.startsWith('--configLoader='))).to.eql(false);
      expect(args.some((arg) => arg.startsWith('--import-map='))).to.eql(false);
      expect(args).to.include('-A');
    });

    for (const manifest of ['absent', 'without vite'] as const) {
      describe(`driver fallback: consumer package.json ${manifest}`, () => {
        for (const mode of ['build', 'dev'] as const) {
          it(`${mode} → executable, loader, and import map share driver authority`, async () => {
            const packageJson = manifest === 'absent' ? undefined : { dependencies: {} };
            await using consumer = await createConsumer({ packageJson });
            const driverVite = await Wrangle.viteSpecifier(ROOT.dir);
            const { args } = await consumer.command(mode);
            const { imports } = await readImportMap(args);

            expect(args.filter((arg) => arg.startsWith('npm:vite@'))).to.eql([driverVite]);
            expect(option(args, '--configLoader')).to.eql('native');
            expect(imports.vite).to.eql(driverVite);
            expect(imports['vite/internal']).to.eql(`${driverVite}/internal`);
            expect(imports['vite/module-runner']).to.eql(`${driverVite}/module-runner`);

            expect(args).to.include('--no-prompt');
            expect(args).to.include('-A');
          });
        }
      });
    }
  });

  it('build → passes app.base once as --base (Vite 7 and 8)', async () => {
    for (const packageJson of [vite7, vite8]) {
      await using consumer = await createConsumer({ packageJson });
      for (const base of ['', './', '/assets/', 'https://assets.example.test/release/']) {
        const paths = { ...consumer.paths, app: { ...consumer.paths.app, base } };
        const command = await Wrangle.command(paths, 'build');
        try {
          expect(option(command.args, '--base')).to.eql(base);
        } finally {
          await command.dispose();
        }
      }
    }
  });

  describe('trusted child execution', () => {
    it('build → full permissions with explicit non-interactive execution', async () => {
      await using consumer = await createConsumer({ packageJson: vite8 });
      const { args } = await consumer.command('build');
      assertTrustedArgs(args);
    });

    it('dev → trusted arguments select native loader and generated import map', async () => {
      await using consumer = await createConsumer({ packageJson: vite8 });
      const { args } = await consumer.command('dev --port=1234 --host');
      assertTrustedArgs(args);
      expect(args).to.include('npm:vite@8.0.2');
      expect(args.some((arg) => arg.startsWith('--base='))).to.eql(false);
      expect(option(args, '--configLoader')).to.eql('native');
      const { path } = await readImportMap(args);
      expect(await Fs.exists(path)).to.eql(true);
    });

    it('nested consumer → trusted execution preserves the consumer configuration path', async () => {
      const project = 'code/projects/foo';
      await using consumer = await createConsumer({ packageJson: vite8, project });
      const { args } = await consumer.command('dev --port=1234 --host');
      expect(args).to.include('-A');
      expect(option(args, '--config')).to.eql('vite.config.ts');
      const anchor = await Wrangle.packageAnchor(consumer.cwd);
      expect(anchor).to.eql(Path.join(consumer.root, 'package.json'));
    });
  });
});

function assertTrustedArgs(args: readonly string[]) {
  expect(args.filter((arg) => arg === '-A')).to.have.length(1);
  expect(args).to.include('--no-prompt');
  expect(args.some((arg) => arg.startsWith('--allow-'))).to.eql(false);
  expect(args.some((arg) => arg.startsWith('--deny-'))).to.eql(false);
}

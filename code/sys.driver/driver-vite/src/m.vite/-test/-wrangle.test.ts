import { describe, expect, Fs, it, Path, ROOT } from '../../-test.ts';
import { resolveFromImportMap } from '../../-test/u.importMap.ts';
import { Wrangle } from '../u/u.wrangle.ts';
import { createConsumer, option, readImportMap } from './u.fixture.wrangle.ts';

const vite8 = { dependencies: { vite: '8.0.2' } };
const vite7 = { dependencies: { vite: '7.3.1' } };

describe('Vite.Wrangle', () => {
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

    it('Vite 7 → default loader, no startup map, and a bounded config-cache write grant', async () => {
      await using consumer = await createConsumer({ packageJson: vite7 });
      const { args } = await consumer.command('build');
      const writes = option(args, '--allow-write').split(',');

      expect(args.filter((arg) => arg.startsWith('npm:vite@'))).to.eql(['npm:vite@7.3.1']);
      expect(args.some((arg) => arg.startsWith('--configLoader='))).to.eql(false);
      expect(args.some((arg) => arg.startsWith('--import-map='))).to.eql(false);
      expect(writes).to.include(Path.join(consumer.root, 'dist'));
      expect(writes).to.include(Path.join(consumer.root, 'node_modules', '.vite'));
      expect(writes).to.include(Path.join(consumer.root, 'node_modules', '.vite-temp'));
      expect(writes).to.not.include(consumer.root);
      expect(writes).to.not.include(await Fs.realPath(consumer.root));
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

            const writes = option(args, '--allow-write').split(',');
            expect(args).to.include('--no-prompt');
            expect(args).to.not.include('-A');
            expect(writes).to.include(Path.join(consumer.root, 'dist'));
            expect(writes).to.include(Path.join(consumer.root, 'node_modules', '.vite'));
            expect(writes).to.not.include(Path.join(consumer.root, 'node_modules', '.vite-temp'));
            if (mode === 'build') {
              expect(writes).to.not.include(consumer.root);
              expect(writes).to.not.include(await Fs.realPath(consumer.root));
              expect(option(args, '--allow-net')).to.eql('localhost');
            }
          });
        }
      });
    }
  });

  describe('child permissions', () => {
    it('build → output/cache writes, localhost DNS, and explicit runtime grants', async () => {
      await using consumer = await createConsumer({ packageJson: vite8 });
      const { args } = await consumer.command('build');
      const writes = option(args, '--allow-write').split(',');
      const ffi = option(args, '--allow-ffi').split(',');

      expect(writes).to.include(Path.join(consumer.root, 'dist'));
      expect(writes).to.include(Path.join(consumer.root, 'node_modules', '.vite'));
      expect(writes).to.not.include(Path.join(consumer.root, 'node_modules', '.vite-temp'));
      expect(writes).to.not.include(consumer.root);
      expect(writes).to.not.include(await Fs.realPath(consumer.root));
      expect(option(args, '--allow-net')).to.eql('localhost');
      expect(args.some((arg) => arg.includes('0.0.0.0') || arg.includes('[::]'))).to.eql(false);
      expect(option(args, '--allow-sys')).to.eql('osRelease,homedir,uid,gid');
      expect(ffi).to.include(Path.join(consumer.root, 'node_modules', '.deno'));
      expect(option(args, '--allow-run')).to.eql(Deno.execPath());
      expect(args).to.include('--no-prompt');
      expect(args).to.include('--allow-env');
      expect(args).to.not.include('--allow-ffi');
      expect(args).to.not.include('--allow-run');
      expect(args).to.not.include('-A');
    });

    it('dev → consumer writes and local serving/network-interface grants', async () => {
      await using consumer = await createConsumer({ packageJson: vite8 });
      const { args } = await consumer.command('dev --port=1234 --host');
      const writes = option(args, '--allow-write').split(',');

      expect(writes).to.include(consumer.root);
      expect(writes).to.include(Path.join(consumer.root, 'node_modules', '.vite'));
      expect(args).to.include('--allow-env');
      expect(option(args, '--allow-net')).to.eql('localhost,127.0.0.1,0.0.0.0,[::1],[::]');
      expect(option(args, '--allow-sys')).to.eql('osRelease,homedir,uid,gid,networkInterfaces');
      expect(option(args, '--allow-run')).to.eql(Deno.execPath());
      expect(args).to.include('npm:vite@8.0.2');
      expect(option(args, '--configLoader')).to.eql('native');
      const { path } = await readImportMap(args);
      expect(await Fs.exists(path)).to.eql(true);
    });

    it('a nested consumer owns cache writes, not the broader package anchor', async () => {
      await using consumer = await createConsumer({
        packageJson: vite8,
        project: 'code/projects/foo',
      });
      const { args } = await consumer.command('dev --port=1234 --host');
      const writes = option(args, '--allow-write').split(',');

      expect(writes).to.include(consumer.cwd);
      expect(writes).to.include(Path.join(consumer.cwd, 'node_modules', '.vite'));
      expect(writes).to.not.include(Path.join(consumer.root, 'node_modules', '.vite'));
    });
  });
});

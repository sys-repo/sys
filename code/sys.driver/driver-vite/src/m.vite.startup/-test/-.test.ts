import { describe, expect, Fs, it, Path } from '../../-test.ts';
import { relativeFromImportMap, resolveFromImportMap } from '../../-test/u.importMap.ts';
import { Vite } from '../../m.vite/mod.ts';
import { ViteStartup } from '../mod.ts';

describe(`ViteStartup`, () => {
  it('API', () => {
    expect(Vite.Startup).to.equal(ViteStartup);
  });

  it('Projection.create projects startup authority for child launch', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.startup.projection-' });
    const root = tmp.absolute;
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: {
        vite: '8.0.9',
        '@vitejs/plugin-react': '6.0.1',
      },
    });
    await Fs.writeJson(`${root}/imports.json`, {
      imports: {
        '@sys/fs': './src/fs.ts',
      },
      scopes: {
        './src/': {
          '@sys/std': './src/std.ts',
        },
      },
    });
    await Fs.writeJson(`${root}/deno.json`, {
      imports: {
        '@sys/http': './src/http.ts',
      },
      importMap: './imports.json',
    });

    const res = await ViteStartup.Projection.create({
      cwd: root as never,
      vite: 'npm:vite@8.0.9',
    });

    expect(res.dir).to.eql(root);
    expect(res.imports['@sys/fs']).to.eql('./src/fs.ts');
    expect(res.imports['@sys/http']).to.eql('./src/http.ts');
    expect(res.imports.vite).to.eql('npm:vite@8.0.9');
    expect(res.imports['vite/internal']).to.eql('npm:vite@8.0.9/internal');
    expect(res.imports['vite/module-runner']).to.eql('npm:vite@8.0.9/module-runner');
    expect(res.imports['@rolldown/pluginutils']).to.eql('npm:@rolldown/pluginutils@1.0.0-rc.7');
    expect(res.scopes).to.eql({
      './src/': {
        '@sys/std': './src/std.ts',
      },
    });
    expect(Object.keys(res.imports)).to.eql([...Object.keys(res.imports)].sort());
  });

  it('Delivery.create derives a stable path from equivalent startup authority', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.startup.delivery.identity-' });
    const root = tmp.absolute;
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: '8.0.9' },
    });
    await Fs.writeJson(`${root}/deno.json`, {
      imports: {
        '@sys/http': './src/http.ts',
      },
    });

    const authority = await ViteStartup.Projection.create({
      cwd: root as never,
      vite: 'npm:vite@8.0.9',
    });
    const first = await ViteStartup.Delivery.create({ authority });
    const second = await ViteStartup.Delivery.create({ authority });

    try {
      expect(first.path).to.eql(second.path);
    } finally {
      await first.cleanup();
      await second.cleanup();
    }
  });

  it('Delivery.create materializes and cleans up the child startup handle', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.startup.delivery-' });
    const root = tmp.absolute;
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: '8.0.9' },
    });
    await Fs.writeJson(`${root}/imports.json`, {
      imports: {
        '@sys/fs': './src/fs.ts',
      },
      scopes: {
        './src/': {
          '@sys/std': './src/std.ts',
        },
      },
    });
    await Fs.writeJson(`${root}/deno.json`, {
      imports: {
        '@sys/http': './src/http.ts',
      },
      importMap: './imports.json',
    });

    const authority = await ViteStartup.Projection.create({
      cwd: root as never,
      vite: 'npm:vite@8.0.9',
    });
    const handle = await ViteStartup.Delivery.create({ authority });
    const written = await Fs.readJson<{
      imports?: Record<string, string>;
      scopes?: Record<string, unknown>;
    }>(handle.path);

    expect(handle.path.includes('.vite.bootstrap.')).to.eql(true);
    expect(handle.path.includes('node_modules/.vite/.sys-driver-vite/startup')).to.eql(true);
    expect(written.data?.imports?.['#module-sync-enabled']).to.match(
      /^file:.*module-sync-enabled\.mjs$/,
    );
    expect(resolveFromImportMap(handle.path, written.data?.imports?.['@sys/fs'])).to.eql(
      Path.toFileUrl(Path.join(root, 'src/fs.ts')).href,
    );
    expect(resolveFromImportMap(handle.path, written.data?.imports?.['@sys/http'])).to.eql(
      Path.toFileUrl(Path.join(root, 'src/http.ts')).href,
    );
    expect(written.data?.imports?.vite).to.eql('npm:vite@8.0.9');
    expect(written.data?.scopes).to.eql({
      [relativeFromImportMap(handle.path, Path.join(root, 'src'), true)]: {
        '@sys/std': relativeFromImportMap(handle.path, Path.join(root, 'src/std.ts')),
      },
    });

    await handle.cleanup();
    expect(await Fs.exists(handle.path)).to.eql(false);
    const moduleSyncPath = written.data?.imports?.['#module-sync-enabled']
      ? new URL(written.data.imports['#module-sync-enabled']).pathname
      : '';
    expect(moduleSyncPath.length > 0).to.eql(true);
    expect(moduleSyncPath ? await Fs.exists(moduleSyncPath) : true).to.eql(false);
  });
});

import { describe, expect, Fs, it, Path, type t, Try } from '../../-test.ts';
import { relativeFromImportMap, resolveFromImportMap } from '../../-test/u.importMap.ts';
import { Vite } from '../../m.vite/mod.ts';
import { ViteStartup } from '../mod.ts';

type ImportMap = { imports: t.ViteStartup.Imports; scopes?: t.ViteStartup.Scopes };

describe('ViteStartup', () => {
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
      cwd: root,
      vite: 'npm:vite@8.0.9',
    });

    expect(res.dir).to.eql(root);
    expect(res.imports['@sys/fs']).to.eql('./src/fs.ts');
    expect(res.imports['@sys/http']).to.eql('./src/http.ts');
    expect(res.imports.vite).to.eql('npm:vite@8.0.9');
    expect(res.imports['vite/internal']).to.eql('npm:vite@8.0.9/internal');
    expect(res.imports['vite/module-runner']).to.eql('npm:vite@8.0.9/module-runner');
    expect(res.imports.zlib).to.eql('node:zlib');
    expect(res.imports.fs).to.eql(undefined);
    expect(res.imports.path).to.eql(undefined);
    expect(res.imports['@rolldown/pluginutils']).to.eql(undefined);
    expect(res.scopes).to.eql({
      './src/': {
        '@sys/std': './src/std.ts',
      },
    });
    expect(Object.keys(res.imports)).to.eql([...Object.keys(res.imports)].sort());
  });

  it('Projection.create inherits root external imports needed by local workspace startup without reviving root-local aliases', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.startup.projection.workspace-' });
    const root = tmp.absolute;
    const child = `${root}/code/pkg-a`;
    await Fs.ensureDir(child);

    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: '8.0.9' },
    });
    await Fs.writeJson(`${root}/imports.json`, {
      imports: {
        '@cliffy/keypress': 'jsr:@cliffy/keypress@1.0.1',
        '@root/only': './root-only.ts',
        'strip-ansi': 'npm:strip-ansi@7.2.0',
      },
    });
    await Fs.writeJson(`${root}/deno.json`, {
      workspace: ['./code/pkg-a'],
      importMap: './imports.json',
    });
    await Fs.writeJson(`${child}/deno.json`, {
      imports: {
        '@child/only': './child-only.ts',
      },
    });

    const res = await ViteStartup.Projection.create({
      cwd: child,
      vite: 'npm:vite@8.0.9',
    });

    expect(res.dir).to.eql(child);
    expect(res.imports['@child/only']).to.eql('./child-only.ts');
    expect(res.imports['@cliffy/keypress']).to.eql('jsr:@cliffy/keypress@1.0.1');
    expect(res.imports['strip-ansi']).to.eql('npm:strip-ansi@7.2.0');
    expect(res.imports['@root/only']).to.eql(undefined);
  });

  it('Delivery.create isolates equal and unequal authorities while preserving stable identity', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.startup.delivery.identity-' });
    const root = tmp.absolute;
    await using _root = {
      async [Symbol.asyncDispose]() {
        await Fs.remove(root);
      },
    };
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: '8.0.9' },
    });
    await Fs.writeJson(`${root}/deno.json`, {
      imports: {
        '@sys/http': './src/http.ts',
      },
    });

    const authority = await ViteStartup.Projection.create({
      cwd: root,
      vite: 'npm:vite@8.0.9',
    });
    const first = await ViteStartup.Delivery.create({ authority });
    const second = await ViteStartup.Delivery.create({
      authority: {
        ...authority,
        imports: Object.fromEntries(Object.entries(authority.imports).reverse()),
      },
    });
    const different = await ViteStartup.Delivery.create({
      authority: { ...authority, imports: { ...authority.imports, '@sys/http': './src/other.ts' } },
    });

    try {
      await first.cleanup();
      await first.cleanup(); // Cleanup is idempotent and cannot release another handle's files.
      for (const handle of [second, different]) {
        expect(await Fs.exists(handle.path)).to.eql(true);
        const map = await Fs.readJson<ImportMap>(handle.path);
        const shim = Path.fromFileUrl(map.data?.imports['#module-sync-enabled'] ?? '');
        expect((await Fs.readText(shim)).data).to.eql('export default false;\n');
      }
      expect(await Fs.exists(Path.dirname(first.path))).to.eql(false);
      expect(first.path).not.to.eql(second.path);
      expect(Path.basename(first.path)).to.eql(Path.basename(second.path));
      expect(Path.basename(first.path)).not.to.eql(Path.basename(different.path));
    } finally {
      await first.cleanup();
      await second.cleanup();
      await different.cleanup();
    }
  });

  it('Delivery.create rolls back owned files when setup fails', async () => {
    const { absolute: root } = await Fs.makeTempDir({ prefix: 'vite.startup.delivery.failure-' });
    await using _root = {
      async [Symbol.asyncDispose]() {
        await Fs.remove(root);
      },
    };
    await Fs.writeJson(`${root}/package.json`, {});
    const error = new Error('delivery setup failed');
    const { result } = await Try.run(() =>
      ViteStartup.Delivery.create({
        authority: {
          dir: root,
          imports: {},
          get scopes(): never {
            throw error; // Fail after the shim is written, without mocking filesystem operations.
          },
        },
      })
    );
    expect(result.ok).to.eql(false);
    if (!result.ok) expect(result.error).to.equal(error);
    const parent = Path.join(root, 'node_modules/.vite/.sys-driver-vite/startup');
    const remaining: t.StringPath[] = [];
    for await (const entry of Fs.walk(parent, { maxDepth: 1 })) remaining.push(entry.path);
    expect(remaining).to.eql([parent]);
  });

  it('Delivery.create materializes and cleans up the child startup handle', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.startup.delivery-' });
    const root = tmp.absolute;
    await using _root = {
      async [Symbol.asyncDispose]() {
        await Fs.remove(root);
      },
    };
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
      cwd: root,
      vite: 'npm:vite@8.0.9',
    });
    const handle = await ViteStartup.Delivery.create({ authority });
    const written = await Fs.readJson<ImportMap>(handle.path);

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
    const moduleSyncPath = Path.fromFileUrl(written.data?.imports['#module-sync-enabled'] ?? '');
    expect(await Fs.exists(moduleSyncPath)).to.eql(false);
  });
});

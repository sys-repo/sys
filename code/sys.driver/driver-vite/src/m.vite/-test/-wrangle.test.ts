import { describe, expect, Fs, it, Path } from '../../-test.ts';
import { resolveFromImportMap } from '../../-test/u.importMap.ts';
import { Wrangle } from '../u/u.wrangle.ts';

describe('Vite.Wrangle', () => {
  it('build: scopes child writes to output/cache and network to localhost dns', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle.build-' });
    const root = tmp.absolute;
    const consumerVite = '8.0.2';
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: {
        vite: consumerVite,
        '@vitejs/plugin-react': '6.0.1',
      },
    });
    await Fs.writeJson(`${root}/deno.json`, { imports: { '@sys/http': './src/http.ts' } });
    const paths = {
      cwd: root,
      app: {
        entry: 'index.html',
        outDir: 'dist',
        base: '.',
      },
    } as const;

    const res = await Wrangle.command(paths, 'build');
    const importMapArg = res.args.find((item) => item.startsWith('--import-map='));
    const importMapPath = importMapArg?.replace('--import-map=', '');
    const importMap = importMapPath
      ? await Fs.readJson<{ imports?: Record<string, string> }>(importMapPath)
      : undefined;

    expect(importMapArg).to.be.a('string');
    expect(importMap?.data?.imports?.['vite/internal']).to.eql(`npm:vite@${consumerVite}/internal`);
    expect(importMap?.data?.imports?.['vite/module-runner']).to.eql(
      `npm:vite@${consumerVite}/module-runner`,
    );
    expect(importMap?.data?.imports?.['#module-sync-enabled']).to.match(
      /^file:.*module-sync-enabled\.mjs$/,
    );
    expect(importMap?.data?.imports?.zlib).to.eql('node:zlib');
    expect(importMap?.data?.imports?.fs).to.eql(undefined);
    expect(importMap?.data?.imports?.path).to.eql(undefined);
    expect(importMap?.data?.imports?.['rolldown/experimental']).to.eql(undefined);
    expect(importMap?.data?.imports?.tinyglobby).to.eql(undefined);
    expect(importMap?.data?.imports?.['@rolldown/pluginutils']).to.eql(undefined);
    expect(resolveFromImportMap(importMapPath ?? '', importMap?.data?.imports?.['@sys/http'])).to
      .eql(
        Path.toFileUrl(Path.join(root, 'src/http.ts')).href,
      );
    const allowWrite = res.args.find((item) => item.startsWith('--allow-write='));
    const writeRoots = allowWrite?.replace('--allow-write=', '').split(',') ?? [];
    expect(writeRoots).to.include(Path.resolve(root, 'dist'));
    expect(writeRoots).to.include(`${root}/node_modules/.vite`);
    expect(writeRoots).to.not.include(`${root}/node_modules/.vite-temp`);
    expect(writeRoots).to.not.include(root);
    expect(res.args).to.include('--no-prompt');
    expect(res.args).to.include('--allow-env');
    expect(res.args).to.include('--allow-net=localhost');
    expect(res.args.some((item) => item.includes('0.0.0.0'))).to.eql(false);
    expect(res.args.some((item) => item.includes('[::]'))).to.eql(false);
    expect(res.args).to.include('--allow-sys=osRelease,homedir,uid,gid');
    expect(res.args.filter((item) => item.startsWith('--allow-sys=')).length).to.eql(1);
    const allowFfi = res.args.find((item) => item.startsWith('--allow-ffi='));
    const ffiRoots = allowFfi?.replace('--allow-ffi=', '').split(',') ?? [];
    expect(ffiRoots).to.include(`${root}/node_modules/.deno`);
    expect(res.args).to.not.include('--allow-ffi');
    expect(res.args).to.include(`--allow-run=${Deno.execPath()}`);
    expect(res.args).to.not.include('--allow-run');
    expect(res.args).to.not.include('-A');
    expect(res.args.filter((item) => item.startsWith('--allow-run=')).length).to.eql(1);
    expect(res.args).to.include(`npm:vite@${consumerVite}`);
    expect(res.args).to.include('--configLoader=native');

    await res.dispose();
    expect(importMapPath ? await Fs.exists(importMapPath) : false).to.eql(false);
  });

  it('dev: adds only deno, osRelease, homedir, uid, gid, and networkInterfaces exceptions', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle.dev-' });
    const root = tmp.absolute;
    const consumerVite = '8.0.2';
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: consumerVite },
    });
    const paths = {
      cwd: root,
      app: {
        entry: 'index.html',
        outDir: 'dist',
        base: '.',
      },
    } as const;

    const res = await Wrangle.command(paths, 'dev --port=1234 --host');

    const allowWrite = res.args.find((item) => item.startsWith('--allow-write='));
    expect(allowWrite).to.include(root);
    expect(allowWrite).to.include(`${root}/node_modules/.vite`);
    expect(res.args).to.include('--allow-env');
    expect(res.args).to.include('--allow-net=localhost,127.0.0.1,0.0.0.0,[::1],[::]');
    expect(res.args).to.include('--allow-sys=osRelease,homedir,uid,gid,networkInterfaces');
    expect(res.args.filter((item) => item.startsWith('--allow-sys=')).length).to.eql(1);
    expect(res.args).to.include(`--allow-run=${Deno.execPath()}`);
    expect(res.args.filter((item) => item.startsWith('--allow-run=')).length).to.eql(1);
    expect(res.args).to.include(`npm:vite@${consumerVite}`);
    expect(res.args).to.include('--configLoader=native');
    expect(res.args.find((item) => item.startsWith('--import-map='))).to.be.a('string');
    await res.dispose();
  });

  it('scopes vite cache writes to the consumer cwd instead of the broader package anchor', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle.cache-root-' });
    const root = tmp.absolute;
    const project = `${root}/code/projects/foo`;
    await Fs.ensureDir(project);
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: '8.0.2' },
    });

    const paths = {
      cwd: project,
      app: {
        entry: 'index.html',
        outDir: 'dist',
        base: '.',
      },
    } as const;

    const res = await Wrangle.command(paths, 'dev --port=1234 --host');
    const allowWrite = res.args.find((item) => item.startsWith('--allow-write='));
    expect(allowWrite).to.include(project);
    expect(allowWrite).to.include(`${project}/node_modules/.vite`);
    expect(allowWrite).to.not.include(`${root}/node_modules/.vite`);
    await res.dispose();
  });

  it('anchors npm resolution at the nearest consumer package boundary', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle.anchor-' });
    const root = tmp.absolute;
    const project = `${root}/code/projects/foo`;
    await Fs.ensureDir(project);
    await Fs.writeJson(`${root}/package.json`, { dependencies: {} });

    const res = await Wrangle.packageAnchor(project);
    expect(res).to.eql(`${root}/package.json`);
  });

  it('viteSpecifier: uses consumer package authority for published https module origins', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle.consumer-' });
    const root = tmp.absolute;
    const project = `${root}/code/projects/foo`;
    await Fs.ensureDir(project);
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: '7.3.1' },
    });

    const res = await Wrangle.viteSpecifier(
      project,
      'https://jsr.io/@sys/driver-vite/0.0.317/src/m.vite/u/u.wrangle.ts',
    );
    expect(res).to.eql('npm:vite@7.3.1');
  });

  it('build: keeps Vite 7 on the default config loader', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle.v7-' });
    const root = tmp.absolute;
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: '7.3.1' },
    });
    const paths = {
      cwd: root,
      app: {
        entry: 'index.html',
        outDir: 'dist',
        base: '.',
      },
    } as const;

    const res = await Wrangle.command(paths, 'build');
    expect(res.args).to.include('npm:vite@7.3.1');
    expect(res.args).to.not.include('--configLoader=native');
    const allowWrite = res.args.find((item) => item.startsWith('--allow-write='));
    const writeRoots = allowWrite?.replace('--allow-write=', '').split(',') ?? [];
    expect(writeRoots).to.include(Path.resolve(root, 'dist'));
    expect(writeRoots).to.include(`${root}/node_modules/.vite`);
    expect(writeRoots).to.include(`${root}/node_modules/.vite-temp`);
    expect(writeRoots).to.not.include(root);
    await res.dispose();
  });

  it('viteSpecifier: does not crash when module origin is https and consumer package pins vite', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle.command-' });
    const root = tmp.absolute;
    const project = `${root}/code/projects/foo`;
    await Fs.ensureDir(project);
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: '7.3.1' },
    });

    const consumerVite = await Wrangle.viteSpecifier(
      project,
      'https://jsr.io/@sys/driver-vite/0.0.317/src/m.vite/u/u.wrangle.ts',
    );
    expect(consumerVite).to.eql('npm:vite@7.3.1');
  });
});

import { describe, expect, Fs, it, Path } from '../../-test.ts';
import { resolveFromImportMap } from '../../-test/u.importMap.ts';
import { Wrangle } from '../u.wrangle.ts';

describe('Vite.Wrangle', () => {
  it('build: scopes child permissions to esbuild, deno, and localhost dns only', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle.build-' });
    const root = tmp.absolute;
    const consumerEsbuild = '0.27.4';
    const consumerVite = '8.0.2';
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: {
        vite: consumerVite,
        esbuild: consumerEsbuild,
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

    expect(res.env.ESBUILD_BINARY_PATH).to.include('node_modules/.deno/');
    expect(res.env.ESBUILD_BINARY_PATH).to.include(`@esbuild/`);
    expect(
      res.env.ESBUILD_BINARY_PATH.endsWith('/bin/esbuild') ||
        res.env.ESBUILD_BINARY_PATH.endsWith('\\esbuild.exe'),
    ).to.eql(true);
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
    expect(resolveFromImportMap(importMapPath ?? '', importMap?.data?.imports?.['@sys/http'])).to.eql(
      Path.toFileUrl(Path.join(root, 'src/http.ts')).href,
    );
    const allowWrite = res.args.find((item) => item.startsWith('--allow-write='));
    expect(allowWrite).to.include(root);
    expect(allowWrite).to.include('node_modules/.vite');
    expect(res.args).to.include('--allow-env');
    expect(res.args).to.include('--allow-net=localhost,127.0.0.1,0.0.0.0,[::1],[::]');
    expect(res.args).to.include('--allow-sys=osRelease,homedir,uid,gid');
    expect(res.args.filter((item) => item.startsWith('--allow-sys=')).length).to.eql(1);
    expect(res.args).to.include(`--allow-run=${res.env.ESBUILD_BINARY_PATH},${Deno.execPath()}`);
    expect(res.args).to.not.include('--allow-run');
    expect(res.args).to.not.include('-A');
    expect(res.args.filter((item) => item.startsWith('--allow-run=')).length).to.eql(1);
    expect(res.args).to.include(`npm:vite@${consumerVite}`);
    expect(res.args).to.include('--configLoader=native');
    expect(res.env.ESBUILD_BINARY_PATH).to.include(`@${consumerEsbuild}`);

    await res.dispose();
    expect(importMapPath ? await Fs.exists(importMapPath) : false).to.eql(false);
  });

  it('dev: adds only deno, esbuild, osRelease, homedir, uid, gid, and networkInterfaces exceptions', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle.dev-' });
    const root = tmp.absolute;
    const consumerEsbuild = '0.27.4';
    const consumerVite = '8.0.2';
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: consumerVite, esbuild: consumerEsbuild },
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
    expect(allowWrite).to.include('node_modules/.vite');
    expect(res.args).to.include('--allow-env');
    expect(res.args).to.include('--allow-net=localhost,127.0.0.1,0.0.0.0,[::1],[::]');
    expect(res.args).to.include('--allow-sys=osRelease,homedir,uid,gid,networkInterfaces');
    expect(res.args.filter((item) => item.startsWith('--allow-sys=')).length).to.eql(1);
    expect(res.args).to.include(`--allow-run=${res.env.ESBUILD_BINARY_PATH},${Deno.execPath()}`);
    expect(res.args.filter((item) => item.startsWith('--allow-run=')).length).to.eql(1);
    expect(res.args).to.include(`npm:vite@${consumerVite}`);
    expect(res.args).to.include('--configLoader=native');
    expect(res.env.ESBUILD_BINARY_PATH).to.include(`@${consumerEsbuild}`);
    expect(res.args.find((item) => item.startsWith('--import-map='))).to.be.a('string');
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
      'https://jsr.io/@sys/driver-vite/0.0.317/src/m.vite/u.wrangle.ts',
    );
    expect(res).to.eql('npm:vite@7.3.1');
  });

  it('build: keeps Vite 7 on the default config loader', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle.v7-' });
    const root = tmp.absolute;
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: '7.3.1', esbuild: '0.27.3' },
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
    await res.dispose();
  });

  it('viteSpecifier: does not crash when module origin is https and consumer package pins vite', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle.command-' });
    const root = tmp.absolute;
    const project = `${root}/code/projects/foo`;
    await Fs.ensureDir(project);
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: '7.3.1', esbuild: '0.27.3' },
    });

    const consumerVite = await Wrangle.viteSpecifier(
      project,
      'https://jsr.io/@sys/driver-vite/0.0.317/src/m.vite/u.wrangle.ts',
    );
    expect(consumerVite).to.eql('npm:vite@7.3.1');
  });
});

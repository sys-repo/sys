import { describe, expect, it } from '../../-test.ts';
import { Wrangle } from '../u.wrangle.ts';
import { Fs, ROOT } from '../../-test.ts';

async function rootVersions() {
  const pkg = (await Fs.readJson<{
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  }>(ROOT.resolve('package.json'))).data ?? {};
  return {
    vite: pkg.dependencies?.vite ?? pkg.devDependencies?.vite ?? '',
    esbuild: pkg.dependencies?.esbuild ?? pkg.devDependencies?.esbuild ?? '',
  } as const;
}

describe('Vite.Wrangle', () => {
  it('build: scopes child permissions to esbuild, deno, and localhost dns only', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle.build-' });
    const root = tmp.absolute;
    const consumerEsbuild = '0.27.4';
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: '8.0.2', esbuild: consumerEsbuild, '@vitejs/plugin-react': '6.0.1' },
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

    const versions = await rootVersions();
    const res = await Wrangle.command(paths, 'build');
    const importMapArg = res.args.find((item) => item.startsWith('--import-map='));
    const importMapPath = importMapArg?.replace('--import-map=', '');
    const importMap = importMapPath ? await Fs.readJson<{ imports?: Record<string, string> }>(importMapPath) : undefined;

    expect(res.env.ESBUILD_BINARY_PATH).to.include('node_modules/.deno/');
    expect(res.env.ESBUILD_BINARY_PATH).to.include(`@esbuild/`);
    expect(
      res.env.ESBUILD_BINARY_PATH.endsWith('/bin/esbuild') ||
        res.env.ESBUILD_BINARY_PATH.endsWith('\\esbuild.exe'),
    ).to.eql(true);
    expect(importMapArg).to.be.a('string');
    expect(importMap?.data?.imports?.['vite/internal']).to.eql(`npm:vite@${versions.vite}/internal`);
    expect(importMap?.data?.imports?.['vite/module-runner']).to.eql(`npm:vite@${versions.vite}/module-runner`);
    expect(importMap?.data?.imports?.['#module-sync-enabled']).to.match(/^file:.*module-sync-enabled\.mjs$/);
    expect(importMap?.data?.imports?.['rolldown/experimental']).to.eql('npm:rolldown@1.0.0-rc.11/experimental');
    expect(importMap?.data?.imports?.zlib).to.eql('node:zlib');
    expect(importMap?.data?.imports?.tinyglobby).to.eql('npm:tinyglobby@^0.2.15');
    expect(importMap?.data?.imports?.['@rolldown/pluginutils']).to.eql('npm:@rolldown/pluginutils@1.0.0-rc.7');
    expect(importMap?.data?.imports?.['@sys/http']).to.eql('./src/http.ts');
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
    expect(res.args).to.include(`npm:vite@${versions.vite}`);
    expect(res.args).to.include('--configLoader=native');
    expect(res.env.ESBUILD_BINARY_PATH).to.include(`@${consumerEsbuild}`);

    await res.dispose();
    expect(importMapPath ? await Fs.exists(importMapPath) : false).to.eql(false);
  });

  it('dev: adds only deno, esbuild, osRelease, homedir, uid, gid, and networkInterfaces exceptions', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle.dev-' });
    const root = tmp.absolute;
    const consumerEsbuild = '0.27.4';
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: '8.0.2', esbuild: consumerEsbuild },
    });
    const paths = {
      cwd: root,
      app: {
        entry: 'index.html',
        outDir: 'dist',
        base: '.',
      },
    } as const;

    const versions = await rootVersions();
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
    expect(res.args).to.include(`npm:vite@${versions.vite}`);
    expect(res.args).to.include('--configLoader=native');
    expect(res.env.ESBUILD_BINARY_PATH).to.include(`@${consumerEsbuild}`);
    expect(res.args.find((item) => item.startsWith('--import-map='))).to.be.a('string');
    await res.dispose();
  });

  it('anchors npm resolution at the nearest consumer package boundary', () => {
    const root = '/tmp/repo';
    const original = Deno.statSync;

    Deno.statSync = ((path: string | URL) => {
      if (String(path) === '/tmp/repo/package.json') {
        return { isFile: true } as Deno.FileInfo;
      }
      throw new Deno.errors.NotFound('missing');
    }) as typeof Deno.statSync;

    try {
      const res = Wrangle.packageAnchor('/tmp/repo/code/projects/foo');
      expect(res).to.eql('/tmp/repo/package.json');
    } finally {
      Deno.statSync = original;
    }
  });

  it('viteSpecifier: uses consumer package authority for published https module origins', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'vite.wrangle.consumer-' });
    const root = tmp.absolute;
    const project = `${root}/code/projects/foo`;
    await Fs.ensureDir(project);
    await Fs.writeJson(`${root}/package.json`, {
      dependencies: { vite: '7.3.1' },
    });

    const res = await Wrangle.viteSpecifier(project, 'https://jsr.io/@sys/driver-vite/0.0.317/src/m.vite/u.wrangle.ts');
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

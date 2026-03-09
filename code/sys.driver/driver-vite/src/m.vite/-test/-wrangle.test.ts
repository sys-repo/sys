import { describe, expect, it } from '../../-test.ts';
import { Wrangle } from '../u.wrangle.ts';

describe('Vite.Wrangle', () => {
  it('build: scopes child run permission to esbuild and deno only', async () => {
    const paths = {
      cwd: '/tmp/demo',
      app: {
        entry: 'index.html',
        outDir: 'dist',
        base: '.',
      },
    } as const;

    const res = await Wrangle.command(paths, 'build');

    expect(res.env.ESBUILD_BINARY_PATH).to.include('node_modules/.deno/esbuild@');
    expect(res.env.ESBUILD_BINARY_PATH).to.include('node_modules/@esbuild/');
    expect(
      res.env.ESBUILD_BINARY_PATH.endsWith('/bin/esbuild') ||
        res.env.ESBUILD_BINARY_PATH.endsWith('\\esbuild.exe'),
    ).to.eql(true);
    const allowWrite = res.args.find((item) => item.startsWith('--allow-write='));
    expect(allowWrite).to.include('/tmp/demo');
    expect(allowWrite).to.include('node_modules/.vite');
    expect(res.args).to.include('--allow-env');
    expect(res.args).to.include(`--allow-run=${res.env.ESBUILD_BINARY_PATH},${Deno.execPath()}`);
    expect(res.args).to.not.include('--allow-run');
    expect(res.args).to.not.include('-A');
    expect(res.args.filter((item) => item.startsWith('--allow-run=')).length).to.eql(1);
  });

  it('dev: adds only deno, esbuild, and networkInterfaces exceptions', async () => {
    const paths = {
      cwd: '/tmp/demo',
      app: {
        entry: 'index.html',
        outDir: 'dist',
        base: '.',
      },
    } as const;

    const res = await Wrangle.command(paths, 'dev --port=1234 --host');

    const allowWrite = res.args.find((item) => item.startsWith('--allow-write='));
    expect(allowWrite).to.include('/tmp/demo');
    expect(allowWrite).to.include('node_modules/.vite');
    expect(res.args).to.include('--allow-env');
    expect(res.args).to.include('--allow-sys=networkInterfaces');
    expect(res.args.filter((item) => item.startsWith('--allow-sys=')).length).to.eql(1);
    expect(res.args).to.include(`--allow-run=${res.env.ESBUILD_BINARY_PATH},${Deno.execPath()}`);
    expect(res.args.filter((item) => item.startsWith('--allow-run=')).length).to.eql(1);
  });
});

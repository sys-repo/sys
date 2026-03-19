import { describe, expect, Fs, it, Pkg } from '../../../../-test.ts';
import { DenoDeploy } from '../../mod.ts';
import { DeployCli } from '../../u.cli/mod.ts';
import { createStageWorkspace } from '../../m.stage/-test/u.fixture.workspace.ts';

describe('DenoDeploy.deploy', { sanitizeResources: false }, () => {
  it('builds native deno deploy cli invocation from a staged artifact', () => {
    const stage = {
      target: { dir: '/repo/apps/foo' },
      workspace: {
        exists: true,
        dir: '/repo',
        path: '/repo/deno.json',
        file: { workspace: ['./apps/foo'] },
        denofile: { workspace: ['./apps/foo'] },
        pkg: {},
        children: [],
      },
      root: '/tmp/stage',
      entry: '/tmp/stage/entry.ts',
    } as any;

    const cli = DeployCli.deploy({
      stage,
      app: 'my-app',
      org: 'my-org',
      token: 'abc123',
      config: '/tmp/stage/deno.json',
      prod: true,
      allowNodeModules: true,
      noWait: true,
      log: { process: true },
    });

    expect(cli).to.eql({
      cmd: 'deno',
      cwd: '/tmp/stage',
      args: [
        'deploy',
        '--app',
        'my-app',
        '--org',
        'my-org',
        '--token',
        'abc123',
        '--config',
        '/tmp/stage/deno.json',
        '--prod',
        '--allow-node-modules',
        '--no-wait',
        '/tmp/stage',
      ],
    });
  });

  it('returns minimal cli invocation for the required deploy request surface', () => {
    const stage = {
      target: { dir: '/repo/apps/foo' },
      workspace: {} as any,
      root: '/tmp/stage',
      entry: '/tmp/stage/entry.ts',
    };

    const cli = DeployCli.deploy({ stage, app: 'my-app' });
    expect(cli).to.eql({
      cmd: 'deno',
      cwd: '/tmp/stage',
      args: [
        'deploy',
        '--app',
        'my-app',
        '--config',
        '/tmp/stage/deno.json',
        '/tmp/stage',
      ],
    });
  });

  it('builds logs cli invocation from an isolated temp root', async () => {
    const logs = await DeployCli.logs({
      app: 'my-app',
      org: 'my-org',
      token: 'abc123',
      start: '2026-03-17T00:00:00Z',
    });

    expect(logs.cli.cmd).to.eql('deno');
    expect(logs.cli.cwd).to.eql(logs.root);
    expect(logs.cli.args).to.eql([
      'deploy',
      'logs',
      '--app',
      'my-app',
      '--org',
      'my-org',
      '--token',
      'abc123',
      '--start',
      '2026-03-17T00:00:00Z',
      '--config',
      logs.config,
    ]);
    expect(logs.root).to.contain('sys.driver.deno.deploy.logs-');
    expect(await Fs.exists(logs.config)).to.be.true;
    expect((await Fs.readJson(logs.config)).data).to.eql({});
  });

  it('serves the staged target dist index and emitted js from generated entry.ts', async () => {
    const fs = await createStageWorkspace();
    const stage = await DenoDeploy.stage({ target: { dir: fs.join('code/apps/foo') } });
    const stagedTarget = Fs.join(stage.root, 'code', 'apps', 'foo');
    const html = '<!doctype html><html><body><script type="module" src="/pkg/app.js"></script></body></html>';
    const pkg = { name: '@test/foo', version: '0.0.0' } as const;
    await Fs.write(
      Fs.join(stagedTarget, 'src', 'pkg.ts'),
      `export const pkg = ${JSON.stringify(pkg)} as const;\n`,
    );
    await Fs.write(Fs.join(stagedTarget, 'dist', 'index.html'), html);
    await Pkg.Dist.compute({
      dir: Fs.join(stagedTarget, 'dist'),
      pkg,
      save: true,
    });

    const mod = await import(`file://${stage.root}/entry.ts`);
    const res = await mod.default.fetch(new Request('http://local/'));
    const body = await res.text();
    const expectedHtml = (await Fs.readText(Fs.join(stagedTarget, 'dist', 'index.html'))).data ?? '';

    expect(res.status).to.eql(200);
    expect(res.headers.get('content-type')).to.contain('text/html');
    expect(body).to.eql(expectedHtml);

    const assetUrl = body.match(/src="([^"]+\.js)"/)?.[1] ?? '';
    expect(assetUrl).to.not.eql('');

    const assetRes = await mod.default.fetch(new Request(new URL(assetUrl, 'http://local/').toString()));
    expect(assetRes.status).to.eql(200);
    expect(assetRes.headers.get('content-type')).to.contain('javascript');
  });
});

import { describe, expect, expectTypeOf, Fs, it } from '../../../../-test.ts';
import { DenoDeploy } from '../../mod.ts';
import { toDeployArgs } from '../u.deployArgs.ts';
import { createDeployableRepoPkg, prepareStageForExistingApp } from '../-test.external/u.fixture.ts';

describe('DenoDeploy.deploy', { sanitizeResources: false }, () => {
  it('builds native deno deploy args from a staged artifact', () => {
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
      entry: '/tmp/stage/deploy.entry.ts',
    } as any;

    const args = toDeployArgs({
      stage,
      app: 'my-app',
      org: 'my-org',
      token: 'abc123',
      config: '/tmp/stage/deno.json',
      prod: true,
      allowNodeModules: true,
      noWait: true,
      silent: true,
    });

    expect(args).to.eql([
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
    ]);
  });

  it('returns minimal args for the required deploy request surface', () => {
    const stage = {
      target: { dir: '/repo/apps/foo' },
      workspace: {} as any,
      root: '/tmp/stage',
      entry: '/tmp/stage/deploy.entry.ts',
    };

    const args = toDeployArgs({ stage, app: 'my-app' });
    expectTypeOf(args).toEqualTypeOf<string[]>();
    expect(args).to.eql([
      'deploy',
      '--app',
      'my-app',
      '--config',
      '/tmp/stage/deno.json',
      '/tmp/stage',
    ]);
  });

  it('serves the staged target dist index and emitted js from generated main.ts', async () => {
    const { pkgDir } = await createDeployableRepoPkg();
    const stage = await DenoDeploy.stage({ target: { dir: pkgDir } });
    await prepareStageForExistingApp(stage);

    const mod = await import(`file://${stage.root}/main.ts`);
    const res = await mod.default.fetch(new Request('http://local/'));
    const body = await res.text();
    const expectedHtml = (await Fs.readText(Fs.join(stage.root, 'code', 'projects', 'foo', 'dist', 'index.html'))).data ?? '';

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

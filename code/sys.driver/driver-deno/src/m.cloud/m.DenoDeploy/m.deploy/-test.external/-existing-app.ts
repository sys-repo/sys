import { c, describe, Http, it } from './common.ts';
import { DenoDeploy } from '../../mod.ts';
import { printExternalDeployInfo, requireDeployEnv, toDeployFailure } from './u.env.ts';
import { createDeployableRepoPkg, prepareStageForExistingApp, printDeployEntrypointInfo } from './u.fixture.ts';

describe('DenoDeploy.deploy (external)', () => {
  it('prints the external Deno Deploy config', () => {
    printExternalDeployInfo();
  });

  it('deploys a staged tmpl repo/pkg target to an existing Deno Deploy app', async () => {
    const deployEnv = requireDeployEnv();
    const { pkgDir } = await createDeployableRepoPkg();
    const stage = await DenoDeploy.stage({ target: { dir: pkgDir } });
    const entrypoint = await prepareStageForExistingApp(stage);
    printDeployEntrypointInfo(entrypoint);
    const result = await DenoDeploy.deploy({
      stage,
      app: deployEnv.app,
      ...(deployEnv.org ? { org: deployEnv.org } : {}),
      ...(deployEnv.token ? { token: deployEnv.token } : {}),
      silent: true,
    });

    if (!result.ok) {
      if ('error' in result) throw result.error;
      throw new Error(toDeployFailure(result));
    }

    printDeployResult(result);
    if (!result.deploy?.previewUrl) throw new Error('Expected DenoDeploy.deploy to return previewUrl.');
    await assertPreviewServesHtml(result.deploy.previewUrl);
  });
});

function printDeployResult(result: Extract<Awaited<ReturnType<typeof DenoDeploy.deploy>>, { ok: true }>) {
  console.info(`DenoDeploy (${c.bold(c.brightGreen('live'))} external deploy result):`);
  console.info('');
  console.info({
    ok: result.ok,
    code: result.code,
    deploy: result.deploy,
  });
  console.info('');
  printDeployEndpoints(result);
}

function printDeployEndpoints(result: Extract<Awaited<ReturnType<typeof DenoDeploy.deploy>>, { ok: true }>) {
  console.info(c.gray('Endpoints:'));
  if (result.deploy?.revisionUrl) {
    console.info(`  ${c.gray('revision:'.padEnd(11))} ${c.white(result.deploy.revisionUrl)}`);
  }
  if (result.deploy?.previewUrl) {
    console.info(`  ${c.gray('preview:'.padEnd(11))} ${c.white(result.deploy.previewUrl)}`);
  }
  console.info('');
}

async function assertPreviewServesHtml(url: string) {
  const fetch = Http.fetcher();
  let last: { status: number; contentType: string; body: string } | undefined;

  for (let i = 0; i < 5; i++) {
    const res = await fetch.text(url);
    const body = res.data ?? '';
    const contentType = res.headers.get('content-type') ?? '';
    last = { status: res.status, contentType, body };

    const isHtml =
      res.status === 200 &&
      contentType.includes('text/html') &&
      (body.includes('<!doctype html') || body.includes('<html'));
    if (isHtml) return;
    if (i < 4) await wait(2000);
  }

  throw new Error(
    [
      `Expected deployed preview URL to serve HTML: ${url}`,
      `status: ${last?.status ?? 0}`,
      `content-type: ${last?.contentType ?? ''}`,
      '',
      last?.body ?? '',
    ].join('\n'),
  );
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

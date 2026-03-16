import { c, describe, it } from './common.ts';
import { DenoDeploy } from '../../mod.ts';
import { printExternalDeployInfo, requireDeployEnv, toDeployFailure } from './u.env.ts';
import { createDeployableRepoPkg, prepareStageForExistingApp, printDeployEntrypointInfo } from './u.fixture.ts';

describe('DenoDeploy.deploy (external prebuilt dist)', () => {
  it('prints the external Deno Deploy config', () => {
    printExternalDeployInfo();
  });

  it('deploys a staged tmpl repo/pkg target with prebuilt dist to an existing Deno Deploy app', async () => {
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
    await assertPreviewServesBuiltApp(result.deploy.previewUrl);
  });
});

function printDeployResult(result: Extract<Awaited<ReturnType<typeof DenoDeploy.deploy>>, { ok: true }>) {
  console.info(`DenoDeploy (${c.bold(c.brightGreen('live'))} external prebuilt dist result):`);
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

async function assertPreviewServesBuiltApp(url: string) {
  let last:
    | {
        status: number;
        contentType: string;
        body: string;
        assetUrl?: string;
        assetStatus?: number;
        assetContentType?: string;
      }
    | undefined;

  for (let i = 0; i < 24; i++) {
    const res = await fetch(url);
    const body = await res.text();
    const contentType = res.headers.get('content-type') ?? '';
    const assetUrl = body.match(/src="([^"]+\.js)"/)?.[1];
    let assetStatus: number | undefined;
    let assetContentType: string | undefined;

    if (assetUrl) {
      const assetRes = await fetch(new URL(assetUrl, url));
      assetStatus = assetRes.status;
      assetContentType = assetRes.headers.get('content-type') ?? '';
      await assetRes.text();
    }

    last = { status: res.status, contentType, body, assetUrl, assetStatus, assetContentType };

    const isHtml =
      res.status === 200 &&
      contentType.includes('text/html') &&
      body.trim().length > 0 &&
      (body.includes('<!doctype html') || body.includes('<!DOCTYPE html') || body.includes('<html'));
    const hasScript = Boolean(assetUrl) && assetStatus === 200 && (assetContentType?.includes('javascript') ?? false);
    if (isHtml && hasScript) return;
    if (i < 23) await wait(5000);
  }

  throw new Error(
    [
      `Expected deployed preview URL to serve built HTML app: ${url}`,
      `status: ${last?.status ?? 0}`,
      `content-type: ${last?.contentType ?? ''}`,
      `asset: ${last?.assetUrl ?? ''}`,
      `asset status: ${last?.assetStatus ?? 0}`,
      `asset content-type: ${last?.assetContentType ?? ''}`,
      '',
      last?.body ?? '',
    ].join('\n'),
  );
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

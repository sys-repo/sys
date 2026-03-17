import { type t, Http, Str, expect } from './common.ts';

type PreviewProbe = {
  readonly status: number;
  readonly contentType: string;
  readonly body: string;
  readonly assetUrl?: string;
  readonly assetStatus?: number;
  readonly assetContentType?: string;
};

export async function assertPreviewServesBuiltApp(url: t.StringUrl) {
  let last: PreviewProbe | undefined;

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
      (body.includes('<!doctype html') ||
        body.includes('<!DOCTYPE html') ||
        body.includes('<html'));
    const hasScript =
      Boolean(assetUrl) &&
      assetStatus === 200 &&
      (assetContentType?.includes('javascript') ?? false);
    if (isHtml && hasScript) return;
    if (i < 23) await wait(5000);
  }

  throw new Error(
    Str.dedent(`
    Expected deployed preview URL to serve built HTML app: ${url}
    status: ${last?.status ?? 0}
    content-type: ${last?.contentType ?? ''}
    asset: ${last?.assetUrl ?? ''}
    asset status: ${last?.assetStatus ?? 0}
    asset content-type: ${last?.assetContentType ?? ''}

    ${last?.body ?? ''}
  `),
  );
}

export async function assertStageUsesGeneratedRootEntry(args: {
  readonly entrypoint: string;
  readonly entryPaths: string;
}) {
  const entry = (await Http.Fs.readText(args.entrypoint)).data ?? '';
  const entryPaths = (await Http.Fs.readText(args.entryPaths)).data ?? '';

  expect(entry).to.include(`import { targetDir } from './entry.paths.ts';`);
  expect(entry).to.include(`export default await DenoEntry.serve({ targetDir });`);
  expect(entryPaths).to.include(`export const targetDir = './`);
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
